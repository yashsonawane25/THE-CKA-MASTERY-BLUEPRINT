const fs = require('fs');
const path = require('path');

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') walk(full, fileList);
    } else {
      fileList.push(full);
    }
  }
  return fileList;
}

const baseDir = path.resolve(__dirname);
const allFiles = walk(baseDir);
console.log(`Auditing v2.0 package: ${allFiles.length} files detected.`);

let errors = 0;
let markdownCount = 0;
let yamlCount = 0;
let diagramCount = 0;

for (const f of allFiles) {
  if (f.endsWith('.md')) {
    markdownCount++;
    const content = fs.readFileSync(f, 'utf8');
    const lines = content.split('\n');

    // Count mermaid blocks
    const mermaidMatches = content.match(/```mermaid/g);
    if (mermaidMatches) diagramCount += mermaidMatches.length;

    // Check if any solution or active instruction suggests using --record
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('kubectl') && line.includes('--record')) {
        // If it is in an anti-pattern, warning, or deprecation explanation:
        const isWarningOrMistake = line.includes('❌') || 
                                   line.includes('DEPRECATED') || 
                                   line.includes('Deprecated') || 
                                   line.includes('DO NOT USE') || 
                                   line.includes('produces warnings') ||
                                   line.includes('removed') ||
                                   line.includes('Mistakes') ||
                                   lines[Math.max(0, i-1)].includes('DEPRECATED') ||
                                   lines[Math.max(0, i-1)].includes('Mistake');
        if (!isWarningOrMistake) {
          console.error(`[FAIL] Active deprecated --record command found in ${path.basename(f)} line ${i+1}: ${line}`);
          errors++;
        }
      }
    }
  } else if (f.endsWith('.yaml') || f.endsWith('.yml')) {
    yamlCount++;
  }
}

console.log(`Markdown documents audited: ${markdownCount}`);
console.log(`Standalone YAML files: ${yamlCount}`);
console.log(`Completed Mermaid Diagrams: ${diagramCount}`);
console.log(`Active Deprecation Errors: ${errors}`);

if (errors === 0) {
  console.log('Quality Assurance Audit Passed with 100% compliance!');
} else {
  process.exit(1);
}
