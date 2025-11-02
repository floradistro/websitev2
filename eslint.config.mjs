import js from "@eslint/js";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/out/**",
      "**/dist/**",
      "**/build/**",
      "**/.cache/**",
      "**/ai-agent/**",
      "**/mcp-agent/**",
      "**/scripts/**",
      "**/migrations/**",
      "**/public/**",
      "**/*.config.js",
      "**/*.config.mjs",
      "**/*.config.ts",
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/*.spec.ts",
      "**/*.spec.mjs",
      "**/tests/**",
      "**/test-*.mjs",
      "**/explore-*.mjs",
      "**/*.log",
      "**/build-output.log",
    ],
  },
  js.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      "@typescript-eslint": typescriptEslint,
    },
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        // Browser globals
        console: "readonly",
        window: "readonly",
        document: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        fetch: "readonly",
        FormData: "readonly",
        Headers: "readonly",
        Request: "readonly",
        Response: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        AbortController: "readonly",
        Blob: "readonly",
        File: "readonly",
        FileReader: "readonly",
        // Node.js globals
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        // Next.js globals
        NodeJS: "readonly",
        // React/JSX
        React: "readonly",
        JSX: "readonly",
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      }],
      "@typescript-eslint/no-explicit-any": "warn",
      "no-console": ["warn", {
        allow: ["warn", "error"],
      }],
      "no-undef": "off", // TypeScript handles this better
      "no-unused-vars": "off", // Use @typescript-eslint/no-unused-vars instead
      "no-case-declarations": "warn", // Downgrade from error to warning
      "no-constant-condition": "off", // Allow while(true) loops
      "no-useless-escape": "warn", // Downgrade from error to warning
      "no-empty": "warn", // Downgrade from error to warning
      "no-useless-catch": "warn", // Downgrade from error to warning
      "no-constant-binary-expression": "warn", // Downgrade from error to warning
      "no-self-assign": "warn", // Downgrade from error to warning
    },
  },
  {
    // JavaScript files config
    files: ["**/*.js", "**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
      },
    },
    rules: {
      "no-console": ["warn", {
        allow: ["warn", "error"],
      }],
      "no-undef": "error",
    },
  },
];
