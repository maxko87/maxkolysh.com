import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, '../src/data/presetFunds.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Function to transform fund entries
// The pattern matches fund objects in the array
// We need to:
// 1. Remove displayName line
// 2. Remove strategy line
// 3. Change sourceUrl to optional (keep if exists)
// 4. Add isNotable flag if displayName had a star

// Process the content line by line to handle all cases
const lines = content.split('\n');
const newLines = [];
let currentFundIsNotable = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Check if this line contains displayName
  if (line.includes('displayName:')) {
    // Check if it's a notable fund (has a star)
    currentFundIsNotable = line.includes('⭐');
    // Skip the displayName line
    continue;
  }

  // Check if this line contains strategy
  if (line.includes('strategy:')) {
    // Skip the strategy line
    continue;
  }

  // Check if this is a closing brace for an object
  if (line.trim().startsWith('},') && currentFundIsNotable) {
    // Add isNotable flag before the closing brace
    const indent = line.match(/^(\s*)/)[1];
    newLines.push(`${indent}  isNotable: true,`);
    currentFundIsNotable = false; // Reset for next fund
  }

  newLines.push(line);
}

content = newLines.join('\n');

// Write the updated content back
fs.writeFileSync(filePath, content, 'utf8');

console.log('Successfully updated presetFunds.ts');
console.log('- Removed displayName field from all funds');
console.log('- Removed strategy field from all funds');
console.log('- Added isNotable flag for funds with stars');
