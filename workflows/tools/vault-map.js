const fs = require('fs');
const path = require('path');
const root = '/vault';

function walk(dir, depth = 0) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const full = path.join(dir, e.name);
    const indent = '  '.repeat(depth);
    if (e.isDirectory()) {
      out.push(`${indent}- ${e.name}/`);
      out.push(...walk(full, depth + 1));
    } else if (e.isFile() && e.name.endsWith('.md')) {
      out.push(`${indent}- ${e.name}`);
    }
  }
  return out;
}

return [{ json: {
  ...$input.first().json,
  vault_map: walk(root).join('\n'),
  today: new Date().toISOString().slice(0, 10)
} }];
