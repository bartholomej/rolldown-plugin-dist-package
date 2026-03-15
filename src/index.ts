import fs from 'fs';
import path from 'path';
import type { NormalizedOutputOptions, OutputBundle, Plugin } from 'rolldown';
import { PLUGIN_NAME } from './consts.js';
import type { DistPackageOptions } from './dto/global.dto.js';
import { removeOutDir } from './helpers/remove.helper.js';

const DEP_FIELDS = [
  'dependencies',
  'peerDependencies',
  'optionalDependencies',
  'devDependencies',
] as const;

/**
 * Rolldown / Rollup plugin that copies a cleaned version of `package.json`
 * into the build output directory.
 *
 * It automatically:
 * - Strips the `outDir` prefix from all path-like values so that paths work
 *   correctly when the package is consumed from the output folder.
 * - Removes any extra top-level fields you specify via `removeFields`.
 * - Copies additional files (README, LICENSE, …) via `copyFiles`.
 * - Overrides fields via `set`, rewrites dependency versions via
 *   `rewriteDependencies`, and supports a fully custom `transform` function.
 *
 * @param options - Optional plugin configuration.
 * @returns A Rolldown/Rollup-compatible plugin object.
 *
 * @example
 * ```ts
 * // rolldown.config.ts
 * import { defineConfig } from 'rolldown'
 * import { distPackage } from 'rolldown-plugin-dist-package'
 *
 * export default defineConfig({
 *   input: 'src/index.ts',
 *   output: { dir: 'dist' },
 *   plugins: [
 *     distPackage({
 *       removeFields: ['scripts', 'devDependencies'],
 *       copyFiles: ['README.md', 'LICENSE'],
 *       set: { sideEffects: false },
 *     }),
 *   ],
 * })
 * ```
 */
export function distPackage(options: DistPackageOptions = {}): Plugin {
  return {
    name: PLUGIN_NAME,

    async writeBundle(
      outputOptions: NormalizedOutputOptions,
      _bundle: OutputBundle,
    ) {
      const root = process.cwd();
      const src = path.join(root, 'package.json');

      const targetDir = options.outDir || outputOptions.dir;

      if (!targetDir) {
        console.warn(
          `⚠️ [${PLUGIN_NAME}] Could not determine output directory. Skipping.`,
        );
        return;
      }

      const destDir = path.isAbsolute(targetDir)
        ? targetDir
        : path.join(root, targetDir);

      if (!fs.existsSync(src)) {
        console.error(`❌ [${PLUGIN_NAME}] package.json not found`);
        return;
      }

      fs.mkdirSync(destDir, { recursive: true });

      // Transform and write package.json
      const rawJson = fs.readFileSync(src, 'utf8');
      const transformedJson = await transformPackageJson(
        rawJson,
        targetDir,
        options,
      );

      // Validate output
      if (options.validate) {
        const fields =
          options.validate === true ? ['name', 'version'] : options.validate;
        const pkg = JSON.parse(transformedJson) as Record<string, unknown>;
        for (const field of fields) {
          if (pkg[field] === undefined) {
            console.warn(
              `⚠️ [${PLUGIN_NAME}] Missing required field "${field}" in output package.json`,
            );
          }
        }
      }

      fs.writeFileSync(path.join(destDir, 'package.json'), transformedJson);
      console.log(
        `✅ [${PLUGIN_NAME}] package.json copied and cleaned to ${targetDir}`,
      );

      // Copy additional files
      if (options.copyFiles) {
        const files = Array.isArray(options.copyFiles)
          ? options.copyFiles
          : [options.copyFiles];

        for (const file of files) {
          const srcFile = path.join(root, file);
          const destFile = path.join(destDir, path.basename(file));
          if (fs.existsSync(srcFile)) {
            fs.copyFileSync(srcFile, destFile);
            console.log(`✅ [${PLUGIN_NAME}] Copied ${file} to ${targetDir}`);
          } else {
            console.warn(
              `⚠️ [${PLUGIN_NAME}] File not found, skipping: ${file}`,
            );
          }
        }
      }
    },
  };
}

/**
 * Pure transformation function that applies all cleaning rules to a raw
 * `package.json` string and returns the cleaned JSON string.
 *
 * Exposed primarily for unit-testing; prefer using the plugin via
 * {@link distPackage} in production builds.
 *
 * @param rawJson - Raw contents of `package.json` as a UTF-8 string.
 * @param outDir  - The output directory name whose prefix should be stripped
 *                  from path values (e.g. `'dist'`).
 * @param options - The same options accepted by {@link distPackage}.
 * @returns Pretty-printed JSON string of the cleaned package.
 */
export async function transformPackageJson(
  rawJson: string,
  outDir: string,
  options: DistPackageOptions,
): Promise<string> {
  let pkg = JSON.parse(rawJson) as Record<string, unknown>;

  // Strip outDir prefix from path-like values
  pkg = removeOutDir(pkg, outDir, options.bareFields || ['bin']) as Record<
    string,
    unknown
  >;

  // Remove specified top-level fields
  for (const field of options.removeFields || []) {
    delete pkg[field];
  }

  // Rewrite dependency versions
  if (options.rewriteDependencies) {
    for (const depField of DEP_FIELDS) {
      const deps = pkg[depField];
      if (deps && typeof deps === 'object' && !Array.isArray(deps)) {
        for (const [name, version] of Object.entries(
          deps as Record<string, string>,
        )) {
          const newVersion =
            typeof options.rewriteDependencies === 'function'
              ? options.rewriteDependencies(name, version)
              : options.rewriteDependencies[name];

          if (newVersion !== undefined) {
            (deps as Record<string, string>)[name] = newVersion;
          }
        }
      }
    }
  }

  // Set / override fields
  if (options.set) {
    Object.assign(pkg, options.set);
  }

  // Custom transform — applied last for full control
  if (options.transform) {
    pkg = await options.transform(pkg);
  }

  return JSON.stringify(pkg, null, 2);
}

export type { DistPackageOptions };
