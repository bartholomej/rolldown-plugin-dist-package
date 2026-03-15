import fs from 'fs';
import path from 'path';
import type { NormalizedOutputOptions, OutputBundle, Plugin } from 'rolldown';
import type { CleanPackageJsonOptions, JsonValue } from './dto/global.dto.js';

const NAME = 'rolldown-plugin-clean-package-json';

export function cleanPackageJson(
  options: CleanPackageJsonOptions = {},
): Plugin {
  return {
    name: NAME,

    // Updated signature with correct Rolldown types
    writeBundle(outputOptions: NormalizedOutputOptions, bundle: OutputBundle) {
      const root = process.cwd();
      const src = path.join(root, 'package.json');

      // Fallback to user provided outDir or auto-detect from bundler's outputOptions
      const targetDir = options.outDir || outputOptions.dir;

      if (!targetDir) {
        console.warn(
          `⚠️ [${NAME}] Could not determine output directory. Skipping package.json copy.`,
        );
        return;
      }

      const destDir = path.isAbsolute(targetDir)
        ? targetDir
        : path.join(root, targetDir);
      const dest = path.join(destDir, 'package.json');

      if (!fs.existsSync(src)) {
        console.error(`❌ [${NAME}] package.json not found`);
        return;
      }

      const rawJson = fs.readFileSync(src, 'utf8');
      const transformedPkg = transformPackageJson(rawJson, targetDir, options);

      // Save the cleaned package.json to the output directory
      fs.mkdirSync(destDir, { recursive: true });
      fs.writeFileSync(dest, transformedPkg);

      console.log(
        `✅ [${NAME}] package.json copied and cleaned in ${targetDir}`,
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

  pkg = removeOutDir(pkg, outDir, options.noPrefix || ['bin']);

  // Clean up unnecessary fields
  for (const field of options.removeFields || []) {
    delete pkg[field];
  }

  return JSON.stringify(pkg, null, 2);
}

function removeOutDir(
  obj: JsonValue,
  outDir: string,
  noPrefixFields: string[] = [],
  inheritedSkip: boolean = false,
): JsonValue {
  if (typeof obj === 'string') {
    const prefix = `./${outDir}/`;
    if (obj.startsWith(prefix)) {
      let cleaned = obj.slice(prefix.length);
      cleaned = path.posix.normalize(cleaned);

      if (inheritedSkip) {
        return cleaned;
      }

      cleaned = cleaned ? `./${cleaned}` : './';
      return cleaned;
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) =>
      removeOutDir(item, outDir, noPrefixFields, inheritedSkip),
    );
  }

  if (typeof obj === 'object' && obj !== null) {
    const newObj: Record<string, any> = {};
    for (const key in obj) {
      const willSkip = inheritedSkip || noPrefixFields.includes(key);
      newObj[key] = removeOutDir(obj[key], outDir, noPrefixFields, willSkip);
    }
    return newObj;
  }

  return obj;
}

export type { CleanPackageJsonOptions };
