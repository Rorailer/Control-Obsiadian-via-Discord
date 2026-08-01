const fs = require('fs');
const path = require('path');

const vaultRoot = '/vault';
const input = $input.first().json;
const relPath = (input.path || '').toString().replace(/^\/+/, '');
const text = (input.text || '').toString();

if (!relPath) throw new Error('path is required');

const resolved = path.resolve(vaultRoot, relPath);
if (resolved !== vaultRoot && !resolved.startsWith(vaultRoot + path.sep)) {
  throw new Error(`Path traversal blocked: ${relPath}`);
}
if (!resolved.endsWith('.md')) {
  throw new Error(`Only .md files allowed, got: ${relPath}`);
}

fs.mkdirSync(path.dirname(resolved), { recursive: true });

let prefix = '';
if (fs.existsSync(resolved)) {
  const existing = fs.readFileSync(resolved, 'utf8');
  if (existing.length > 0 && !existing.endsWith('\n')) prefix = '\n';
}
const payload = prefix + text + '\n';
fs.appendFileSync(resolved, payload, 'utf8');

return [{ json: {
  success: true,
  path: relPath,
  bytes_appended: Buffer.byteLength(payload, 'utf8')
} }];
