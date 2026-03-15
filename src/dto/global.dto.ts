/**
 * Options for the `cleanPackageJson` plugin.
 */
export interface CleanPackageJsonOptions {
  /**
   * Output directory where the cleaned `package.json` will be written.
   *
   * If omitted, the plugin auto-detects it from the bundler's output options.
   *
   * @example 'dist'
   */
  outDir?: string;

  /**
   * Top-level fields to completely remove from the output `package.json`.
   *
   * Useful for stripping development-only fields like `scripts`, `devDependencies`,
   * `lint-staged`, `prettier`, etc.
   *
   * @example ['scripts', 'devDependencies', 'lint-staged']
   * @default []
   */
  removeFields?: string[];

  /**
   * Fields whose path values should have the `outDir` prefix stripped but
   * should **not** gain the leading `./` that is normally added.
   *
   * This is needed for fields like `bin` where Node.js expects a bare
   * relative path (`cli.js`) rather than a dot-relative one (`./cli.js`).
   *
   * @example ['bin']
   * @default ['bin']
   */
  bareFields?: string[];

  /**
   * Files to copy from the project root into the output directory.
   *
   * @example ['README.md', 'LICENSE', 'CHANGELOG.md']
   */
  copyFiles?: string | string[];

  /**
   * Fields to add or override in the output `package.json`.
   *
   * Applied after `removeFields` and `rewriteDependencies`, but before `transform`.
   *
   * @example { sideEffects: false, type: 'module' }
   */
  set?: Record<string, unknown>;

  /**
   * Custom transform function applied last, after all built-in transformations.
   *
   * Receives the fully transformed package object and must return the final object.
   * May be async.
   *
   * @example
   * ```ts
   * transform: (pkg) => ({ ...pkg, version: pkg.version + '-next' })
   * ```
   */
  transform?: (
    pkg: Record<string, unknown>,
  ) => Record<string, unknown> | Promise<Record<string, unknown>>;

  /**
   * Validate that the output `package.json` contains required fields.
   *
   * - `true` → check `name` and `version`
   * - `string[]` → check each listed field
   *
   * Logs a warning for each missing field; does not throw.
   *
   * @example ['name', 'version', 'exports']
   * @default false
   */
  validate?: boolean | string[];

  /**
   * Rewrite versions inside `dependencies`, `peerDependencies`,
   * `optionalDependencies`, and `devDependencies`.
   *
   * - **Object** — map of `{ packageName: newVersion }`.
   * - **Function** — called with `(name, currentVersion)`;
   *   return the new version string, or `undefined` to keep the original.
   *
   * Useful for stripping the `workspace:` protocol before publishing.
   *
   * @example
   * ```ts
   * // replace specific versions
   * rewriteDependencies: { 'my-local-pkg': '^1.2.0' }
   *
   * // strip yarn workspace: protocol
   * rewriteDependencies: (_, v) =>
   *   v.startsWith('workspace:') ? v.slice('workspace:'.length) || '*' : undefined
   * ```
   */
  rewriteDependencies?:
    | Record<string, string>
    | ((name: string, version: string) => string | undefined);
}

export type JsonValue = string | number | boolean | JsonObject | JsonValue[];
interface JsonObject {
  [key: string]: JsonValue;
}
