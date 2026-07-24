// Lightweight XLSX/CSV parser - no external dependencies needed
// Supports .xlsx, .xls, .csv files

export interface ProductRow {
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  featured: boolean;
  release_date: string;
}

export function parseXlsx(buffer: Uint8Array): ProductRow[] {
  // Check if it's a CSV (text file)
  const text = tryDecodeText(buffer);
  if (text) {
    return parseCSV(text);
  }
  // For XLSX binary, we need a different approach
  // Try to extract text from the XML inside the XLSX zip
  return parseXLSXBinary(buffer);
}

function tryDecodeText(buffer: Uint8Array): string | null {
  try {
    const text = new TextDecoder('utf-8').decode(buffer);
    // If it contains commas/semicolons and newlines, likely CSV
    if ((text.includes(',') || text.includes(';') || text.includes('\t')) && text.includes('\n')) {
      return text;
    }
    return null;
  } catch {
    return null;
  }
}

function parseCSV(text: string): ProductRow[] {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  // Detect delimiter
  const firstLine = lines[0];
  const delimiter = firstLine.includes('\t') ? '\t' : firstLine.includes(';') ? ';' : ',';

  const headers = parseLine(lines[0], delimiter).map(h => h.toLowerCase().trim());
  const rows: ProductRow[] = [];

  // Map header names to expected columns
  const nameIdx = findIdx(headers, ['name', 'اسم', 'الاسم', 'اسم المنتج', 'product']);
  const descIdx = findIdx(headers, ['description', 'وصف', 'الوصف', 'desc']);
  const priceIdx = findIdx(headers, ['price', 'سعر', 'السعر', 'الثمن']);
  const imageIdx = findIdx(headers, ['image', 'صورة', 'img', 'photo', 'url']);
  const categoryIdx = findIdx(headers, ['category', 'فئة', 'الفئة', 'نوع', 'type']);
  const featuredIdx = findIdx(headers, ['featured', 'مميز', 'مميزة', 'highlight']);
  const releaseDateIdx = findIdx(headers, ['release_date', 'release date', 'تاريخ الإصدار', 'تاريخ', 'date']);

  for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i], delimiter);
    const name = nameIdx >= 0 ? cols[nameIdx]?.trim() : cols[0]?.trim();
    const price = priceIdx >= 0 ? parseFloat(cols[priceIdx] || '0') : parseFloat(cols[2] || '0');

    if (!name || isNaN(price) || price <= 0) continue;

    rows.push({
      name,
      description: descIdx >= 0 ? cols[descIdx]?.trim() || '' : cols[1]?.trim() || '',
      price,
      image: imageIdx >= 0 ? cols[imageIdx]?.trim() || '' : '',
      category: categoryIdx >= 0 ? mapCategory(cols[categoryIdx]) : 'games',
      featured: featuredIdx >= 0 ? isTruthy(cols[featuredIdx]) : false,
      release_date: releaseDateIdx >= 0 ? cols[releaseDateIdx]?.trim() || '' : '',
    });
  }
  return rows;
}

function parseLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') { inQuotes = !inQuotes; continue; }
    if (char === delimiter && !inQuotes) { result.push(current); current = ''; continue; }
    current += char;
  }
  result.push(current);
  return result;
}

function findIdx(headers: string[], candidates: string[]): number {
  for (const c of candidates) {
    const idx = headers.findIndex(h => h.includes(c));
    if (idx >= 0) return idx;
  }
  return -1;
}

function mapCategory(val: string | undefined): string {
  if (!val) return 'games';
  const v = val.toLowerCase().trim();
  if (v.includes('sub') || v.includes('plus') || v.includes('اشتراك') || v.includes('subscription')) return 'subscription';
  return 'games';
}

function isTruthy(val: string | undefined): boolean {
  if (!val) return false;
  const v = val.toLowerCase().trim();
  return v === '1' || v === 'true' || v === 'yes' || v === 'نعم' || v === 'مميز';
}

// Simple XLSX binary parser - extracts shared strings and sheet data
function parseXLSXBinary(buffer: Uint8Array): ProductRow[] {
  try {
    // XLSX is a ZIP file. We look for the PK signature and extract XML
    const str = uint8ToStr(buffer);

    // Find sharedStrings.xml content
    const sharedStrings = extractZipEntry(str, 'sharedStrings.xml') || extractZipEntry(str, 'xl/sharedStrings.xml');
    const strings = sharedStrings ? parseSharedStrings(sharedStrings) : [];

    // Find sheet1.xml content
    const sheet = extractZipEntry(str, 'sheet1.xml') || extractZipEntry(str, 'xl/worksheets/sheet1.xml');
    if (!sheet) return [];

    return parseSheet(sheet, strings);
  } catch {
    return [];
  }
}

function uint8ToStr(buffer: Uint8Array): string {
  let str = '';
  for (let i = 0; i < buffer.length; i++) {
    str += String.fromCharCode(buffer[i]);
  }
  return str;
}

function extractZipEntry(zipStr: string, filename: string): string | null {
  // Find the filename in ZIP local file headers
  const marker = filename;
  let pos = zipStr.indexOf(marker);
  while (pos !== -1) {
    // Check for ZIP local file header (PK\x03\x04) before filename
    const headerPos = zipStr.lastIndexOf('\x50\x4b\x03\x04', pos);
    if (headerPos !== -1 && pos - headerPos < 100) {
      // Skip header (30 bytes + filename length + extra field length)
      const filenameLen = zipStr.charCodeAt(headerPos + 26) + (zipStr.charCodeAt(headerPos + 27) << 8);
      const extraLen = zipStr.charCodeAt(headerPos + 28) + (zipStr.charCodeAt(headerPos + 29) << 8);
      const dataStart = headerPos + 30 + filenameLen + extraLen;
      // Read compressed size
      const compSize = zipStr.charCodeAt(headerPos + 18) +
        (zipStr.charCodeAt(headerPos + 19) << 8) +
        (zipStr.charCodeAt(headerPos + 20) << 16) +
        (zipStr.charCodeAt(headerPos + 21) << 24);
      if (compSize > 0 && compSize < 2000000) {
        const data = zipStr.slice(dataStart, dataStart + compSize);
        // Check if it looks like XML (stored uncompressed)
        if (data.includes('<?xml') || data.includes('<sst') || data.includes('<worksheet')) {
          return data;
        }
      }
    }
    pos = zipStr.indexOf(marker, pos + 1);
  }
  return null;
}

function parseSharedStrings(xml: string): string[] {
  const strings: string[] = [];
  const regex = /<t[^>]*>([^<]*)<\/t>/g;
  let m;
  while ((m = regex.exec(xml)) !== null) {
    strings.push(decodeXML(m[1]));
  }
  return strings;
}

function parseSheet(xml: string, strings: string[]): ProductRow[] {
  // Extract all rows
  const rows: string[][] = [];
  const rowRegex = /<row[^>]*>([\s\S]*?)<\/row>/g;
  let rowMatch;
  while ((rowMatch = rowRegex.exec(xml)) !== null) {
    const cells: string[] = [];
    const rowXml = rowMatch[1];

    const cRegex = /<c r="([A-Z]+)\d+"([^>]*)>([\s\S]*?)<\/c>/g;
    let cMatch;
    while ((cMatch = cRegex.exec(rowXml)) !== null) {
      const attrs = cMatch[2];
      const inner = cMatch[3];
      const vMatch = inner.match(/<v>([^<]*)<\/v>/);
      if (!vMatch) { cells.push(''); continue; }
      const val = vMatch[1];
      if (attrs.includes('t="s"')) {
        cells.push(strings[parseInt(val)] || '');
      } else {
        cells.push(val);
      }
    }
    if (cells.length > 0) rows.push(cells);
  }

  if (rows.length < 2) return [];

  // First row is headers
  const headers = rows[0].map(h => h.toLowerCase().trim());
  const nameIdx = findIdx(headers, ['name', 'اسم', 'الاسم', 'اسم المنتج', 'product']);
  const descIdx = findIdx(headers, ['description', 'وصف', 'الوصف', 'desc']);
  const priceIdx = findIdx(headers, ['price', 'سعر', 'السعر', 'الثمن']);
  const imageIdx = findIdx(headers, ['image', 'صورة', 'img', 'photo', 'url']);
  const categoryIdx = findIdx(headers, ['category', 'فئة', 'الفئة', 'نوع', 'type']);
  const featuredIdx = findIdx(headers, ['featured', 'مميز', 'مميزة', 'highlight']);
  const releaseDateIdx = findIdx(headers, ['release_date', 'release date', 'تاريخ الإصدار', 'تاريخ', 'date']);

  const result: ProductRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i];
    const name = nameIdx >= 0 ? cols[nameIdx]?.trim() : cols[0]?.trim();
    const price = priceIdx >= 0 ? parseFloat(cols[priceIdx] || '0') : parseFloat(cols[2] || '0');
    if (!name || isNaN(price) || price <= 0) continue;
    result.push({
      name,
      description: descIdx >= 0 ? cols[descIdx]?.trim() || '' : cols[1]?.trim() || '',
      price,
      image: imageIdx >= 0 ? cols[imageIdx]?.trim() || '' : '',
      category: categoryIdx >= 0 ? mapCategory(cols[categoryIdx]) : 'games',
      featured: featuredIdx >= 0 ? isTruthy(cols[featuredIdx]) : false,
      release_date: releaseDateIdx >= 0 ? cols[releaseDateIdx]?.trim() || '' : '',
    });
  }
  return result;
}

function decodeXML(str: string): string {
  return str.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
}
