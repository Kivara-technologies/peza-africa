import fs from 'fs';
import path from 'path';

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name.endsWith('.ts')) files.push(full);
  }
  return files;
}

const pattern = /(from\s+)(['"])(\.\.?\/[^'"]+?)\2/g;

for (const folder of ['api', 'db']) {
  if (!fs.existsSync(folder)) continue;
  for (const file of walk(folder)) {
    const text = fs.readFileSync(file, 'utf8');
    const newText = text.replace(pattern, (match, prefix, quote, imp) => {
      if (!/\.[a-zA-Z0-9]+$/.test(imp)) imp += '.js';
      return `${prefix}${quote}${imp}${quote}`;
    });
    if (newText !== text) {
      fs.writeFileSync(file, newText);
      console.log('fixed:', file);
    }
  }
}
