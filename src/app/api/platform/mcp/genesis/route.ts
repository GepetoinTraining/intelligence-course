/**
 * Genesis MCP Route — HTTP transport for the MCP protocol
 *
 * This is the single entry point for all Claude instances to access Genesis.
 * Handles JSON-RPC: initialize, tools/list, tools/call, notifications/initialized
 *
 * Auth: GENESIS_TOKEN bearer token OR Clerk session with platform owner role.
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { organizationMemberships } from '@/lib/db/schema';
import { GENESIS_TOOLS, executeGenesisTool } from '@/lib/genesis';

// ============================================================================
// Auth
// ============================================================================

async function verifyGenesisAccess(req: NextRequest): Promise<string> {
    // Path 1: Bearer token (hooks, external connectors)
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        if (token !== process.env.GENESIS_TOKEN) {
            throw new Error('Invalid Genesis token');
        }
        const ownerPersonId = process.env.GENESIS_OWNER_PERSON_ID;
        if (!ownerPersonId) {
            throw new Error('GENESIS_OWNER_PERSON_ID not configured');
        }
        return ownerPersonId;
    }

    // Path 2: Clerk session (in-app access)
    // Lazy import to avoid circular deps in edge runtime
    const { getApiAuthWithOrg } = await import('@/lib/auth');
    const { personId, orgId } = await getApiAuthWithOrg();

    const membership = await db.select()
        .from(organizationMemberships)
        .where(and(
            eq(organizationMemberships.personId, personId),
            eq(organizationMemberships.organizationId, orgId),
            eq(organizationMemberships.role, 'owner'),
        ))
        .limit(1);

    if (!membership.length) {
        throw new Error('Genesis access denied — platform owner only');
    }

    return personId;
}

// ============================================================================
// JSON-RPC helpers
// ============================================================================

function jsonRpcResponse(id: unknown, result: unknown) {
    return Response.json({ jsonrpc: '2.0', id, result });
}

function jsonRpcError(id: unknown, code: number, message: string) {
    return Response.json({ jsonrpc: '2.0', id, error: { code, message } });
}

// ============================================================================
// Route Handler
// ============================================================================

export async function POST(req: NextRequest) {
    let personId: string;
    try {
        personId = await verifyGenesisAccess(req);
    } catch (error: any) {
        return new Response(error.message || 'Unauthorized', { status: 403 });
    }

    const body = await req.json();
    const { method, id, params } = body;

    switch (method) {
        case 'initialize':
            return jsonRpcResponse(id, {
                protocolVersion: '2024-11-05',
                capabilities: { tools: {} },
                serverInfo: { name: 'genesis', version: '0.1.0' },
            });

        case 'notifications/initialized':
            return jsonRpcResponse(id, {});

        case 'tools/list':
            return jsonRpcResponse(id, { tools: GENESIS_TOOLS });

        case 'tools/call': {
            const toolName = params?.name;
            const args = params?.arguments || {};

            if (!toolName) {
                return jsonRpcError(id, -32602, 'Missing tool name');
            }

            try {
                const result = await executeGenesisTool(personId, toolName, args);
                return jsonRpcResponse(id, {
                    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                });
            } catch (error: any) {
                return jsonRpcError(id, -32000, error.message || 'Tool execution failed');
            }
        }

        default:
            return jsonRpcError(id, -32601, `Unknown method: ${method}`);
    }
}

// Also handle GET for health check
export async function GET() {
    return Response.json({
        name: 'genesis',
        version: '0.1.0',
        status: 'operational',
        tools: GENESIS_TOOLS.map(t => t.name),
    });
}
