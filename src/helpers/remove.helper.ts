import path from 'path';
import type { JsonValue } from '../dto/global.dto.js';

/**
 * Recursively strips the `outDir` path prefix from all string values in a
 * JSON-serialisable object tree.
 *
 * - Regular fields: `./dist/index.js` → `./index.js`
 * - Fields listed in `noPrefixFields` (and their descendants): the leading
 *   `./` is omitted so the result is a bare relative path (`cli.js`).
 *
 * @param obj            - The value to transform (any JSON-compatible type).
 * @param outDir         - The output directory name to strip, e.g. `'dist'`.
 * @param noPrefixFields - Top-level field names whose values should not receive
 *                         the `./` prefix after stripping (default `[]`).
 * @param inheritedSkip  - Internal flag propagated to nested calls when a
 *                         no-prefix ancestor field has been entered.
 * @returns The transformed value with path prefixes removed.
 */
export function removeOutDir(
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
