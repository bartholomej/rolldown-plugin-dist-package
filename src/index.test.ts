import { describe, expect, it } from 'vitest';
import { transformPackageJson } from './index.js';

describe('transformPackageJson', () => {
  it('removes specified fields from package.json', () => {
    const input = JSON.stringify({
      name: 'my-package',
      scripts: { build: 'tsdown', test: 'vitest' },
      devDependencies: { typescript: '^5.0.0' },
    });

    const result = transformPackageJson(input, 'dist', {
      removeFields: ['scripts', 'devDependencies'],
    });

    const parsed = JSON.parse(result);

    // Assert that fields were removed
    expect(parsed.name).toBe('my-package');
    expect(parsed.scripts).toBeUndefined();
    expect(parsed.devDependencies).toBeUndefined();
  });

  it('removes outDir prefix from relative paths', () => {
    const input = JSON.stringify({
      main: './dist/index.js',
      types: './dist/index.d.ts',
    });

    const result = transformPackageJson(input, 'dist', {});
    const parsed = JSON.parse(result);

    // Assert that prefixes are stripped but relative path indicator remains
    expect(parsed.main).toBe('./index.js');
    expect(parsed.types).toBe('./index.d.ts');
  });

  it('removes outDir prefix but does not add relative dot for bareFields', () => {
    const input = JSON.stringify({
      bin: {
        cli: './dist/cli.js',
      },
    });

    const result = transformPackageJson(input, 'dist', {
      bareFields: ['bin'],
    });
    const parsed = JSON.parse(result);

    // Assert that bin fields do not get the ./ prefix
    expect(parsed.bin.cli).toBe('cli.js');
  });
});
