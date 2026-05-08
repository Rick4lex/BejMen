const fs = require('fs');
const path = require('path');

function searchFiles(dir, queries) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      searchFiles(filePath, queries);
    } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      const content = fs.readFileSync(filePath, 'utf8');
      for (const query of queries) {
        if (content.includes(query)) {
          console.log(`Found "${query}" in ${filePath}`);
        }
      }
    }
  }
}

searchFiles(path.join(__dirname, 'src'), ['genkit', '@/ai/', '../ai/', './ai/']);
