import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Custom ignores for data scripts:
    "add-data.*",
    "seed-simple.*",
    "prisma-helper.ps1",
    // Backup and temporary files:
    "backups/**",
    "scripts/**",
    "*.backup.js",
    "check-*.js",
    "quick-entry.js",
    "restore-*.js",
    "temp-*.js",
  ]),
]);

export default eslintConfig;
