# Clean package.json for distribution (Rolldown, Rollup, Vite plugin)

> This plugin cleans package.json for distribution.

## Usage

```typescript
// rolldown.config.ts
import { cleanPackageJson } from 'rolldown-plugin-clean-package-json';

export default defineConfig({
  plugins: [
    cleanPackageJson({
      outDir: 'dist',
      removeFields: ['scripts', 'devDependencies'],
      noPrefix: ['bin'],
    }),
  ],
});
```
