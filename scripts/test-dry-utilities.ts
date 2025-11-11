/**
 * Comprehensive Testing: DRY Utilities with Edge Cases
 * Tests route wrappers, query builders, and response builders
 *
 * Usage: npx tsx scripts/test-dry-utilities.ts
 */

import { NextRequest, NextResponse } from "next/server";
import {
  AnalyticsQueryBuilder,
  AnalyticsResponseBuilder,
  AnalyticsAggregator,
} from "@/lib/api/analytics-query-builder";

interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  duration: number;
  error?: string;
}

const results: TestResult[] = [];

/**
 * Test helper
 */
function runTest(
  name: string,
  category: string,
  testFn: () => void | Promise<void>,
): Promise<void> {
  return new Promise(async (resolve) => {
    const start = performance.now();
    try {
      await testFn();
      results.push({
        name,
        category,
        passed: true,
        duration: performance.now() - start,
      });
    } catch (error: any) {
      results.push({
        name,
        category,
        passed: false,
        duration: performance.now() - start,
        error: error.message,
      });
    }
    resolve();
  });
}

/**
 * Mock Supabase client for testing
 */
function createMockSupabase() {
  let mockQuery: any = {
    _table: "",
    _select: "*",
    _filters: [] as any[],
    _order: null as any,
    _limit: null as number | null,
  };

  const resetMock = () => {
    mockQuery = {
      _table: "",
      _select: "*",
      _filters: [],
      _order: null,
      _limit: null,
    };
  };

  const chainable: any = {
    select: (query: string) => {
      mockQuery._select = query;
      return chainable;
    },
    eq: (col: string, val: any) => {
      mockQuery._filters.push({ type: "eq", col, val });
      return chainable;
    },
    neq: (col: string, val: any) => {
      mockQuery._filters.push({ type: "neq", col, val });
      return chainable;
    },
    gt: (col: string, val: any) => {
      mockQuery._filters.push({ type: "gt", col, val });
      return chainable;
    },
    gte: (col: string, val: any) => {
      mockQuery._filters.push({ type: "gte", col, val });
      return chainable;
    },
    lt: (col: string, val: any) => {
      mockQuery._filters.push({ type: "lt", col, val });
      return chainable;
    },
    lte: (col: string, val: any) => {
      mockQuery._filters.push({ type: "lte", col, val });
      return chainable;
    },
    in: (col: string, vals: any[]) => {
      mockQuery._filters.push({ type: "in", col, vals });
      return chainable;
    },
    is: (col: string, val: any) => {
      mockQuery._filters.push({ type: "is", col, val });
      return chainable;
    },
    not: (col: string, op: string, val: any) => {
      mockQuery._filters.push({ type: "not", col, op, val });
      return chainable;
    },
    order: (col: string, opts: any) => {
      mockQuery._order = { col, ...opts };
      return chainable;
    },
    limit: (count: number) => {
      mockQuery._limit = count;
      return chainable;
    },
    then: (resolve: any) => {
      resolve({ data: [], error: null });
    },
  };

  return {
    from: (table: string) => {
      resetMock();
      mockQuery._table = table;
      return {
        select: (query: string) => {
          mockQuery._select = query;
          return chainable;
        },
      };
    },
    _getMockQuery: () => mockQuery,
    _resetMock: resetMock,
  };
}

/**
 * TEST SUITE 1: Analytics Query Builder
 */
async function testQueryBuilder() {
  console.log("\n📋 Test Suite 1: Analytics Query Builder");
  console.log("-".repeat(60));

  const mockSupabase = createMockSupabase() as any;
  const vendorId = "test-vendor-123";

  // Test 1.1: Basic query construction
  await runTest("Basic query construction", "QueryBuilder", () => {
    const builder = new AnalyticsQueryBuilder(mockSupabase, vendorId);
    builder.from("orders", "id, total");

    const query = mockSupabase._getMockQuery();
    if (query._table !== "orders") throw new Error("Table not set correctly");
    if (query._select !== "id, total") throw new Error("Select not set correctly");
  });

  // Test 1.2: Date range filtering
  await runTest("Date range filtering", "QueryBuilder", () => {
    const builder = new AnalyticsQueryBuilder(mockSupabase, vendorId);
    builder.from("orders").dateRange("2025-01-01", "2025-01-31");

    const query = mockSupabase._getMockQuery();
    const hasStartDate = query._filters.some(
      (f: any) => f.type === "gte" && f.col === "order_date",
    );
    const hasEndDate = query._filters.some(
      (f: any) => f.type === "lte" && f.col === "order_date",
    );

    if (!hasStartDate || !hasEndDate) {
      throw new Error("Date range filters not applied correctly");
    }
  });

  // Test 1.3: Status filter (with refunds)
  await runTest("Status filter with refunds", "QueryBuilder", () => {
    const builder = new AnalyticsQueryBuilder(mockSupabase, vendorId);
    builder.from("orders").statusFilter(true);

    const query = mockSupabase._getMockQuery();
    const statusFilter = query._filters.find((f: any) => f.type === "in" && f.col === "status");

    if (
      !statusFilter ||
      !statusFilter.vals.includes("refunded") ||
      !statusFilter.vals.includes("completed")
    ) {
      throw new Error("Status filter with refunds not applied correctly");
    }
  });

  // Test 1.4: Status filter (without refunds)
  await runTest("Status filter without refunds", "QueryBuilder", () => {
    mockSupabase._resetMock();
    const builder = new AnalyticsQueryBuilder(mockSupabase, vendorId);
    builder.from("orders").statusFilter(false);

    const query = mockSupabase._getMockQuery();
    const statusFilter = query._filters.find((f: any) => f.type === "in" && f.col === "status");

    if (statusFilter && statusFilter.vals.includes("refunded")) {
      throw new Error("Refunded status should not be included");
    }
  });

  // Test 1.5: Location filter
  await runTest("Location filter", "QueryBuilder", () => {
    mockSupabase._resetMock();
    const builder = new AnalyticsQueryBuilder(mockSupabase, vendorId);
    const locationIds = ["loc1", "loc2", "loc3"];
    builder.from("orders").locationFilter(locationIds);

    const query = mockSupabase._getMockQuery();
    const locFilter = query._filters.find(
      (f: any) => f.type === "in" && f.col === "pickup_location_id",
    );

    if (!locFilter || locFilter.vals.length !== 3) {
      throw new Error("Location filter not applied correctly");
    }
  });

  // Test 1.6: Payment method filter
  await runTest("Payment method filter", "QueryBuilder", () => {
    mockSupabase._resetMock();
    const builder = new AnalyticsQueryBuilder(mockSupabase, vendorId);
    const methods = ["cash", "card"];
    builder.from("orders").paymentMethodFilter(methods);

    const query = mockSupabase._getMockQuery();
    const methodFilter = query._filters.find(
      (f: any) => f.type === "in" && f.col === "payment_method",
    );

    if (!methodFilter || methodFilter.vals.length !== 2) {
      throw new Error("Payment method filter not applied correctly");
    }
  });

  // Test 1.7: Custom where clause
  await runTest("Custom where clause", "QueryBuilder", () => {
    mockSupabase._resetMock();
    const builder = new AnalyticsQueryBuilder(mockSupabase, vendorId);
    builder.from("orders").where("total_amount", ">", 100);

    const query = mockSupabase._getMockQuery();
    const customFilter = query._filters.find((f: any) => f.type === "gt" && f.col === "total_amount");

    if (!customFilter) {
      throw new Error("Custom where clause not applied");
    }
  });

  // Test 1.8: Order by
  await runTest("Order by", "QueryBuilder", () => {
    mockSupabase._resetMock();
    const builder = new AnalyticsQueryBuilder(mockSupabase, vendorId);
    builder.from("orders").orderBy("order_date", false);

    const query = mockSupabase._getMockQuery();
    if (!query._order || query._order.col !== "order_date" || query._order.ascending !== false) {
      throw new Error("Order by not applied correctly");
    }
  });

  // Test 1.9: Limit
  await runTest("Limit", "QueryBuilder", () => {
    mockSupabase._resetMock();
    const builder = new AnalyticsQueryBuilder(mockSupabase, vendorId);
    builder.from("orders").limit(100);

    const query = mockSupabase._getMockQuery();
    if (query._limit !== 100) {
      throw new Error("Limit not applied correctly");
    }
  });

  // Test 1.10: Chain multiple filters
  await runTest("Chain multiple filters", "QueryBuilder", () => {
    mockSupabase._resetMock();
    const builder = new AnalyticsQueryBuilder(mockSupabase, vendorId);
    builder
      .from("orders")
      .dateRange("2025-01-01", "2025-01-31")
      .statusFilter(true)
      .locationFilter(["loc1"])
      .paymentMethodFilter(["cash"])
      .orderBy("order_date")
      .limit(50);

    const query = mockSupabase._getMockQuery();
    if (query._filters.length < 4) {
      throw new Error("Not all filters applied");
    }
    if (!query._order || query._limit !== 50) {
      throw new Error("Order or limit not applied");
    }
  });

  // Test 1.11: Edge case - empty location filter
  await runTest("Edge case: empty location filter", "QueryBuilder", () => {
    mockSupabase._resetMock();
    const builder = new AnalyticsQueryBuilder(mockSupabase, vendorId);
    builder.from("orders").locationFilter([]);

    const query = mockSupabase._getMockQuery();
    const locFilter = query._filters.find((f: any) => f.col === "pickup_location_id");

    if (locFilter) {
      throw new Error("Empty location filter should not be applied");
    }
  });

  // Test 1.12: Edge case - undefined filters
  await runTest("Edge case: undefined filters", "QueryBuilder", () => {
    mockSupabase._resetMock();
    const builder = new AnalyticsQueryBuilder(mockSupabase, vendorId);
    builder.from("orders").locationFilter(undefined).paymentMethodFilter(undefined);

    const query = mockSupabase._getMockQuery();
    if (query._filters.length > 1) {
      // Should only have vendor_id filter
      throw new Error("Undefined filters should not be applied");
    }
  });

  // Test 1.13: Error handling - from() not called
  await runTest("Error: from() not called", "QueryBuilder", async () => {
    const builder = new AnalyticsQueryBuilder(mockSupabase, vendorId);
    try {
      builder.dateRange("2025-01-01", "2025-01-31"); // Should throw
      throw new Error("Should have thrown error");
    } catch (err: any) {
      if (!err.message.includes("Must call from()")) {
        throw new Error("Wrong error message");
      }
    }
  });
}

/**
 * TEST SUITE 2: Analytics Response Builder
 */
async function testResponseBuilder() {
  console.log("\n📋 Test Suite 2: Analytics Response Builder");
  console.log("-".repeat(60));

  // Test 2.1: Basic response
  await runTest("Basic response", "ResponseBuilder", () => {
    const response = new AnalyticsResponseBuilder()
      .setData([{ id: 1 }, { id: 2 }])
      .build();

    if (!response.success) throw new Error("Success not true");
    if (response.data.length !== 2) throw new Error("Data not set correctly");
  });

  // Test 2.2: Response with metadata
  await runTest("Response with metadata", "ResponseBuilder", () => {
    const response = new AnalyticsResponseBuilder()
      .setData([])
      .setDateRange("2025-01-01", "2025-01-31")
      .setTotalRecords(0)
      .addMetadata("custom_field", "test")
      .build();

    if (!response.metadata.start_date) throw new Error("Date range not set");
    if (response.metadata.total_records !== 0) throw new Error("Total records not set");
    if (response.metadata.custom_field !== "test") throw new Error("Custom metadata not set");
  });

  // Test 2.3: Response with summary
  await runTest("Response with summary", "ResponseBuilder", () => {
    const response = new AnalyticsResponseBuilder()
      .setData([])
      .addSummary("total_sales", 1000)
      .addSummary("total_orders", 50)
      .build();

    if (!response.summary) throw new Error("Summary not added");
    if (response.summary.total_sales !== 1000) throw new Error("Summary fields not set");
  });

  // Test 2.4: Complete response
  await runTest("Complete response", "ResponseBuilder", () => {
    const response = new AnalyticsResponseBuilder()
      .setData([{ id: 1 }])
      .setDateRange("2025-01-01", "2025-01-31")
      .setTotalRecords(1)
      .addSummary("total", 100)
      .build();

    if (!response.success) throw new Error("Success not true");
    if (!response.data) throw new Error("Data not set");
    if (!response.metadata) throw new Error("Metadata not set");
    if (!response.summary) throw new Error("Summary not set");
  });

  // Test 2.5: Edge case - empty data
  await runTest("Edge case: empty data", "ResponseBuilder", () => {
    const response = new AnalyticsResponseBuilder().setData([]).build();

    if (response.data.length !== 0) throw new Error("Should allow empty data");
  });

  // Test 2.6: Edge case - no summary
  await runTest("Edge case: no summary", "ResponseBuilder", () => {
    const response = new AnalyticsResponseBuilder().setData([{ id: 1 }]).build();

    if (response.summary) throw new Error("Summary should not exist if not added");
  });
}

/**
 * TEST SUITE 3: Analytics Aggregator
 */
async function testAggregator() {
  console.log("\n📋 Test Suite 3: Analytics Aggregator");
  console.log("-".repeat(60));

  const testData = [
    { total_amount: 100, quantity: 5 },
    { total_amount: 200, quantity: 10 },
    { total_amount: 300, quantity: 15 },
  ];

  // Test 3.1: Sum
  await runTest("Sum aggregation", "Aggregator", () => {
    const sum = AnalyticsAggregator.sum(testData, "total_amount");
    if (sum !== 600) throw new Error(`Expected 600, got ${sum}`);
  });

  // Test 3.2: Average
  await runTest("Average aggregation", "Aggregator", () => {
    const avg = AnalyticsAggregator.avg(testData, "total_amount");
    if (avg !== 200) throw new Error(`Expected 200, got ${avg}`);
  });

  // Test 3.3: Count
  await runTest("Count aggregation", "Aggregator", () => {
    const count = AnalyticsAggregator.count(testData);
    if (count !== 3) throw new Error(`Expected 3, got ${count}`);
  });

  // Test 3.4: Count with predicate
  await runTest("Count with predicate", "Aggregator", () => {
    const count = AnalyticsAggregator.count(testData, (item) => item.total_amount > 150);
    if (count !== 2) throw new Error(`Expected 2, got ${count}`);
  });

  // Test 3.5: Group by
  await runTest("Group by", "Aggregator", () => {
    const data = [
      { category: "A", value: 1 },
      { category: "B", value: 2 },
      { category: "A", value: 3 },
    ];
    const groups = AnalyticsAggregator.groupBy(data, (item) => item.category);

    if (groups.size !== 2) throw new Error("Should have 2 groups");
    if (groups.get("A")?.length !== 2) throw new Error("Group A should have 2 items");
  });

  // Test 3.6: Summarize group
  await runTest("Summarize group", "Aggregator", () => {
    const summary = AnalyticsAggregator.summarizeGroup(testData, ["total_amount", "quantity"]);

    if (summary.total_total_amount !== 600) throw new Error("Total sum incorrect");
    if (summary.avg_total_amount !== 200) throw new Error("Average incorrect");
  });

  // Test 3.7: Edge case - empty array
  await runTest("Edge case: empty array sum", "Aggregator", () => {
    const sum = AnalyticsAggregator.sum([], "total_amount");
    if (sum !== 0) throw new Error("Sum of empty array should be 0");
  });

  // Test 3.8: Edge case - empty array average
  await runTest("Edge case: empty array avg", "Aggregator", () => {
    const avg = AnalyticsAggregator.avg([], "total_amount");
    if (avg !== 0) throw new Error("Avg of empty array should be 0");
  });

  // Test 3.9: Edge case - null/undefined values
  await runTest("Edge case: null values", "Aggregator", () => {
    const data = [{ total: 100 }, { total: null }, { total: 200 }];
    const sum = AnalyticsAggregator.sum(data, "total");
    if (sum !== 300) throw new Error("Should handle null values (treat as 0)");
  });

  // Test 3.10: Edge case - missing field
  await runTest("Edge case: missing field", "Aggregator", () => {
    const data = [{ amount: 100 }, { amount: 200 }];
    const sum = AnalyticsAggregator.sum(data, "total");
    if (sum !== 0) throw new Error("Should return 0 for missing field");
  });
}

/**
 * Generate test report
 */
function generateReport() {
  console.log("\n" + "=".repeat(60));
  console.log("DRY UTILITIES TEST REPORT");
  console.log("=".repeat(60));
  console.log();

  const categories = [...new Set(results.map((r) => r.category))];

  categories.forEach((category) => {
    const categoryResults = results.filter((r) => r.category === category);
    const passed = categoryResults.filter((r) => r.passed).length;
    const total = categoryResults.length;

    console.log(`${category}: ${passed}/${total} passed`);
    console.log("-".repeat(60));

    categoryResults.forEach((result) => {
      const status = result.passed ? "✅ PASS" : "❌ FAIL";
      const duration = result.duration.toFixed(2);
      console.log(`  ${status} ${result.name} (${duration}ms)`);
      if (result.error) {
        console.log(`       Error: ${result.error}`);
      }
    });
    console.log();
  });

  const totalPassed = results.filter((r) => r.passed).length;
  const totalTests = results.length;
  const passRate = (totalPassed / totalTests) * 100;

  console.log("=".repeat(60));
  console.log(`OVERALL: ${totalPassed}/${totalTests} tests passed (${passRate.toFixed(1)}%)`);
  console.log("=".repeat(60));

  if (passRate === 100) {
    console.log("\n✅ All tests passed! DRY utilities are production-ready.");
  } else {
    console.log("\n⚠️  Some tests failed. Review errors above.");
  }
}

/**
 * Main execution
 */
async function main() {
  console.log("=".repeat(60));
  console.log("COMPREHENSIVE DRY UTILITIES TESTING");
  console.log("=".repeat(60));
  console.log();
  console.log("Testing DRY utilities with edge cases...");

  try {
    await testQueryBuilder();
    await testResponseBuilder();
    await testAggregator();

    generateReport();

    const allPassed = results.every((r) => r.passed);
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error("\n❌ Test suite failed with error:");
    console.error(error);
    process.exit(1);
  }
}

main();
