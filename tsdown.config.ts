import { defineConfig } from 'tsdown';
import { cleanPackageJson } from './src/index.js';

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
    cleanPackageJson({
      outDir,
      removeFields: [
        'packageManager',
        'lint-staged',
        'devDependencies',
        'scripts',
      ],
    }),
  ],
});
