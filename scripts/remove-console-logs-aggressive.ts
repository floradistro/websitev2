#!/usr/bin/env ts-node
/**
 * Aggressive console.log removal
 * Handles multiline statements, template literals, and nested calls
 */

import * as fs from "fs";
import * as path from "path";

interface Stats {
  filesScanned: number;
  filesModified: number;
  consolesRemoved: number;
}

const stats: Stats = {
  filesScanned: 0,
  filesModified: 0,
  consolesRemoved: 0,
};

const DIRS_TO_PROCESS = ["app", "components", "lib"];

const SKIP_PATTERNS = [
  /node_modules/,
  /\.next/,
  /\.git/,
  /dist/,
  /build/,
  /coverage/,
  /scripts/, // Don't modify our own scripts
];

function shouldSkipFile(filePath: string): boolean {
  return SKIP_PATTERNS.some((pattern) => pattern.test(filePath));
}

function isTypeScriptFile(filePath: string): boolean {
  return /\.(ts|tsx|js|jsx)$/.test(filePath);
}

function removeConsoleLogs(content: string): {
  content: string;
  removedCount: number;
} {
  let modified = content;
  let removedCount = 0;

  // Pattern 1: Simple single-line console.log
  const simplePattern = /^\s*console\.log\([^)]*\);?\s*$/gm;
  const simpleMatches = modified.match(simplePattern) || [];
  modified = modified.replace(simplePattern, "");
  removedCount += simpleMatches.length;

  // Pattern 2: Console.log with multiline arguments (using backticks or spread across lines)
  // Match console.log( ... ) where ... can span multiple lines
  const multilinePattern = /^\s*console\.log\s*\([^;]*?\);?\s*$/gms;
  let prevModified = "";
  while (prevModified !== modified) {
    prevModified = modified;
    const multiMatches = modified.match(multilinePattern) || [];
    modified = modified.replace(multilinePattern, "");
    removedCount += multiMatches.length;
  }

  // Pattern 3: Console.log in the middle of a line (after semicolon or before semicolon)
  const inlinePattern = /;\s*console\.log\([^)]*\);?/g;
  const inlineMatches = modified.match(inlinePattern) || [];
  modified = modified.replace(inlinePattern, ";");
  removedCount += inlineMatches.length;

  // Pattern 4: Console.log with template literals
  const templatePattern = /^\s*console\.log\s*\(`[^`]*`\);?\s*$/gm;
  const templateMatches = modified.match(templatePattern) || [];
  modified = modified.replace(templatePattern, "");
  removedCount += templateMatches.length;

  // Pattern 5: Console.log with string concatenation
  const concatPattern = /^\s*console\.log\s*\([^)]*\+[^)]*\);?\s*$/gm;
  const concatMatches = modified.match(concatPattern) || [];
  modified = modified.replace(concatPattern, "");
  removedCount += concatMatches.length;

  // Pattern 6: console.debug, console.info, console.table
  ["debug", "info", "table", "dir"].forEach((method) => {
    const methodPattern = new RegExp(
      `^\\s*console\\.${method}\\s*\\([^;]*?\\);?\\s*$`,
      "gms",
    );
    const methodMatches = modified.match(methodPattern) || [];
    modified = modified.replace(methodPattern, "");
    removedCount += methodMatches.length;
  });

  // Clean up multiple consecutive empty lines
  modified = modified.replace(/\n\s*\n\s*\n+/g, "\n\n");

  return { content: modified, removedCount };
}

function processFile(filePath: string): void {
  stats.filesScanned++;

  if (!isTypeScriptFile(filePath) || shouldSkipFile(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");
  const { content: modifiedContent, removedCount } = removeConsoleLogs(content);

  if (removedCount > 0) {
    fs.writeFileSync(filePath, modifiedContent, "utf8");
    stats.filesModified++;
    stats.consolesRemoved += removedCount;
    console.log(`✓ ${filePath} (removed ${removedCount})`);
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
console.log("🧹 Aggressive Console.log Cleanup\n");
console.log("This will remove ALL console.log statements\n");

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
console.log("=".repeat(60));
console.log("\n✅ Aggressive cleanup complete!\n");
