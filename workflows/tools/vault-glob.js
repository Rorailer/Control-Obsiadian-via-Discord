const fs = require('fs');
const path = require('path');

const vaultRoot = '/vault';
const input = $input.first().json;
const pattern = (input.pattern || '').toString();
const limit = parseInt(input.limit) || 200;

if (!pattern) throw new Error('pattern is required');

function globToRegex(glob) {
  let re = '^';
  let i = 0;
  while (i < glob.length) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') {
        re += '.*';
        i += 2;
        if (glob[i] === '/') i++;
      } else {
        re += '[^/]*';
        i++;
      }
    } else if (c === '?') {
      re += '[^/]';
      i++;
    } else if ('.+^$(){}|[]\\'.includes(c)) {
      re += '\\' + c;
      i++;
    } else {
      re += c;
      i++;
    }
  }
  re += '$';
  return new RegExp(re);
}

const regex = globToRegex(pattern);
const matches = [];

function walk(dir) {
  if (matches.length >= limit) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (matches.length >= limit) return;
    if (e.name.startsWith('.')) continue;
    const full = path.join(dir, e.name);
    const rel = path.relative(vaultRoot, full);
    if (e.isDirectory()) walk(full);
    else if (e.isFile() && regex.test(rel)) matches.push(rel);
  }
}
walk(vaultRoot);

return [{ json: { success: true, pattern, count: matches.length, matches } }];
