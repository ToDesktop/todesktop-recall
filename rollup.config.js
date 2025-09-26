import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

const external = ['electron', 'fs', 'path', 'os', '@recallai/desktop-sdk'];

export default [
  // Plugin main process
  {
    input: 'packages/plugin/src/main.ts',
    output: {
      file: 'packages/plugin/dist/main.js',
      format: 'cjs',
      sourcemap: true,
    },
    external,
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: 'packages/plugin/tsconfig.json',
      }),
    ],
  },
  // Plugin preload script
  {
    input: 'packages/plugin/src/preload.ts',
    output: {
      file: 'packages/plugin/dist/preload.js',
      format: 'cjs',
      sourcemap: true,
    },
    external,
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: 'packages/plugin/tsconfig.json',
      }),
    ],
  },
  // Client library
  {
    input: 'packages/client/src/index.ts',
    output: [
      {
        file: 'packages/client/dist/index.js',
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: 'packages/client/dist/index.esm.js',
        format: 'es',
        sourcemap: true,
      },
    ],
    external: ['electron'],
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: 'packages/client/tsconfig.json',
      }),
    ],
  },
];
