const fs = require('fs');
const path = require('path');

const source = require.resolve('@recallai/desktop-sdk/index.d.ts', {
  paths: [process.cwd()],
});

const destination = path.resolve(__dirname, '..', 'src', 'generated', 'recallai-desktop-sdk.d.ts');

fs.mkdirSync(path.dirname(destination), { recursive: true });

let contents = fs.readFileSync(source, 'utf8');

// The upstream SDK declaration file contains internal test-only hooks that we
// do not want to publish in the public ToDesktop client surface.
contents = contents
  .replace(/^\s*testMode\?: boolean;\n/gm, '')
  .replace(/^\s*testSpeedModifier\?: string;\n/gm, '')
  .replace(/^\s*testTargetBundleId\?: string;\n/gm, '')
  .replace(/^\s*testTargetBundleIdRemapped\?: string;\n/gm, '')
  .replace(/^export declare function testUnexpectedShutdown\(\): Promise<null>;\n/gm, '')
  .replace(/^\s*testUnexpectedShutdown: typeof testUnexpectedShutdown;\n/gm, '');

fs.writeFileSync(destination, contents);
