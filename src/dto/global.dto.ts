export interface CleanPackageJsonOptions {
  outDir?: string;
  removeFields?: string[];
  noPrefix?: string[];
}

export type JsonValue = string | number | boolean | JsonObject | JsonValue[];
interface JsonObject {
  [key: string]: JsonValue;
}
