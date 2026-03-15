![Rolldown compatibility](https://registry.vite.dev/api/badges?package=rolldown-plugin-dist-package&tool=rolldown) ![Rollup compatibility](https://registry.vite.dev/api/badges?package=rolldown-plugin-dist-package&tool=rollup) ![Vite compatibility](https://registry.vite.dev/api/badges?package=rolldown-plugin-dist-package&tool=vite)

# Prepare `package.json` for distribution (Rolldown plugin)

> A [Rolldown](https://rolldown.rs) / [Rollup](https://rollupjs.org) / Vite / tsup / tsdown plugin that automatically copies a **cleaned** `package.json` into your build output directory.

When you publish an npm package from a `dist/` folder, the original `package.json` is full of paths like `./dist/index.js` and fields like `scripts` or `devDependencies` that make no sense in the published artefact. This plugin fixes that for you at build time — no manual maintenance required.

---

## What it does

- **Strips `outDir` prefixes** from every path-like value in `package.json`
  `./dist/index.js` → `./index.js`
- **Removes fields** you don't want consumers to see (e.g. `scripts`, `devDependencies`)
- **Handles `bin` correctly** — paths like `./dist/cli.js` become `cli.js` (without `./`) because that's what Node.js expects for executables
- **Copies extra files** (README, LICENSE, CHANGELOG, …) into the output directory
- **Sets / overrides fields** — e.g. force `sideEffects: false` or `type: 'module'`
- **Rewrites dependency versions** — strip `workspace:` protocol, pin versions, etc.
- **Custom `transform` function** — full control over the final package object
- **Validates** the output — warns when required fields are missing
- Works with **Rolldown**, **Rollup**, **Vite**, **Tsdown**, **Tsup**, …

---

## Installation

```sh
npm install -D rolldown-plugin-dist-package
# yarn add -D rolldown-plugin-dist-package
# pnpm add -D rolldown-plugin-dist-package
```

---

## Usage

```ts
// rolldown.config.ts, rollup.config.ts, tsdown.config.ts, ...
import { defineConfig } from 'rolldown';
import { distPackage } from 'rolldown-plugin-dist-package';

export default defineConfig({
  input: 'src/index.ts',
  output: { dir: 'dist' },
  plugins: [
    distPackage({
      removeFields: ['scripts', 'devDependencies', 'lint-staged'],
    }),
  ],
});
```

## Fun fact

> **Dogfooding/Inception** — this plugin builds and packages itself!
> The [`tsdown.config.ts`](./tsdown.config.ts) in this repo is the canonical real-world example:
>
> ```ts
> // tsdown.config.ts (this very repo)
> import { defineConfig } from 'tsdown';
> import { distPackage } from './src/index.js';
>
> export default defineConfig({
>   entry: ['./src/index.ts'],
>   format: ['esm'],
>   dts: true,
>   clean: true,
>   plugins: [
>     distPackage({
>       outDir: 'dist',
>       validate: true,
>       copyFiles: ['README.md', 'LICENSE', 'CHANGELOG.md'],
>       removeFields: [
>         'packageManager',
>         'lint-staged',
>         'devDependencies',
>         'scripts',
>       ],
>     }),
>   ],
> });
> ```

---

## Options

| Option                | Type                                 | Default       | Description                                                                                         |
| --------------------- | ------------------------------------ | ------------- | --------------------------------------------------------------------------------------------------- |
| `outDir`              | `string`                             | auto-detected | Output directory. If omitted, the plugin reads it from the bundler's own output options.            |
| `removeFields`        | `string[]`                           | `[]`          | Top-level fields to delete entirely from the output.                                                |
| `bareFields`          | `string[]`                           | `['bin']`     | Fields whose path values are stripped of the `outDir` prefix but do **not** get the `./` prepended. |
| `copyFiles`           | `string \| string[]`                 | —             | Files to copy from the project root into the output directory.                                      |
| `set`                 | `Record<string, unknown>`            | —             | Fields to add or override in the output `package.json`.                                             |
| `rewriteDependencies` | `Record<string, string> \| Function` | —             | Rewrite versions in all dependency fields. See below.                                               |
| `transform`           | `(pkg) => pkg \| Promise<pkg>`       | —             | Custom transform applied last, after all other options.                                             |
| `validate`            | `boolean \| string[]`                | `false`       | Warn about missing fields. `true` checks `name` and `version`.                                      |

### `removeFields`

```ts
distPackage({
  removeFields: [
    'scripts',
    'devDependencies',
    'devDependenciesMeta',
    'lint-staged',
    'prettier',
  ],
});
```

### `bareFields`

By default, `bin` entries are treated specially because Node.js expects bare relative paths (`cli.js`, not `./cli.js`). Extend the list for other fields with the same convention:

```ts
distPackage({
  bareFields: ['bin', 'man'],
});
```

### `copyFiles`

```ts
distPackage({
  copyFiles: ['README.md', 'LICENSE', 'CHANGELOG.md'],
});
```

### `set`

```ts
distPackage({
  set: { sideEffects: false, type: 'module' },
});
```

### `rewriteDependencies`

Object form — replace specific packages:

```ts
distPackage({
  rewriteDependencies: { 'my-local-pkg': '^1.2.0' },
});
```

Function form — strip Yarn `workspace:` protocol:

```ts
distPackage({
  rewriteDependencies: (_, version) =>
    version.startsWith('workspace:')
      ? version.slice('workspace:'.length) || '*'
      : undefined,
});
```

### `transform`

Full control over the final package object. Runs after all other options:

```ts
distPackage({
  transform: (pkg) => ({
    ...pkg,
    // add a custom field, remove something conditionally, etc.
    funding: 'https://github.com/sponsors/yourname',
  }),
});
```

### `validate`

```ts
// warn if name or version is missing
distPackage({ validate: true });

// warn if specific fields are missing
distPackage({ validate: ['name', 'version', 'exports'] });
```

---

## Example

Given this `package.json` in the project root:

```json
{
  "name": "my-lib",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "bin": {
    "my-cli": "./dist/cli.js"
  },
  "scripts": { "build": "rolldown" },
  "devDependencies": { "rolldown": "^1.0.0" }
}
```

After building with `removeFields: ['scripts', 'devDependencies']`, the plugin writes this into `dist/package.json`:

```json
{
  "name": "my-lib",
  "version": "1.0.0",
  "main": "./index.js",
  "types": "./index.d.ts",
  "exports": {
    ".": {
      "import": "./index.js",
      "types": "./index.d.ts"
    }
  },
  "bin": {
    "my-cli": "cli.js"
  }
}
```

## ⭐️ Support

If you find this project useful and you are brave enough consider [making a donation](https://github.com/sponsors/bartholomej) for some 🍺 or 🍵 ;)

- Giving it a ⭐️ on [GitHub](https://github.com/bartholomej/rolldown-plugin-dist-package)
- Sharing it with others who might benefit
- [Sponsoring the project](https://github.com/sponsors/bartholomej) to support ongoing development

Your support helps maintain and improve this library! 🙏

## 🔒 Privacy & Security

**This library does not collect, store, or transmit any user data.**

I physically can't. I have nowhere to store it. I don't even have a server database to store it. So even if Justin Bieber asked nicely to see your data, I wouldn't have anything to show him.

## 📝 License

MIT © 2026 [Lukas Bartak](http://bartweb.cz)

See [LICENSE](LICENSE) for full details.

---

<div align="center">

**Built with ❤️ by [Lukas Bartak](https://bartweb.cz)**

Powered by nature 🗻, wind 💨, tea 🍵 and beer 🍺

<!--
[⭐ Star on GitHub](https://github.com/bartholomej/rolldown-plugin-dist-package) • [📦 NPM Package](https://www.npmjs.com/rolldown-plugin-dist-package) • [🐳 Docker Hub](https://hub.docker.com/r/bartholomej/rolldown-plugin-dist-package) -->

</div>
