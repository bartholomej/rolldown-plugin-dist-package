import { defineConfig } from 'tsdown';
import { distPackage } from './src/index.js';

const outDir = 'dist';

export default defineConfig({
  entry: ['./src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  fixedExtension: false,
  plugins: [
    // Dogfooding and inception at its finest:
    // Using this very plugin to build and package itself! ;)
    distPackage({
      outDir,
      validate: true,
      copyFiles: ['README.md', 'LICENSE', 'CHANGELOG.md'],
      removeFields: [
        'packageManager',
        'lint-staged',
        'devDependencies',
        'scripts',
      ],
    }),
  ],
});
