const fs = require('fs');
const path = require('path');

const source = require.resolve('@recallai/desktop-sdk/index.d.ts', {
  paths: [process.cwd()],
});

const destination = path.resolve(__dirname, '..', 'src', 'generated', 'recallai-desktop-sdk.d.ts');

fs.mkdirSync(path.dirname(destination), { recursive: true });
fs.copyFileSync(source, destination);
