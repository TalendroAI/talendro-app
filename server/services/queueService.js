/**
 * queueService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Production-grade job queue for the Auto-Apply Engine.
 *
 * IMPLEMENTATION:
 *   - Primary: BullMQ (Redis-backed) when REDIS_URL is set
 *   - Fallback: In-memory queue (EventEmitter) for local dev / missing Redis
 *
 * The interface is identical in both modes — callers use enqueue() and
 * the worker listens via the 'job' event (in-memory) or BullMQ worker (Redis).
 *
 * RENDER.COM SETUP:
 *   1. Create a Redis instance in Render.com (free tier available)
 *   2. Copy the Internal URL to the REDIS_URL environment variable
 *   3. Restart the service — BullMQ activates automatically
 * ─────────────────────────────────────────────────────────────────────────────
 */
import EventEmitter from 'events';

// ─── BullMQ Redis Queue ───────────────────────────────────────────────────────
let bullQueue = null;
let bullWorker = null;
let useBullMQ = false;

if (process.env.REDIS_URL) {
  try {
    const { Queue, Worker } = await import('bullmq');
    const IORedis = (await import('ioredis')).default;

    const connection = new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      tls: process.env.REDIS_URL.startsWith('rediss://') ? {} : undefined,
    });

    bullQueue = new Queue('auto-apply', {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 500 },
        removeOnFail: { count: 200 },
      },
    });

    useBullMQ = true;
    console.log('[queueService] BullMQ initialized — Redis-backed queue active');
  } catch (err) {
    console.warn('[queueService] BullMQ initialization failed, falling back to in-memory queue:', err.message);
    useBullMQ = false;
  }
} else {
  console.log('[queueService] REDIS_URL not set — using in-memory queue (suitable for single-server deployment)');
}

// ─── In-Memory Fallback Queue ─────────────────────────────────────────────────
class InMemoryQueue extends EventEmitter {
  constructor() {
    super();
    this._queue = [];
    this._concurrency = parseInt(process.env.APPLY_WORKER_CONCURRENCY || '2', 10);
    this._activeCount = 0;
  }

  enqueue(job) {
    if (!job.userId || !job.jobId || !job.applyUrl) {
      console.error('[queueService] Invalid job — missing required fields:', job);
      return;
    }
    const payload = {
      ...job,
      id: `${job.userId}_${job.jobId}_${Date.now()}`,
      enqueuedAt: new Date().toISOString(),
      attempts: 0,
      maxAttempts: 3,
    };
    this._queue.push(payload);
    console.log(`[queueService] Enqueued job ${payload.id}. Queue depth: ${this._queue.length}`);
    this._drain();
  }

  _drain() {
    while (this._activeCount < this._concurrency && this._queue.length > 0) {
      const job = this._queue.shift();
      this._activeCount++;
      this.emit('job', job, () => {
        this._activeCount--;
        this._drain();
      });
    }
  }

  retry(job) {
    if (job.attempts < job.maxAttempts) {
      job.attempts++;
      console.warn(`[queueService] Retrying job ${job.id} (attempt ${job.attempts}/${job.maxAttempts})`);
      this._queue.unshift(job);
      this._drain();
    } else {
      console.error(`[queueService] Job ${job.id} exceeded max attempts. Dropping.`);
      this.emit('job:failed', job);
    }
  }

  get depth() { return this._queue.length; }
  get active() { return this._activeCount; }
}

const inMemoryQueue = new InMemoryQueue();

// ─── Unified Interface ────────────────────────────────────────────────────────
/**
 * Enqueue an auto-apply job.
 * Works identically whether BullMQ or in-memory queue is active.
 *
 * @param {Object} job
 * @param {string} job.userId     - MongoDB User _id
 * @param {string} job.jobId      - MongoDB Job _id
 * @param {string} job.atsType    - 'greenhouse' | 'lever' | 'workday' | 'generic'
 * @param {string} job.applyUrl   - Direct URL to the application form
 * @param {Object} job.matchScore - Score object from the matching engine
 */
async function enqueue(job) {
  if (useBullMQ && bullQueue) {
    const jobId = `${job.userId}_${job.jobId}_${Date.now()}`;
    await bullQueue.add('apply', { ...job, id: jobId, enqueuedAt: new Date().toISOString() }, {
      jobId,
    });
    console.log(`[queueService] BullMQ: Enqueued job ${jobId}`);
  } else {
    inMemoryQueue.enqueue(job);
  }
}

/**
 * Register a worker function to process jobs.
 * In BullMQ mode, registers a BullMQ Worker.
 * In in-memory mode, listens to the 'job' event.
 *
 * @param {Function} processor - async (jobData) => void
 */
function registerWorker(processor) {
  if (useBullMQ) {
    const { Worker } = require('bullmq');
    const IORedis = require('ioredis');
    const connection = new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      tls: process.env.REDIS_URL.startsWith('rediss://') ? {} : undefined,
    });
    const concurrency = parseInt(process.env.APPLY_WORKER_CONCURRENCY || '2', 10);
    bullWorker = new Worker('auto-apply', async (job) => {
      await processor(job.data);
    }, { connection, concurrency });

    bullWorker.on('completed', (job) => {
      console.log(`[queueService] BullMQ: Job ${job.id} completed`);
    });
    bullWorker.on('failed', (job, err) => {
      console.error(`[queueService] BullMQ: Job ${job?.id} failed:`, err.message);
    });
    console.log(`[queueService] BullMQ worker registered (concurrency: ${concurrency})`);
  } else {
    inMemoryQueue.on('job', async (jobData, done) => {
      try {
        await processor(jobData);
      } catch (err) {
        console.error(`[queueService] In-memory worker error for job ${jobData.id}:`, err.message);
        inMemoryQueue.retry(jobData);
      } finally {
        done();
      }
    });
    console.log('[queueService] In-memory worker registered');
  }
}

/**
 * Get queue health stats for the admin dashboard.
 */
async function getStats() {
  if (useBullMQ && bullQueue) {
    const [waiting, active, completed, failed] = await Promise.all([
      bullQueue.getWaitingCount(),
      bullQueue.getActiveCount(),
      bullQueue.getCompletedCount(),
      bullQueue.getFailedCount(),
    ]);
    return { mode: 'bullmq', waiting, active, completed, failed };
  }
  return {
    mode: 'in-memory',
    waiting: inMemoryQueue.depth,
    active: inMemoryQueue.active,
    completed: 0,
    failed: 0,
  };
}

export default {
  enqueue,
  registerWorker,
  getStats,
  // Legacy compatibility — in-memory queue event emitter
  on: (event, handler) => inMemoryQueue.on(event, handler),
  emit: (event, ...args) => inMemoryQueue.emit(event, ...args),
};
