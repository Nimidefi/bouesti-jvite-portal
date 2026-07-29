import { NextRequest, NextResponse } from 'next/server';
import { API_URL } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string[] } }
) {
  try {
    const filenameArray = params.filename || [];
    const rawName = filenameArray[filenameArray.length - 1] || 'document.pdf';
    const cleanRawName = rawName.replace(/^uploads\//, '');
    
    // Clean UUID prefix if present (`{uuid}_filename.pdf`) for professional display name
    let cleanName = cleanRawName;
    const parts = cleanRawName.split('_');
    if (parts.length > 1 && parts[0].length === 8 && /^[0-9a-fA-F]{8}$/.test(parts[0])) {
      cleanName = cleanRawName.substring(parts[0].length + 1);
    }

    // Try the backend API view endpoint first for smart resolution and fallback PDF generation
    const apiUrl = `${API_URL}/api/uploads/view/${encodeURIComponent(cleanRawName)}`;
    let res = await fetch(apiUrl, { cache: 'no-store' });
    
    if (!res.ok) {
      // If backend API route fails, try direct static file from /uploads
      const staticUrl = `${API_URL}/uploads/${encodeURIComponent(cleanRawName)}`;
      res = await fetch(staticUrl, { cache: 'no-store' });
      if (!res.ok) {
        return NextResponse.json({ detail: `File '${cleanRawName}' not found` }, { status: 404 });
      }
    }

    const buffer = await res.arrayBuffer();
    const headers = new Headers();
    // Use 'inline' so the browser opens PDFs inside the tab rather than forcing download
    headers.set('Content-Disposition', `inline; filename="${cleanName}"`);
    headers.set('Content-Type', res.headers.get('content-type') || 'application/pdf');
    return new NextResponse(buffer, { status: 200, headers });
  } catch (error: any) {
    console.error('View proxy error:', error);
    return NextResponse.json({ detail: 'Failed to view file' }, { status: 500 });
  }
}
