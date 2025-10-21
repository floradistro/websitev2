/**
 * Batch Data Loader
 * Batches multiple requests into a single query
 */

interface BatchConfig {
  maxBatchSize: number;
  batchWindowMs: number;
}

interface QueuedRequest<T> {
  id: string | number;
  resolve: (value: T) => void;
  reject: (error: any) => void;
}

export class BatchLoader<K extends string | number, V> {
  private queue: QueuedRequest<V>[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private config: BatchConfig;
  private fetcher: (ids: K[]) => Promise<Map<K, V>>;

  constructor(
    fetcher: (ids: K[]) => Promise<Map<K, V>>,
    config: Partial<BatchConfig> = {}
  ) {
    this.fetcher = fetcher;
    this.config = {
      maxBatchSize: config.maxBatchSize || 50,
      batchWindowMs: config.batchWindowMs || 10,
    };
  }

  load(id: K): Promise<V> {
    return new Promise((resolve, reject) => {
      this.queue.push({ id, resolve, reject } as QueuedRequest<V>);

      // Schedule batch if not already scheduled
      if (!this.batchTimeout) {
        this.batchTimeout = setTimeout(() => {
          this.processBatch();
        }, this.config.batchWindowMs);
      }

      // Process immediately if batch is full
      if (this.queue.length >= this.config.maxBatchSize) {
        if (this.batchTimeout) {
          clearTimeout(this.batchTimeout);
          this.batchTimeout = null;
        }
        this.processBatch();
      }
    });
  }

  loadMany(ids: K[]): Promise<V[]> {
    return Promise.all(ids.map(id => this.load(id)));
  }

  private async processBatch() {
    const batch = this.queue.splice(0, this.config.maxBatchSize);
    this.batchTimeout = null;

    if (batch.length === 0) return;

    try {
      const ids = batch.map(req => req.id as K);
      const results = await this.fetcher(ids);

      batch.forEach(req => {
        const value = results.get(req.id as K);
        if (value !== undefined) {
          req.resolve(value);
        } else {
          req.reject(new Error(`No result for id: ${req.id}`));
        }
      });
    } catch (error) {
      batch.forEach(req => req.reject(error));
    }

    // Process next batch if queue has items
    if (this.queue.length > 0) {
      this.batchTimeout = setTimeout(() => {
        this.processBatch();
      }, this.config.batchWindowMs);
    }
  }
}

/**
 * Create a batch loader for products
 */
export function createProductBatchLoader() {
  return new BatchLoader<string, any>(async (ids) => {
    const response = await fetch('/api/bulk/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    
    const { products } = await response.json();
    const map = new Map();
    products.forEach((p: any) => map.set(p.id, p));
    return map;
  });
}

/**
 * Create a batch loader for inventory
 */
export function createInventoryBatchLoader() {
  return new BatchLoader<number, any[]>(async (ids) => {
    const response = await fetch('/api/bulk/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_ids: ids }),
    });
    
    const { inventory } = await response.json();
    const map = new Map();
    Object.entries(inventory).forEach(([productId, inv]) => {
      map.set(parseInt(productId), inv);
    });
    return map;
  });
}

