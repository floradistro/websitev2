/**
 * Query Pattern Analyzer
 * Scans codebase for potential query optimization opportunities
 *
 * Usage: npx tsx scripts/analyze-query-patterns.ts
 */

import * as fs from "fs";
import * as path from "path";

interface QueryIssue {
  file: string;
  line: number;
  type: "n+1" | "select-all" | "no-limit" | "sequential" | "no-index-hint";
  severity: "high" | "medium" | "low";
  description: string;
  code: string;
}

const issues: QueryIssue[] = [];

/**
 * Recursively scan directory for TypeScript files
 */
function scanDirectory(dir: string): string[] {
  const files: string[] = [];

  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Skip node_modules, .next, etc.
      if (
        !item.startsWith(".") &&
        item !== "node_modules" &&
        item !== ".next" &&
        item !== "dist"
      ) {
        files.push(...scanDirectory(fullPath));
      }
    } else if (item.endsWith(".ts") || item.endsWith(".tsx")) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Analyze a single file for query anti-patterns
 */
function analyzeFile(filePath: string) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  // Track context for multi-line patterns
  let inForLoop = false;
  let forLoopStart = 0;
  let hasAwaitInLoop = false;

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    // Check for SELECT * pattern
    if (trimmed.includes(".select('*')") || trimmed.includes('.select("*")')) {
      issues.push({
        file: filePath,
        line: lineNum,
        type: "select-all",
        severity: "medium",
        description: "Using SELECT * fetches all columns. Specify only needed columns.",
        code: trimmed,
      });
    }

    // Check for queries without .limit()
    if (trimmed.includes(".from(") && trimmed.includes(".select(")) {
      // Check if this query has a limit within next 3 lines
      const nextLines = lines.slice(index, index + 4).join("\n");
      if (!nextLines.includes(".limit(") && !nextLines.includes(".single()")) {
        issues.push({
          file: filePath,
          line: lineNum,
          type: "no-limit",
          severity: "high",
          description: "Query without LIMIT may return excessive rows",
          code: trimmed,
        });
      }
    }

    // Track for loops
    if (trimmed.startsWith("for (") || trimmed.startsWith("for(")) {
      inForLoop = true;
      forLoopStart = lineNum;
      hasAwaitInLoop = false;
    }

    // Check for await inside loops (potential N+1)
    if (inForLoop && trimmed.includes("await")) {
      if (
        trimmed.includes(".from(") ||
        trimmed.includes("supabase") ||
        trimmed.includes("fetch(")
      ) {
        hasAwaitInLoop = true;
      }
    }

    // End of for loop
    if (inForLoop && trimmed === "}") {
      if (hasAwaitInLoop) {
        issues.push({
          file: filePath,
          line: forLoopStart,
          type: "n+1",
          severity: "high",
          description:
            "Potential N+1 query: Database call inside loop. Consider using JOIN or Promise.all",
          code: lines.slice(forLoopStart - 1, lineNum).join("\n"),
        });
      }
      inForLoop = false;
    }

    // Check for sequential awaits (should use Promise.all)
    if (trimmed.startsWith("await") && trimmed.includes("supabase")) {
      const nextLine = lines[index + 1]?.trim();
      if (nextLine?.startsWith("await") && nextLine.includes("supabase")) {
        // Check if they're independent queries
        const currentQuery = trimmed;
        const nextQuery = nextLine;

        // Simple heuristic: if both are SELECT queries, likely independent
        if (currentQuery.includes(".from(") && nextQuery.includes(".from(")) {
          issues.push({
            file: filePath,
            line: lineNum,
            type: "sequential",
            severity: "medium",
            description:
              "Sequential awaits detected. Consider Promise.all for parallel execution",
            code: `${trimmed}\n${nextLine}`,
          });
        }
      }
    }

    // Check for missing WHERE clause on common filters
    if (trimmed.includes(".from('products')") || trimmed.includes('.from("products")')) {
      const nextLines = lines.slice(index, index + 5).join("\n");
      if (!nextLines.includes(".eq('vendor_id'") && !nextLines.includes('.eq("vendor_id"')) {
        issues.push({
          file: filePath,
          line: lineNum,
          type: "no-index-hint",
          severity: "medium",
          description: "Products query without vendor_id filter. May scan entire table.",
          code: trimmed,
        });
      }
    }
  });
}

/**
 * Generate report
 */
function generateReport() {
  console.log("=".repeat(80));
  console.log("QUERY PATTERN ANALYSIS REPORT");
  console.log("=".repeat(80));
  console.log();

  if (issues.length === 0) {
    console.log("✅ No query optimization issues found!");
    return;
  }

  // Group by severity
  const highSeverity = issues.filter((i) => i.severity === "high");
  const mediumSeverity = issues.filter((i) => i.severity === "medium");
  const lowSeverity = issues.filter((i) => i.severity === "low");

  console.log(`Total Issues Found: ${issues.length}`);
  console.log(`  - High Severity: ${highSeverity.length}`);
  console.log(`  - Medium Severity: ${mediumSeverity.length}`);
  console.log(`  - Low Severity: ${lowSeverity.length}`);
  console.log();

  // Print high severity issues first
  if (highSeverity.length > 0) {
    console.log("=".repeat(80));
    console.log("🚨 HIGH SEVERITY ISSUES (Fix immediately)");
    console.log("=".repeat(80));
    printIssues(highSeverity);
  }

  // Print medium severity issues
  if (mediumSeverity.length > 0) {
    console.log("=".repeat(80));
    console.log("⚠️  MEDIUM SEVERITY ISSUES (Should fix)");
    console.log("=".repeat(80));
    printIssues(mediumSeverity);
  }

  // Print low severity issues
  if (lowSeverity.length > 0) {
    console.log("=".repeat(80));
    console.log("ℹ️  LOW SEVERITY ISSUES (Consider fixing)");
    console.log("=".repeat(80));
    printIssues(lowSeverity);
  }

  console.log("=".repeat(80));
  console.log("RECOMMENDATIONS");
  console.log("=".repeat(80));
  console.log();
  console.log("1. Run: npm run db:create-indexes");
  console.log("2. Review high severity issues immediately");
  console.log("3. Use Promise.all for parallel queries");
  console.log("4. Add LIMIT clauses to prevent excessive data transfer");
  console.log("5. Select only required columns (avoid SELECT *)");
  console.log();
  console.log("See docs/QUERY_OPTIMIZATION_GUIDE.md for detailed guidance");
  console.log();
}

function printIssues(issueList: QueryIssue[]) {
  // Group by type
  const grouped = issueList.reduce(
    (acc, issue) => {
      if (!acc[issue.type]) acc[issue.type] = [];
      acc[issue.type].push(issue);
      return acc;
    },
    {} as Record<string, QueryIssue[]>,
  );

  Object.entries(grouped).forEach(([type, typeIssues]) => {
    console.log();
    console.log(`${getTypeLabel(type)} (${typeIssues.length} occurrences)`);
    console.log("-".repeat(80));

    typeIssues.forEach((issue, idx) => {
      console.log();
      console.log(`${idx + 1}. ${issue.file}:${issue.line}`);
      console.log(`   ${issue.description}`);
      console.log(`   Code: ${issue.code.substring(0, 100)}...`);
    });
  });
  console.log();
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    "n+1": "N+1 Query Pattern",
    "select-all": "SELECT * Pattern",
    "no-limit": "Missing LIMIT Clause",
    sequential: "Sequential Awaits",
    "no-index-hint": "Missing Index Filter",
  };
  return labels[type] || type;
}

/**
 * Main execution
 */
function main() {
  console.log("Scanning codebase for query patterns...");
  console.log();

  const apiDir = path.join(process.cwd(), "app", "api");
  const libDir = path.join(process.cwd(), "lib");

  const apiFiles = scanDirectory(apiDir);
  const libFiles = scanDirectory(libDir);

  const allFiles = [...apiFiles, ...libFiles];

  console.log(`Found ${allFiles.length} TypeScript files`);
  console.log();

  allFiles.forEach(analyzeFile);

  generateReport();
}

main();
