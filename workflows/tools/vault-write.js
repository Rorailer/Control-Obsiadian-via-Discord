const fs = require('fs');
const path = require('path');

const vaultRoot = '/vault';
const input = $input.first().json;
const relPath = (input.path || '').toString().replace(/^\/+/, '');
const content = (input.content || '').toString();
const overwrite = input.overwrite !== false;

if (!relPath) throw new Error('path is required');

const resolved = path.resolve(vaultRoot, relPath);
if (resolved !== vaultRoot && !resolved.startsWith(vaultRoot + path.sep)) {
  throw new Error(`Path traversal blocked: ${relPath}`);
}
if (!resolved.endsWith('.md')) {
  throw new Error(`Only .md files allowed, got: ${relPath}`);
}

const existedBefore = fs.existsSync(resolved);
if (existedBefore && !overwrite) {
  return [{ json: {
    success: false,
    error: `File already exists: ${relPath}. Use vault_edit to modify, vault_append to add to it, or pass overwrite=true to replace it entirely.`
  } }];
}

fs.mkdirSync(path.dirname(resolved), { recursive: true });

const body = content.endsWith('\n') ? content : content + '\n';
fs.writeFileSync(resolved, body, 'utf8');

return [{ json: {
  success: true,
  path: relPath,
  bytes_written: Buffer.byteLength(body, 'utf8'),
  created: !existedBefore,
  overwritten: existedBefore
} }];
