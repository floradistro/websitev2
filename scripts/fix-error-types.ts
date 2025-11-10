#!/usr/bin/env ts-node
/**
 * Fix error: any to proper typed error handling
 * Replaces 'catch (error: any)' with 'catch (error)' + toError(error)
 */

import * as fs from "fs";
import * as path from "path";
import { globSync } from "glob";

async function fixFile(filePath: string): Promise<boolean> {
  const content = fs.readFileSync(filePath, "utf-8");
  let modified = false;
  let newContent = content;

  // Check if file has 'error: any' in catch blocks
  if (!content.includes("error: any")) {
    return false;
  }

  // Add import if needed
  if (
    !content.includes('from "@/lib/errors"') &&
    (content.includes("error: any") || content.includes("catch (error: any)"))
  ) {
    // Find the last import statement
    const importMatch = content.match(/^import .* from .*;\n/gm);
    if (importMatch) {
      const lastImport = importMatch[importMatch.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport);
      const insertIndex = lastImportIndex + lastImport.length;

      newContent =
        content.slice(0, insertIndex) +
        'import { toError } from "@/lib/errors";\n' +
        content.slice(insertIndex);
      modified = true;
    }
  }

  // Replace 'catch (error: any)' with 'catch (error)'
  newContent = newContent.replace(/catch \(error: any\)/g, "catch (error)");

  // Add 'const err = toError(error);' after catch if not already present
  newContent = newContent.replace(
    /catch \(error\) \{(\n\s+)(?!const err = toError)/g,
    "catch (error) {$1const err = toError(error);$1"
  );

  // Replace error.message with err.message in catch blocks
  newContent = newContent.replace(
    /catch \(error\) \{[\s\S]*?\}/g,
    (match) => {
      return match
        .replace(/error\.message/g, "err.message")
        .replace(/error\.stack/g, "err.stack");
    }
  );

  // Replace logger.error("...", error) with logger.error("...", err)
  newContent = newContent.replace(
    /logger\.error\((.*?), error\)/g,
    "logger.error($1, err)"
  );

  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, "utf-8");
    return true;
  }

  return modified;
}

async function main() {
  const files = globSync("app/api/**/*.ts", {
    ignore: ["**/node_modules/**", "**/*.d.ts"],
  });

  console.log(`Found ${files.length} API route files to process...`);

  let fixed = 0;
  let errors = 0;

  for (const file of files) {
    try {
      const wasFixed = await fixFile(file);
      if (wasFixed) {
        console.log(`✅ Fixed: ${file}`);
        fixed++;
      }
    } catch (error) {
      console.error(`❌ Error in ${file}:`, error);
      errors++;
    }
  }

  console.log(`\n✅ Fixed ${fixed} files`);
  if (errors > 0) {
    console.log(`❌ ${errors} errors encountered`);
  }
}

main().catch(console.error);
