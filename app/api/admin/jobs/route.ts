import { NextRequest, NextResponse } from "next/server";
import { jobQueue } from "@/lib/job-queue";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
/**
 * Job Queue Management API
 * GET - Get job statistics and history
 * POST - Retry a failed job
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "stats") {
      // Get queue statistics
      const stats = jobQueue.getStats();

      return NextResponse.json({
        success: true,
        stats,
      });
    }

    if (action === "completed") {
      // Get recent completed jobs
      const limit = parseInt(searchParams.get("limit") || "20");
      const jobs = jobQueue.getCompletedJobs(limit);

      return NextResponse.json({
        success: true,
        jobs,
      });
    }

    if (action === "failed") {
      // Get recent failed jobs
      const limit = parseInt(searchParams.get("limit") || "20");
      const jobs = jobQueue.getFailedJobs(limit);

      return NextResponse.json({
        success: true,
        jobs,
      });
    }

    if (action === "job") {
      // Get specific job by ID
      const jobId = searchParams.get("id");
      if (!jobId) {
        return NextResponse.json({ error: "Job ID required" }, { status: 400 });
      }

      const job = jobQueue.getJob(jobId);
      if (!job) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        job,
      });
    }

    // Default: return stats
    const stats = jobQueue.getStats();
    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Job API error:", err);
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, jobId } = body;

    if (action === "retry") {
      // Retry a failed job
      if (!jobId) {
        return NextResponse.json({ error: "Job ID required" }, { status: 400 });
      }

      const success = jobQueue.retryJob(jobId);

      if (!success) {
        return NextResponse.json({ error: "Job not found or cannot be retried" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: "Job queued for retry",
      });
    }

    if (action === "clear-history") {
      // Clear job history
      jobQueue.clearHistory();

      return NextResponse.json({
        success: true,
        message: "Job history cleared",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Job API error:", err);
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
