#!/usr/bin/env ts-node
/**
 * Remove console.log statements from production code
 * Keeps console.error and console.warn in development guards
 */

import * as fs from "fs";
import * as path from "path";

interface Stats {
  filesScanned: number;
  filesModified: number;
  consolesRemoved: number;
  consolesKept: number;
}

const stats: Stats = {
  filesScanned: 0,
  filesModified: 0,
  consolesRemoved: 0,
  consolesKept: 0,
};

// Directories to process
const DIRS_TO_PROCESS = ["app", "components", "lib"];

// Files to skip
const SKIP_PATTERNS = [
  /node_modules/,
  /\.next/,
  /\.git/,
  /dist/,
  /build/,
  /coverage/,
];

// Console methods to remove unconditionally
const CONSOLE_TO_REMOVE = [
  "log",
  "debug",
  "info",
  "table",
  "dir",
  "dirxml",
  "trace",
];

// Console methods to keep if in development guard
const CONSOLE_TO_GUARD = ["warn", "error"];

function shouldSkipFile(filePath: string): boolean {
  return SKIP_PATTERNS.some((pattern) => pattern.test(filePath));
}

function isTypeScriptFile(filePath: string): boolean {
  return /\.(ts|tsx|js|jsx)$/.test(filePath);
}

function processFile(filePath: string): void {
  stats.filesScanned++;

  if (!isTypeScriptFile(filePath) || shouldSkipFile(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");
  let modifiedContent = content;
  let fileModified = false;

  // Remove console.log, console.debug, etc.
  CONSOLE_TO_REMOVE.forEach((method) => {
    const patterns = [
      // Standalone console statements
      new RegExp(`^\\s*console\\.${method}\\([^)]*\\);?\\s*$`, "gm"),
      // Inline console statements (with semicolon)
      new RegExp(`\\s*console\\.${method}\\([^)]*\\);`, "g"),
    ];

    patterns.forEach((pattern) => {
      const before = modifiedContent;
      modifiedContent = modifiedContent.replace(pattern, "");
      if (before !== modifiedContent) {
        const matches = before.match(pattern) || [];
        stats.consolesRemoved += matches.length;
        fileModified = true;
      }
    });
  });

  // Wrap console.error and console.warn in development guards
  CONSOLE_TO_GUARD.forEach((method) => {
    // Find console.error/warn that are NOT already in a development guard
    const pattern = new RegExp(
      `^(\\s*)console\\.${method}\\(([^)]+)\\);?\\s*$`,
      "gm",
    );

    modifiedContent = modifiedContent.replace(
      pattern,
      (match, indent, args) => {
        // Check if already in a development guard
        const lines = modifiedContent.split("\n");
        const matchIndex = lines.findIndex((line) =>
          line.includes(match.trim()),
        );

        // Simple check: look for if (process.env.NODE_ENV within 3 lines before
        if (matchIndex > 0) {
          const previousLines = lines
            .slice(Math.max(0, matchIndex - 3), matchIndex)
            .join("\n");
          if (
            previousLines.includes("process.env.NODE_ENV") ||
            previousLines.includes("NODE_ENV") ||
            previousLines.includes("development")
          ) {
            stats.consolesKept++;
            return match; // Already guarded, keep as is
          }
        }

        stats.consolesRemoved++;
        fileModified = true;

        // Wrap in development guard
        return `${indent}if (process.env.NODE_ENV === 'development') {\n${indent}  console.${method}(${args});\n${indent}}`;
      },
    );
  });

  // Clean up multiple empty lines (left after removing console.logs)
  modifiedContent = modifiedContent.replace(/\n\s*\n\s*\n/g, "\n\n");

  if (fileModified) {
    fs.writeFileSync(filePath, modifiedContent, "utf8");
    stats.filesModified++;
    console.log(`✓ ${filePath}`);
  }
}

function walkDirectory(dir: string): void {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);

    if (shouldSkipFile(filePath)) {
      return;
    }

    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      walkDirectory(filePath);
    } else {
      processFile(filePath);
    }
  });
}

// Main execution
console.log("🧹 Console.log Cleanup Tool\n");
console.log("Starting cleanup...\n");

DIRS_TO_PROCESS.forEach((dir) => {
  const fullPath = path.join(process.cwd(), dir);
  if (fs.existsSync(fullPath)) {
    console.log(`Processing ${dir}/...`);
    walkDirectory(fullPath);
  }
});

console.log("\n" + "=".repeat(60));
console.log("📊 Cleanup Summary");
console.log("=".repeat(60));
console.log(`Files scanned:     ${stats.filesScanned}`);
console.log(`Files modified:    ${stats.filesModified}`);
console.log(`Consoles removed:  ${stats.consolesRemoved}`);
console.log(`Consoles guarded:  ${stats.consolesKept}`);
console.log("=".repeat(60));
console.log("\n✅ Cleanup complete!\n");
console.log("Next steps:");
console.log("1. Run: npm run lint:fix");
console.log("2. Run: npm run format");
console.log("3. Test your application");
console.log("4. Commit changes\n");
