import fs from 'fs';
import path from 'path';
import type { NormalizedOutputOptions, OutputBundle, Plugin } from 'rolldown';
import { PLUGIN_NAME } from './consts.js';
import type { CleanPackageJsonOptions } from './dto/global.dto.js';
import { removeOutDir } from './helpers/remove.helper.js';

/**
 * Rolldown / Rollup plugin that copies a cleaned version of `package.json`
 * into the build output directory.
 *
 * It automatically:
 * - Strips the `outDir` prefix from all path-like values so that paths work
 *   correctly when the package is consumed from the output folder.
 * - Removes any extra top-level fields you specify via `removeFields`.
 *
 * @param options - Optional plugin configuration.
 * @returns A Rolldown/Rollup-compatible plugin object.
 *
 * @example
 * ```ts
 * // rolldown.config.ts
 * import { defineConfig } from 'rolldown'
 * import { cleanPackageJson } from 'rolldown-plugin-dist-package'
 *
 * export default defineConfig({
 *   input: 'src/index.ts',
 *   output: { dir: 'dist' },
 *   plugins: [
 *     cleanPackageJson({
 *       removeFields: ['scripts', 'devDependencies'],
 *     }),
 *   ],
 * })
 * ```
 */
export function cleanPackageJson(
  options: CleanPackageJsonOptions = {},
): Plugin {
  return {
    name: PLUGIN_NAME,

    // Updated signature with correct Rolldown types
    writeBundle(outputOptions: NormalizedOutputOptions, bundle: OutputBundle) {
      const root = process.cwd();
      const src = path.join(root, 'package.json');

      // Fallback to user provided outDir or auto-detect from bundler's outputOptions
      const targetDir = options.outDir || outputOptions.dir;

      if (!targetDir) {
        console.warn(
          `⚠️ [${PLUGIN_NAME}] Could not determine output directory. Skipping package.json copy.`,
        );
        return;
      }

      const destDir = path.isAbsolute(targetDir)
        ? targetDir
        : path.join(root, targetDir);
      const dest = path.join(destDir, 'package.json');

      if (!fs.existsSync(src)) {
        console.error(`❌ [${PLUGIN_NAME}] package.json not found`);
        return;
      }

      const rawJson = fs.readFileSync(src, 'utf8');
      const transformedPkg = transformPackageJson(rawJson, targetDir, options);

      // Save the cleaned package.json to the output directory
      fs.mkdirSync(destDir, { recursive: true });
      fs.writeFileSync(dest, transformedPkg);

      console.log(
        `✅ [${PLUGIN_NAME}] package.json copied and cleaned in ${targetDir}`,
      );
    },
  };
}

export function transformPackageJson(
  rawJson: string,
  outDir: string,
  options: CleanPackageJsonOptions,
): string {
  let pkg = JSON.parse(rawJson);

  pkg = removeOutDir(pkg, outDir, options.bareFields || ['bin']);

  // Clean up unnecessary fields
  for (const field of options.removeFields || []) {
    delete pkg[field];
  }

  return JSON.stringify(pkg, null, 2);
}

export type { CleanPackageJsonOptions };
