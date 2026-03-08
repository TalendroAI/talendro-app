/**
 * queueService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * In-process job queue for the Auto-Apply Engine.
 *
 * CURRENT IMPLEMENTATION: In-memory queue using a simple array and EventEmitter.
 * This is suitable for a single-server deployment on Render.
 *
 * FUTURE UPGRADE PATH: Replace with RabbitMQ or BullMQ (Redis-backed) when
 * horizontal scaling is required. The interface is designed to be drop-in
 * compatible — callers use enqueue() and the worker uses the 'job' event.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TODO (Task 1.1):
 *   - For production scale, replace this with BullMQ:
 *       npm install bullmq ioredis
 *     and update render.yaml to provision a Redis instance.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import EventEmitter from 'events';

class ApplicationQueue extends EventEmitter {
  constructor() {
    super();
    this._queue = [];
    this._processing = false;
    this._concurrency = parseInt(process.env.APPLY_WORKER_CONCURRENCY || '2', 10);
    this._activeCount = 0;
  }

  /**
   * Add a job to the queue.
   * @param {Object} job
   * @param {string} job.userId        - MongoDB User _id
   * @param {string} job.jobId         - MongoDB Job _id
   * @param {string} job.atsType       - 'greenhouse' | 'lever' | 'workday' | 'generic'
   * @param {string} job.applyUrl      - Direct URL to the application form
   * @param {Object} job.matchScore    - The score object from the matching engine
   */
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

  /**
   * Internal: drain the queue up to the concurrency limit.
   */
  _drain() {
    while (this._activeCount < this._concurrency && this._queue.length > 0) {
      const job = this._queue.shift();
      this._activeCount++;
      this.emit('job', job, () => {
        // Completion callback — called by the worker when done
        this._activeCount--;
        this._drain();
      });
    }
  }

  /**
   * Re-queue a failed job if it has not exceeded maxAttempts.
   */
  retry(job) {
    if (job.attempts < job.maxAttempts) {
      job.attempts++;
      console.warn(`[queueService] Retrying job ${job.id} (attempt ${job.attempts}/${job.maxAttempts})`);
      this._queue.unshift(job); // push to front for immediate retry
      this._drain();
    } else {
      console.error(`[queueService] Job ${job.id} exceeded max attempts. Dropping.`);
      this.emit('job:failed', job);
    }
  }

  get depth() {
    return this._queue.length;
  }

  get active() {
    return this._activeCount;
  }
}

// Export a singleton instance
const applicationQueue = new ApplicationQueue();
export default applicationQueue;
