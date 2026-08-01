const fs = require('fs');
const path = require('path');

const vaultRoot = '/vault';
const input = $input.first().json;
const relPath = (input.path || '').toString().replace(/^\/+/, '');
const startLine = parseInt(input.start_line) || 1;
const endLine = parseInt(input.end_line) || 0;

if (!relPath) throw new Error('path is required');

const resolved = path.resolve(vaultRoot, relPath);
if (resolved !== vaultRoot && !resolved.startsWith(vaultRoot + path.sep)) {
  throw new Error(`Path traversal blocked: ${relPath}`);
}
if (!fs.existsSync(resolved)) {
  return [{ json: { success: false, error: `File not found: ${relPath}` } }];
}
if (!fs.statSync(resolved).isFile()) {
  return [{ json: { success: false, error: `Not a file: ${relPath}` } }];
}

const content = fs.readFileSync(resolved, 'utf8');
const lines = content.split('\n');
const total = lines.length;

let result;
let rangeUsed = false;
if (endLine > 0 || startLine > 1) {
  const end = endLine > 0 ? Math.min(endLine, total) : total;
  result = lines.slice(startLine - 1, end).join('\n');
  rangeUsed = true;
} else {
  result = content;
}

const out = {
  success: true,
  path: relPath,
  total_lines: total,
  size_bytes: Buffer.byteLength(content, 'utf8'),
  content: result
};
if (rangeUsed) {
  out.start_line = startLine;
  out.end_line = endLine > 0 ? Math.min(endLine, total) : total;
}

return [{ json: out }];
