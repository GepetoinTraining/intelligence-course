import { NextRequest, NextResponse } from 'next/server';
import { put, del } from '@vercel/blob';
import { getApiAuthWithOrg } from '@/lib/auth';

// Allowed MIME types
const ALLOWED_TYPES: Record<string, string[]> = {
    image: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'],
    video: ['video/mp4', 'video/webm'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'],
    document: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv',
    ],
};

const ALL_ALLOWED = Object.values(ALLOWED_TYPES).flat();
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

function getFileCategory(contentType: string): string {
    for (const [cat, types] of Object.entries(ALLOWED_TYPES)) {
        if (types.includes(contentType)) return cat;
    }
    return 'other';
}

// POST /api/upload — Upload a file to Vercel Blob
export async function POST(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        if (!ALL_ALLOWED.includes(file.type)) {
            return NextResponse.json({
                error: `Unsupported file type: ${file.type}`,
                allowed: Object.keys(ALLOWED_TYPES),
            }, { status: 400 });
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({
                error: `File too large. Max: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
            }, { status: 400 });
        }

        // Namespace by org to keep blobs organized
        const path = `${orgId}/${Date.now()}-${file.name}`;

        const blob = await put(path, file, {
            access: 'public',
            addRandomSuffix: true,
        });

        return NextResponse.json({
            url: blob.url,
            downloadUrl: blob.downloadUrl,
            pathname: blob.pathname,
            filename: file.name,
            size: file.size,
            contentType: file.type,
            category: getFileCategory(file.type),
        }, { status: 201 });
    } catch (error) {
        console.error('[upload POST]', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}

// DELETE /api/upload — Delete a file from Vercel Blob
export async function DELETE(request: NextRequest) {
    const { personId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { url } = await request.json();
        if (!url) {
            return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
        }

        await del(url);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[upload DELETE]', error);
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }
}
