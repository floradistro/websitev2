/**
 * Background Job Queue System
 * Handles async processing with retry logic
 * Amazon/Apple-style job processing
 */

interface Job {
  id: string;
  type: string;
  data: any;
  attempts: number;
  maxAttempts: number;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: Date;
  processedAt?: Date;
  error?: string;
  priority: number; // 1 = highest, 5 = lowest
}

interface JobStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

/**
 * Job Queue Manager
 * Processes jobs asynchronously with retry logic
 */
class JobQueue {
  private queue: Job[] = [];
  private processing: boolean = false;
  private completedJobs: Job[] = [];
  private failedJobs: Job[] = [];
  private maxCompletedHistory: number = 100;
  private maxFailedHistory: number = 50;

  /**
   * Enqueue a new job
   */
  async enqueue(
    type: string,
    data: any,
    options: { maxAttempts?: number; priority?: number } = {},
  ): Promise<string> {
    const job: Job = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      attempts: 0,
      maxAttempts: options.maxAttempts || 3,
      status: "pending",
      createdAt: new Date(),
      priority: options.priority || 3,
    };

    this.queue.push(job);

    // Sort by priority (lower number = higher priority)
    this.queue.sort((a, b) => a.priority - b.priority);

    // Start processing if not already running
    if (!this.processing) {
      this.processQueue();
    }

    return job.id;
  }

  /**
   * Process the job queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing) return;

    this.processing = true;

    while (this.queue.length > 0) {
      // Find next pending job
      const job = this.queue.find((j) => j.status === "pending");
      if (!job) break;

      job.status = "processing";
      job.attempts++;

      try {
        await this.executeJob(job);

        job.status = "completed";
        job.processedAt = new Date();

        // Move to completed history
        this.completedJobs.unshift(job);
        if (this.completedJobs.length > this.maxCompletedHistory) {
          this.completedJobs.pop();
        }

        // Remove from queue
        this.queue = this.queue.filter((j) => j.id !== job.id);
      } catch (error: any) {
        if (process.env.NODE_ENV === "development") {
          console.error(`❌ Job failed: ${job.type}`, error);
        }
        job.error = error.message;

        if (job.attempts >= job.maxAttempts) {
          // Max attempts reached, mark as failed
          job.status = "failed";
          console.error(
            `🔴 Job permanently failed: ${job.type} (ID: ${job.id})`,
          );

          // Move to failed history
          this.failedJobs.unshift(job);
          if (this.failedJobs.length > this.maxFailedHistory) {
            this.failedJobs.pop();
          }

          // Remove from queue
          this.queue = this.queue.filter((j) => j.id !== job.id);
        } else {
          // Retry with exponential backoff
          job.status = "pending";
          const backoffMs = Math.pow(2, job.attempts) * 1000;

          await new Promise((resolve) => setTimeout(resolve, backoffMs));
        }
      }
    }

    this.processing = false;
  }

  /**
   * Execute a job based on its type
   */
  private async executeJob(job: Job): Promise<void> {
    switch (job.type) {
      case "send-email":
        await this.sendEmail(job.data);
        break;

      case "process-image":
        await this.processImage(job.data);
        break;

      case "generate-report":
        await this.generateReport(job.data);
        break;

      case "sync-inventory":
        await this.syncInventory(job.data);
        break;

      case "cleanup-cache":
        await this.cleanupCache(job.data);
        break;

      case "send-notification":
        await this.sendNotification(job.data);
        break;

      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }
  }

  /**
   * Job: Send Email
   */
  private async sendEmail(data: any): Promise<void> {
    // Simulate email sending (in production, use SendGrid/AWS SES/etc)
    await new Promise((resolve) => setTimeout(resolve, 500));

    // In production, call actual email service:
    // await emailService.send({ to: data.to, subject: data.subject, html: data.html });
  }

  /**
   * Job: Process Image
   */
  private async processImage(data: any): Promise<void> {
    // Simulate image processing
    await new Promise((resolve) => setTimeout(resolve, 300));

    // In production:
    // - Resize images
    // - Generate thumbnails
    // - Optimize for web
    // - Upload to CDN
  }

  /**
   * Job: Generate Report
   */
  private async generateReport(data: any): Promise<void> {
    // Simulate report generation
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // In production:
    // - Query database
    // - Generate PDF
    // - Upload to storage
    // - Send notification
  }

  /**
   * Job: Sync Inventory
   */
  private async syncInventory(data: any): Promise<void> {
    // Simulate inventory sync
    await new Promise((resolve) => setTimeout(resolve, 400));

    // In production:
    // - Sync with external system
    // - Update database
    // - Invalidate caches
  }

  /**
   * Job: Cleanup Cache
   */
  private async cleanupCache(data: any): Promise<void> {
    // Import cache managers
    const { productCache, vendorCache, inventoryCache } = await import(
      "./cache-manager"
    );

    if (!data.cacheType || data.cacheType === "all") {
      productCache.clear();
      vendorCache.clear();
      inventoryCache.clear();
    } else if (data.cacheType === "products") {
      productCache.clear();
    } else if (data.cacheType === "vendors") {
      vendorCache.clear();
    } else if (data.cacheType === "inventory") {
      inventoryCache.clear();
    }
  }

  /**
   * Job: Send Notification
   */
  private async sendNotification(data: any): Promise<void> {
    // Simulate notification
    await new Promise((resolve) => setTimeout(resolve, 200));

    // In production:
    // - Push notification
    // - In-app notification
    // - SMS (if enabled)
  }

  /**
   * Get queue statistics
   */
  getStats(): JobStats {
    return {
      total:
        this.queue.length + this.completedJobs.length + this.failedJobs.length,
      pending: this.queue.filter((j) => j.status === "pending").length,
      processing: this.queue.filter((j) => j.status === "processing").length,
      completed: this.completedJobs.length,
      failed: this.failedJobs.length,
    };
  }

  /**
   * Get job by ID
   */
  getJob(jobId: string): Job | null {
    return (
      this.queue.find((j) => j.id === jobId) ||
      this.completedJobs.find((j) => j.id === jobId) ||
      this.failedJobs.find((j) => j.id === jobId) ||
      null
    );
  }

  /**
   * Get recent completed jobs
   */
  getCompletedJobs(limit: number = 10): Job[] {
    return this.completedJobs.slice(0, limit);
  }

  /**
   * Get recent failed jobs
   */
  getFailedJobs(limit: number = 10): Job[] {
    return this.failedJobs.slice(0, limit);
  }

  /**
   * Retry a failed job
   */
  retryJob(jobId: string): boolean {
    const jobIndex = this.failedJobs.findIndex((j) => j.id === jobId);
    if (jobIndex === -1) return false;

    const job = this.failedJobs[jobIndex];
    job.status = "pending";
    job.attempts = 0;
    job.error = undefined;

    this.queue.push(job);
    this.failedJobs.splice(jobIndex, 1);

    if (!this.processing) {
      this.processQueue();
    }

    return true;
  }

  /**
   * Clear completed jobs history
   */
  clearHistory(): void {
    this.completedJobs = [];
    this.failedJobs = [];
  }
}

// Export singleton instance
export const jobQueue = new JobQueue();
