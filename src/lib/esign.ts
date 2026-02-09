import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { sendNotification, findStaffToNotify } from '@/lib/notifications';

// ============================================================================
// E-SIGNATURE SERVICE
// Integrates with ZapSign (primary) and D4Sign (secondary) for BR e-signatures
// Also supports in-person signing and Gov.br (future)
// ============================================================================

const ZAPSIGN_API = 'https://api.zapsign.com.br/api/v1';

export type SignatureProvider = 'in_person' | 'zapsign' | 'd4sign' | 'gov_br';

export interface SignatureRequest {
    provider: SignatureProvider;
    orgId: string;
    contractId: string;
    contractNumber: string;
    documentHtml: string;            // HTML content of the contract
    signers: SignerInfo[];
    webhookUrl?: string;
    expirationDays?: number;
    sendAutomaticEmail?: boolean;
    sendAutomaticWhatsApp?: boolean;
}

export interface SignerInfo {
    name: string;
    email: string;
    phone?: string;
    taxId?: string;                   // CPF
    role: 'contratante' | 'contratado' | 'testemunha' | 'responsavel_legal';
    authMethod?: 'screen' | 'email_token' | 'sms_token';
}

export interface SignatureResult {
    success: boolean;
    provider: SignatureProvider;
    externalDocId?: string;          // Provider's document ID
    externalDocToken?: string;       // Provider's document token
    signLinks?: { name: string; email: string; signUrl: string }[];
    error?: string;
}

// ============================================================================
// MAIN DISPATCH
// ============================================================================

export async function requestSignature(req: SignatureRequest): Promise<SignatureResult> {
    switch (req.provider) {
        case 'zapsign':
            return await requestZapSign(req);
        case 'd4sign':
            return await requestD4Sign(req);
        case 'in_person':
            return await handleInPersonSignature(req);
        case 'gov_br':
            return { success: false, provider: 'gov_br', error: 'Gov.br integration coming soon' };
        default:
            return { success: false, provider: req.provider, error: 'Unknown provider' };
    }
}

// ============================================================================
// ZAPSIGN INTEGRATION
// API Docs: https://docs.zapsign.com.br
// ============================================================================

async function requestZapSign(req: SignatureRequest): Promise<SignatureResult> {
    const apiToken = process.env.ZAPSIGN_API_TOKEN;
    if (!apiToken) {
        return { success: false, provider: 'zapsign', error: 'ZAPSIGN_API_TOKEN not configured' };
    }

    try {
        // Step 1: Convert HTML to base64 PDF
        // ZapSign accepts base64 PDF or URL. We'll send base64.
        const htmlBase64 = Buffer.from(req.documentHtml, 'utf-8').toString('base64');

        // Step 2: Create document with signers
        const zapSignPayload = {
            name: `Contrato ${req.contractNumber}`,
            url_pdf: '',                                     // We'll use base64
            base64_pdf: `data:text/html;base64,${htmlBase64}`,
            external_id: req.contractId,
            signers: req.signers.map((s, idx) => ({
                name: s.name,
                email: s.email,
                phone_country: '55',
                phone_number: s.phone?.replace(/\D/g, '') || '',
                auth_mode: s.authMethod === 'email_token' ? 'assinaturaTela'
                    : s.authMethod === 'sms_token' ? 'tokenSms'
                        : 'assinaturaTela',
                send_automatic_email: req.sendAutomaticEmail ?? true,
                send_automatic_whatsapp: req.sendAutomaticWhatsApp ?? false,
                order_group: idx,
                cpf: s.taxId?.replace(/\D/g, '') || '',
            })),
            lang: 'pt-br',
            disable_signer_emails: !(req.sendAutomaticEmail ?? true),
            expiration_days: req.expirationDays || 30,
            folder_path: '/contratos-matricula',
        };

        const response = await fetch(`${ZAPSIGN_API}/docs/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiToken}`,
            },
            body: JSON.stringify(zapSignPayload),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('[ZapSign] API Error:', response.status, errorBody);
            return {
                success: false,
                provider: 'zapsign',
                error: `ZapSign API error: ${response.status} — ${errorBody}`,
            };
        }

        const zapResult = await response.json();

        // Extract sign URLs for each signer
        const signLinks = (zapResult.signers || []).map((signer: any) => ({
            name: signer.name,
            email: signer.email,
            signUrl: signer.sign_url || `https://app.zapsign.com.br/verificar/${signer.token}`,
        }));

        // Update contract record with ZapSign metadata
        await updateContractSigningStatus(req.contractId, {
            provider: 'zapsign',
            externalDocId: zapResult.token || zapResult.open_id,
            externalDocToken: zapResult.token,
            status: 'sent',
            signLinks,
        });

        return {
            success: true,
            provider: 'zapsign',
            externalDocId: zapResult.token || zapResult.open_id,
            externalDocToken: zapResult.token,
            signLinks,
        };
    } catch (error: any) {
        console.error('[ZapSign] Integration error:', error);
        return {
            success: false,
            provider: 'zapsign',
            error: error.message || 'Failed to connect to ZapSign',
        };
    }
}

// ============================================================================
// D4SIGN INTEGRATION (stub — similar pattern)
// ============================================================================

async function requestD4Sign(req: SignatureRequest): Promise<SignatureResult> {
    const apiToken = process.env.D4SIGN_API_TOKEN;
    const cryptKey = process.env.D4SIGN_CRYPT_KEY;

    if (!apiToken || !cryptKey) {
        return { success: false, provider: 'd4sign', error: 'D4SIGN_API_TOKEN or D4SIGN_CRYPT_KEY not configured' };
    }

    try {
        // D4Sign flow:
        // 1. Upload document → gets documentId
        // 2. Add signers to document
        // 3. Send document for signing

        // Step 1: Upload
        const uploadResponse = await fetch(`https://secure.d4sign.com.br/api/v1/documents/upload?tokenAPI=${apiToken}&cryptKey=${cryptKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                uuid_folder: process.env.D4SIGN_FOLDER_UUID || '',
                name_document: `Contrato_${req.contractNumber}.html`,
                base64_binary_file: Buffer.from(req.documentHtml, 'utf-8').toString('base64'),
                mime_type: 'text/html',
            }),
        });

        if (!uploadResponse.ok) {
            return { success: false, provider: 'd4sign', error: 'Failed to upload document to D4Sign' };
        }

        const uploadResult = await uploadResponse.json();
        const docUuid = uploadResult.uuid;

        // Step 2: Add signers
        for (const signer of req.signers) {
            await fetch(`https://secure.d4sign.com.br/api/v1/documents/${docUuid}/createlist?tokenAPI=${apiToken}&cryptKey=${cryptKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    signers: [{
                        email: signer.email,
                        act: signer.role === 'contratante' ? '1' : signer.role === 'testemunha' ? '5' : '1',
                        foreign: '0',
                        certificadoicpbr: '0',
                        assinatura_presencial: '0',
                        docauth: '0',
                        docauthandselfie: '0',
                        embed_methodauth: 'email',
                        upload_allow: '0',
                        name: signer.name,
                        cpf: signer.taxId?.replace(/\D/g, '') || '',
                    }],
                }),
            });
        }

        // Step 3: Send for signing
        await fetch(`https://secure.d4sign.com.br/api/v1/documents/${docUuid}/sendtosigner?tokenAPI=${apiToken}&cryptKey=${cryptKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `Olá! Segue o contrato ${req.contractNumber} para sua assinatura.`,
                skip_email: '0',
                workflow: '0',
            }),
        });

        await updateContractSigningStatus(req.contractId, {
            provider: 'd4sign',
            externalDocId: docUuid,
            status: 'sent',
        });

        return {
            success: true,
            provider: 'd4sign',
            externalDocId: docUuid,
        };
    } catch (error: any) {
        console.error('[D4Sign] Integration error:', error);
        return {
            success: false,
            provider: 'd4sign',
            error: error.message || 'Failed to connect to D4Sign',
        };
    }
}

// ============================================================================
// IN-PERSON SIGNING
// ============================================================================

async function handleInPersonSignature(req: SignatureRequest): Promise<SignatureResult> {
    // For in-person signing, we just mark the contract as awaiting in-person signature
    await updateContractSigningStatus(req.contractId, {
        provider: 'in_person',
        status: 'awaiting_in_person',
    });

    // Find staff to notify
    const staffToNotify = await findStaffToNotify(req.orgId, undefined, 2);

    if (staffToNotify.length) {
        await sendNotification({
            orgId: req.orgId,
            recipients: staffToNotify,
            title: '✍️ Assinatura Presencial Pendente',
            message: `Contrato ${req.contractNumber} aguarda assinatura presencial de ${req.signers[0]?.name || 'responsável'}`,
            icon: 'pencil',
            color: 'orange',
            category: 'contract',
            priority: 'normal',
            sourceType: 'contract',
            sourceId: req.contractId,
            actionLabel: 'Ver Contrato',
            actionUrl: '/admin/operacional/contratos',
        });
    }

    return {
        success: true,
        provider: 'in_person',
        signLinks: [],
    };
}

// ============================================================================
// WEBHOOK HANDLER (for ZapSign/D4Sign callbacks)
// ============================================================================

export interface WebhookPayload {
    provider: SignatureProvider;
    event: string;
    documentId: string;
    signerEmail?: string;
    signerName?: string;
    signedAt?: string;
    allSigned?: boolean;
    rawPayload: any;
}

export async function handleSignatureWebhook(payload: WebhookPayload): Promise<void> {
    const { provider, event, documentId } = payload;

    // Find the contract by external doc ID
    const contract = await db.get(sql`
        SELECT id, organization_id, signing_metadata 
        FROM contracts 
        WHERE signing_external_id = ${documentId}
        LIMIT 1
    `) as any;

    if (!contract) {
        console.warn(`[E-Sign Webhook] No contract found for external ID: ${documentId}`);
        return;
    }

    const orgId = contract.organization_id;

    switch (event) {
        case 'doc_signed':
        case 'signed': {
            // Individual signer signed
            await db.run(sql`
                UPDATE contracts
                SET signing_status = 'partially_signed',
                    updated_at = unixepoch()
                WHERE id = ${contract.id}
            `);

            // If all signed
            if (payload.allSigned) {
                await db.run(sql`
                    UPDATE contracts
                    SET signing_status = 'signed',
                        status = 'signed',
                        signed_at = unixepoch(),
                        updated_at = unixepoch()
                    WHERE id = ${contract.id}
                `);

                const staffToNotify = await findStaffToNotify(orgId, undefined, 2);
                if (staffToNotify.length) {
                    await sendNotification({
                        orgId,
                        recipients: staffToNotify,
                        title: '✅ Contrato Totalmente Assinado',
                        message: `Todos os signatários assinaram o contrato ${contract.id}`,
                        icon: 'check',
                        color: 'green',
                        category: 'contract',
                        priority: 'high',
                        sourceType: 'contract',
                        sourceId: contract.id,
                    });
                }
            }
            break;
        }

        case 'doc_refused':
        case 'refused': {
            await db.run(sql`
                UPDATE contracts
                SET signing_status = 'refused',
                    status = 'rejected',
                    updated_at = unixepoch()
                WHERE id = ${contract.id}
            `);

            const staffToNotify = await findStaffToNotify(orgId, undefined, 2);
            if (staffToNotify.length) {
                await sendNotification({
                    orgId,
                    recipients: staffToNotify,
                    title: '❌ Contrato Recusado',
                    message: `${payload.signerName || 'Signatário'} recusou o contrato`,
                    icon: 'x',
                    color: 'red',
                    category: 'contract',
                    priority: 'urgent',
                    sourceType: 'contract',
                    sourceId: contract.id,
                });
            }
            break;
        }

        case 'doc_expired':
        case 'expired': {
            await db.run(sql`
                UPDATE contracts
                SET signing_status = 'expired',
                    updated_at = unixepoch()
                WHERE id = ${contract.id}
            `);
            break;
        }
    }
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

async function updateContractSigningStatus(
    contractId: string,
    data: {
        provider: string;
        externalDocId?: string;
        externalDocToken?: string;
        status: string;
        signLinks?: any[];
    }
) {
    try {
        const metadata = JSON.stringify({
            provider: data.provider,
            externalDocId: data.externalDocId,
            externalDocToken: data.externalDocToken,
            signLinks: data.signLinks,
            sentAt: new Date().toISOString(),
        });

        await db.run(sql`
            UPDATE contracts
            SET signing_provider = ${data.provider},
                signing_external_id = ${data.externalDocId || null},
                signing_status = ${data.status},
                signing_metadata = ${metadata},
                updated_at = unixepoch()
            WHERE id = ${contractId}
        `);
    } catch (error) {
        console.error('[E-Sign] Failed to update contract signing status:', error);
    }
}
