const fs = require('fs');
const path = require('path');

const vaultRoot = '/vault';
const input = $input.first().json;
const relPath = (input.path || '').toString().replace(/^\/+/, '');
const oldString = (input.old_string || '').toString();
const newString = (input.new_string || '').toString();
const replaceAll = !!input.replace_all;

if (!relPath) throw new Error('path is required');
if (!oldString) throw new Error('old_string is required (and must be non-empty)');

const resolved = path.resolve(vaultRoot, relPath);
if (resolved !== vaultRoot && !resolved.startsWith(vaultRoot + path.sep)) {
  throw new Error(`Path traversal blocked: ${relPath}`);
}
if (!resolved.endsWith('.md')) {
  throw new Error(`Only .md files allowed, got: ${relPath}`);
}
if (!fs.existsSync(resolved)) {
  return [{ json: { success: false, error: `File not found: ${relPath}` } }];
}

const content = fs.readFileSync(resolved, 'utf8');
const occurrences = content.split(oldString).length - 1;

if (occurrences === 0) {
  return [{ json: {
    success: false,
    error: `old_string not found in ${relPath}. The string must match exactly, including whitespace and newlines. Re-read the file and try again with exact text.`
  } }];
}
if (!replaceAll && occurrences > 1) {
  return [{ json: {
    success: false,
    error: `old_string appears ${occurrences} times in ${relPath}. Either include more surrounding context to make it unique, or pass replace_all=true to replace every occurrence.`
  } }];
}

const updated = replaceAll
  ? content.split(oldString).join(newString)
  : content.replace(oldString, newString);

fs.writeFileSync(resolved, updated, 'utf8');

return [{ json: {
  success: true,
  path: relPath,
  replaced_count: replaceAll ? occurrences : 1,
  bytes_before: Buffer.byteLength(content, 'utf8'),
  bytes_after: Buffer.byteLength(updated, 'utf8')
} }];
