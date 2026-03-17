import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import path from 'path';
import fs from 'fs';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  if (!isAuthenticated(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('image') as File;
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File too large. Max 5MB allowed.' }, { status: 400 });
  }

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type. Only images allowed.' }, { status: 400 });
  }

  // Validate extension - extract safely, strip any path traversal
  const originalName = path.basename(file.name); // strips any ../ etc
  const ext = originalName.split('.').pop()?.toLowerCase() || '';
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json({ error: 'Invalid file extension.' }, { status: 400 });
  }

  // Validate magic bytes (first few bytes of file)
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  if (!isValidImageBuffer(buffer, ext)) {
    return NextResponse.json({ error: 'File content does not match image type.' }, { status: 400 });
  }

  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  // Generate safe random filename - never use user-supplied name
  const safeFilename = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const filepath = path.join(uploadDir, safeFilename);

  // Ensure final path is within uploadDir (path traversal protection)
  if (!filepath.startsWith(uploadDir)) {
    return NextResponse.json({ error: 'Invalid path.' }, { status: 400 });
  }

  fs.writeFileSync(filepath, buffer);
  return NextResponse.json({ url: `/uploads/${safeFilename}` });
}

function isValidImageBuffer(buffer: Buffer, ext: string): boolean {
  if (buffer.length < 4) return false;
  const jpg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  const png = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
  const gif = buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46;
  const webp = buffer.length >= 12 && buffer.slice(8, 12).toString('ascii') === 'WEBP';
  if (['jpg', 'jpeg'].includes(ext)) return jpg;
  if (ext === 'png') return png;
  if (ext === 'gif') return gif;
  if (ext === 'webp') return webp;
  return false;
}
