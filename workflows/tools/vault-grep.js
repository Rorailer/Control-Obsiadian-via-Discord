const fs = require('fs');
const path = require('path');

const vaultRoot = '/vault';
const input = $input.first().json;
const query = (input.query || '').toString();
const restrictTo = (input.path || '').toString().replace(/^\/+/, '');
const caseSensitive = !!input.case_sensitive;
const limit = parseInt(input.limit) || 50;

if (!query) throw new Error('query is required');

const startDir = path.resolve(vaultRoot, restrictTo);
if (startDir !== vaultRoot && !startDir.startsWith(vaultRoot + path.sep)) {
  throw new Error(`Path traversal blocked: ${restrictTo}`);
}
if (!fs.existsSync(startDir)) {
  return [{ json: { success: false, error: `Path not found: ${restrictTo || '/'}` } }];
}

const needle = caseSensitive ? query : query.toLowerCase();
const results = [];

function scanFile(full) {
  if (results.length >= limit) return;
  const content = fs.readFileSync(full, 'utf8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (results.length >= limit) return;
    const line = lines[i];
    const hay = caseSensitive ? line : line.toLowerCase();
    if (hay.includes(needle)) {
      results.push({
        path: path.relative(vaultRoot, full),
        line_number: i + 1,
        line: line.length > 200 ? line.slice(0, 200) + '…' : line
      });
    }
  }
}

function walk(dir) {
  if (results.length >= limit) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (results.length >= limit) return;
    if (e.name.startsWith('.')) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (e.isFile() && full.endsWith('.md')) scanFile(full);
  }
}

if (fs.statSync(startDir).isFile()) scanFile(startDir);
else walk(startDir);

return [{ json: { success: true, query, count: results.length, results } }];
