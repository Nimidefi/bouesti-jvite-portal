import { NextRequest, NextResponse } from 'next/server';
import { API_URL } from '@/lib/config';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string[] } }
) {
  try {
    const filenameArray = params.filename || [];
    const rawName = filenameArray[filenameArray.length - 1] || 'document.pdf';
    const cleanRawName = rawName.replace(/^uploads\//, '');
    
    // Clean UUID prefix if present (`{uuid}_filename.pdf`) for professional attachment name
    let cleanName = cleanRawName;
    const parts = cleanRawName.split('_');
    if (parts.length > 1 && parts[0].length === 8 && /^[0-9a-fA-F]{8}$/.test(parts[0])) {
      cleanName = cleanRawName.substring(parts[0].length + 1);
    }

    // First try fetching the raw static file from the backend /uploads directory
    const targetUrl = `${API_URL}/uploads/${encodeURIComponent(cleanRawName)}`;
    const res = await fetch(targetUrl);
    
    if (!res.ok) {
      // If direct static file fetch fails, try the backend API route
      const backupUrl = `${API_URL}/api/uploads/download/${encodeURIComponent(cleanRawName)}`;
      const backupRes = await fetch(backupUrl);
      if (!backupRes.ok) {
        return NextResponse.json({ detail: `File '${cleanRawName}' not found` }, { status: 404 });
      }
      const buffer = await backupRes.arrayBuffer();
      const headers = new Headers();
      headers.set('Content-Disposition', `attachment; filename="${cleanName}"`);
      headers.set('Content-Type', backupRes.headers.get('content-type') || 'application/octet-stream');
      return new NextResponse(buffer, { status: 200, headers });
    }

    const buffer = await res.arrayBuffer();
    const headers = new Headers();
    headers.set('Content-Disposition', `attachment; filename="${cleanName}"`);
    headers.set('Content-Type', res.headers.get('content-type') || 'application/octet-stream');
    return new NextResponse(buffer, { status: 200, headers });
  } catch (error: any) {
    console.error('Download proxy error:', error);
    return NextResponse.json({ detail: 'Failed to download file' }, { status: 500 });
  }
}
