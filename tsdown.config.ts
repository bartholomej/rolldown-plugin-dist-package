import { defineConfig } from 'tsdown';

export default defineConfig({
  // Define the entry point
  entry: ['./src/index.ts'],
  
  // Build only for ECMAScript Modules
  format: ['esm'],
  
  // Automatically generate TypeScript declaration files (.d.ts / .d.mts)
  dts: true,
  
  // Clean the dist directory before every build
  clean: true,
  fixedExtension: false,
});
