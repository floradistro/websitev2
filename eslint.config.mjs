import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.config({
    extends: ["next/core-web-vitals"],
    rules: {
      // Prevent console statements in production
      "no-console": ["warn", { allow: ["warn", "error"] }],

      // TypeScript rules
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_"
      }],

      // React hooks rules
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // General code quality
      "no-debugger": "error",
      "no-alert": "warn",
      "prefer-const": "warn",
      "no-var": "error",
    },
  }),
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/out/**",
      "**/public/**",
      "**/mcp-agent/**",
      "**/ai-agent/**",
      "**/scripts/migrate-*.ts",
      "**/scripts/MIGRATION-*.ts",
    ],
  },
];

export default eslintConfig;
