import path from 'path';
import type { JsonValue } from '../dto/global.dto.js';

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
