const fs = require('fs');
const path = require('path');

const vaultRoot = '/vault';
const input = $input.first().json;
const folder = (input.folder || '').toString().replace(/^\/+/, '');
const recursive = !!input.recursive;

const targetDir = path.resolve(vaultRoot, folder);
if (targetDir !== vaultRoot && !targetDir.startsWith(vaultRoot + path.sep)) {
  throw new Error(`Path traversal blocked: ${folder}`);
}
if (!fs.existsSync(targetDir)) {
  return [{ json: { success: false, error: `Folder not found: ${folder || '/'}` } }];
}

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const full = path.join(dir, e.name);
    const rel = path.relative(vaultRoot, full);
    if (e.isDirectory()) {
      out.push({ path: rel, type: 'dir' });
      if (recursive) out.push(...walk(full));
    } else if (e.isFile()) {
      out.push({ path: rel, type: 'file', size: fs.statSync(full).size });
    }
  }
  return out;
}

const results = walk(targetDir);
return [{ json: { success: true, folder: folder || '/', count: results.length, files: results } }];
