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
}

export type JsonValue = string | number | boolean | JsonObject | JsonValue[];
interface JsonObject {
  [key: string]: JsonValue;
}
