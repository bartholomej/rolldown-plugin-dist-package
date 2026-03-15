![Rolldown compatibility](https://registry.vite.dev/api/badges?package=rolldown-plugin-dist-package&tool=rolldown) ![Rollup compatibility](https://registry.vite.dev/api/badges?package=rolldown-plugin-dist-package&tool=rollup) ![Vite compatibility](https://registry.vite.dev/api/badges?package=rolldown-plugin-dist-package&tool=vite)

# dist-package — clean up `package.json` for publishing

> A [Rolldown](https://rolldown.rs) / [Rollup](https://rollupjs.org) / Vite / tsup / tsdown plugin that automatically writes a **cleaned** `package.json` into your build output directory.

When you publish from a `dist/` folder, your `package.json` contains paths like `./dist/index.js` and fields like `scripts` or `devDependencies` that don't belong in the published package. This plugin fixes that at build time — no manual maintenance required.

---

## What it does

- **Strips `outDir` prefixes** — `./dist/index.js` → `./index.js`
- **Removes fields** you don't want consumers to see (e.g. `scripts`, `devDependencies`)
- **Handles `bin`** — `./dist/cli.js` → `cli.js` (Node.js expects bare paths for executables)
- **Copies extra files** (README, LICENSE, CHANGELOG, …) into the output directory
- **Sets / overrides fields** — e.g. force `sideEffects: false` or `type: 'module'`
- **Rewrites dependency versions** — strip `workspace:` protocol, pin versions, etc.
- **Custom `transform` function** — full control over the final package object
- **Validates** the output — warns when required fields are missing
- Works with **Rolldown**, **Rollup**, **Vite**, **Tsdown**, **Tsup**, …

## Example

> Let's say your `package.json` looks something like this — full of `dist/` paths, scripts, and devDependencies that have no place in a published package. The plugin rewrites it and drops a clean copy into your output directory, ready to publish as-is. Everything is fully configurable:

```diff
  {
    "name": "my-lib",
    "version": "1.0.0",
-   "main": "./dist/index.js",
-   "types": "./dist/index.d.ts",
+   "main": "./index.js",
+   "types": "./index.d.ts",
    "exports": {
      ".": {
-       "import": "./dist/index.js",
-       "types": "./dist/index.d.ts"
+       "import": "./index.js",
+       "types": "./index.d.ts"
      }
    },
    "bin": {
-     "my-cli": "./dist/cli.js"
+     "my-cli": "cli.js"
    },
-   "scripts": { "build": "rolldown" },
-   "devDependencies": { "rolldown": "^1.0.0" }
+   "funding": "https://github.com/sponsors/you"
  }
```

---

## Installation

```sh
npm install -D rolldown-plugin-dist-package
# yarn add -D rolldown-plugin-dist-package
# pnpm add -D rolldown-plugin-dist-package
```

---

## Usage

> 🐶 **Fun fact:** This plugin builds and packages itself — it's eating its own dog food!
> Check out [`tsdown.config.ts`](./tsdown.config.ts) for a real-world example.

```ts
// rolldown.config.ts, rollup.config.ts, tsdown.config.ts, ...
import { defineConfig } from 'rolldown';
import { distPackage } from 'rolldown-plugin-dist-package';

export default defineConfig({
  input: 'src/index.ts',
  output: { dir: 'dist' },
  plugins: [
    distPackage({
      // outDir: 'dist',         // auto-detected from bundler output options
      removeFields: ['scripts', 'devDependencies', 'lint-staged'],
      // bareFields: ['bin'],    // strip outDir prefix without adding './'
      // copyFiles: ['README.md', 'LICENSE', 'CHANGELOG.md'],
      // set: { sideEffects: false, type: 'module' },
      // rewriteDependencies: (_, v) => v.startsWith('workspace:') ? v.slice(10) || '*' : undefined,
      // transform: (pkg) => ({ ...pkg, funding: 'https://github.com/sponsors/you' }),
      // validate: true,         // warn if name or version is missing
    }),
  ],
});
```

---

## Options

| Option                | Type                                 | Default       | Description                                                                                         |
| --------------------- | ------------------------------------ | ------------- | --------------------------------------------------------------------------------------------------- |
| `outDir`              | `string`                             | auto-detected | Output directory. If omitted, read from the bundler's own output options.                           |
| `removeFields`        | `string[]`                           | `[]`          | Top-level fields to delete from the output.                                                         |
| `bareFields`          | `string[]`                           | `['bin']`     | Fields whose path values are stripped of the `outDir` prefix but do **not** get the `./` prepended. |
| `copyFiles`           | `string \| string[]`                 | —             | Files to copy from the project root into the output directory.                                      |
| `set`                 | `Record<string, unknown>`            | —             | Fields to add or override in the output `package.json`.                                             |
| `rewriteDependencies` | `Record<string, string> \| Function` | —             | Rewrite versions in all dependency fields. See below.                                               |
| `transform`           | `(pkg) => pkg \| Promise<pkg>`       | —             | Custom transform applied last, after all other options.                                             |
| `validate`            | `boolean \| string[]`                | `false`       | Warn about missing fields. `true` checks `name` and `version`.                                      |

### `rewriteDependencies`

Object form — replace specific versions:

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

Runs last, after all other options. Full control over the final package object:

```ts
distPackage({
  transform: (pkg) => ({
    ...pkg,
    // add fields, remove conditionally, etc.
    funding: 'https://github.com/sponsors/yourname',
  }),
});
```

---

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
