import { describe, expect, it } from 'vitest';
import { transformPackageJson } from './index.js';

describe('transformPackageJson', () => {
  it('removes specified fields from package.json', async () => {
    const input = JSON.stringify({
      name: 'my-package',
      scripts: { build: 'tsdown', test: 'vitest' },
      devDependencies: { typescript: '^5.0.0' },
    });

    const result = await transformPackageJson(input, 'dist', {
      removeFields: ['scripts', 'devDependencies'],
    });

    const parsed = JSON.parse(result);

    expect(parsed.name).toBe('my-package');
    expect(parsed.scripts).toBeUndefined();
    expect(parsed.devDependencies).toBeUndefined();
  });

  it('removes outDir prefix from relative paths', async () => {
    const input = JSON.stringify({
      main: './dist/index.js',
      types: './dist/index.d.ts',
    });

    const result = await transformPackageJson(input, 'dist', {});
    const parsed = JSON.parse(result);

    expect(parsed.main).toBe('./index.js');
    expect(parsed.types).toBe('./index.d.ts');
  });

  it('removes outDir prefix but does not add relative dot for bareFields', async () => {
    const input = JSON.stringify({
      bin: { cli: './dist/cli.js' },
    });

    const result = await transformPackageJson(input, 'dist', {
      bareFields: ['bin'],
    });
    const parsed = JSON.parse(result);

    expect(parsed.bin.cli).toBe('cli.js');
  });

  it('sets / overrides fields', async () => {
    const input = JSON.stringify({ name: 'my-package', type: 'commonjs' });

    const result = await transformPackageJson(input, 'dist', {
      set: { type: 'module', sideEffects: false },
    });
    const parsed = JSON.parse(result);

    expect(parsed.type).toBe('module');
    expect(parsed.sideEffects).toBe(false);
  });

  it('applies custom transform function', async () => {
    const input = JSON.stringify({ name: 'my-package', version: '1.0.0' });

    const result = await transformPackageJson(input, 'dist', {
      transform: (pkg) => ({ ...pkg, version: pkg.version + '-next' }),
    });
    const parsed = JSON.parse(result);

    expect(parsed.version).toBe('1.0.0-next');
  });

  it('applies async custom transform function', async () => {
    const input = JSON.stringify({ name: 'my-package', version: '1.0.0' });

    const result = await transformPackageJson(input, 'dist', {
      transform: async (pkg) => {
        await Promise.resolve();
        return { ...pkg, name: 'renamed' };
      },
    });
    const parsed = JSON.parse(result);

    expect(parsed.name).toBe('renamed');
  });

  it('rewrites dependency versions via object map', async () => {
    const input = JSON.stringify({
      dependencies: { react: '^17.0.0', lodash: '^4.0.0' },
    });

    const result = await transformPackageJson(input, 'dist', {
      rewriteDependencies: { react: '^18.0.0' },
    });
    const parsed = JSON.parse(result);

    expect(parsed.dependencies.react).toBe('^18.0.0');
    expect(parsed.dependencies.lodash).toBe('^4.0.0');
  });

  it('rewrites dependency versions via function', async () => {
    const input = JSON.stringify({
      dependencies: { 'my-lib': 'workspace:*', react: '^18.0.0' },
    });

    const result = await transformPackageJson(input, 'dist', {
      rewriteDependencies: (_, v) =>
        v.startsWith('workspace:') ? v.slice('workspace:'.length) || '*' : undefined,
    });
    const parsed = JSON.parse(result);

    expect(parsed.dependencies['my-lib']).toBe('*');
    expect(parsed.dependencies.react).toBe('^18.0.0');
  });

  it('rewrites versions across all dependency fields', async () => {
    const input = JSON.stringify({
      dependencies: { foo: 'workspace:^1.0.0' },
      peerDependencies: { foo: 'workspace:^1.0.0' },
      optionalDependencies: { foo: 'workspace:^1.0.0' },
      devDependencies: { foo: 'workspace:^1.0.0' },
    });

    const strip = (_: string, v: string) =>
      v.startsWith('workspace:') ? v.slice('workspace:'.length) : undefined;

    const result = await transformPackageJson(input, 'dist', {
      rewriteDependencies: strip,
    });
    const parsed = JSON.parse(result);

    expect(parsed.dependencies.foo).toBe('^1.0.0');
    expect(parsed.peerDependencies.foo).toBe('^1.0.0');
    expect(parsed.optionalDependencies.foo).toBe('^1.0.0');
    expect(parsed.devDependencies.foo).toBe('^1.0.0');
  });

  it('applies set after rewriteDependencies', async () => {
    const input = JSON.stringify({ name: 'my-package', private: true });

    const result = await transformPackageJson(input, 'dist', {
      set: { private: false },
    });
    const parsed = JSON.parse(result);

    expect(parsed.private).toBe(false);
  });

  it('transform runs after set', async () => {
    const input = JSON.stringify({ name: 'my-package' });

    const result = await transformPackageJson(input, 'dist', {
      set: { extra: 'from-set' },
      transform: (pkg) => ({ ...pkg, extra: 'from-transform' }),
    });
    const parsed = JSON.parse(result);

    expect(parsed.extra).toBe('from-transform');
  });
});
