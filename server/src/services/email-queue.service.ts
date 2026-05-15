/**
 * Email Queue Service
 *
 * Provides a simple in-memory FIFO queue that drains at a configurable rate
 * (default 200 ms between sends ≈ 5 emails/s ≈ 18,000/hour) to stay well
 * within Brevo's rate limits.
 *
 * Features:
 *  - Sequential processing with a configurable inter-send delay
 *  - Exponential back-off + retry on 429 / transient errors (up to MAX_RETRIES)
 *  - Fire-and-forget: callers do not await delivery
 *  - getQueueStatus() for monitoring
 *  - flushQueue() for graceful shutdown / testing
 */

export interface QueuedEmail {
    id:        string;
    to:        string;
    subject:   string;
    html:      string;
    attempts:  number;
    addedAt:   Date;
    nextTryAt: Date;
}

interface QueueStatus {
    pending:    number;
    processing: boolean;
    totalSent:  number;
    totalFailed: number;
}

// ─── Configuration ────────────────────────────────────────────────────────────

const DELAY_MS   = Math.max(50, Number(process.env.EMAIL_QUEUE_DELAY_MS)   || 200);
const MAX_RETRIES = Math.max(1, Number(process.env.EMAIL_QUEUE_MAX_RETRIES) || 3);

// ─── State ────────────────────────────────────────────────────────────────────

const queue: QueuedEmail[] = [];
let processing  = false;
let totalSent   = 0;
let totalFailed = 0;
let idCounter   = 0;

// ─── Core sender (imported lazily to avoid circular deps) ─────────────────────

// We accept a sender function so the queue service stays decoupled from the
// concrete Brevo implementation.  email.service.ts injects it on first use.
let _sendFn: ((to: string, subject: string, html: string) => Promise<void>) | null = null;

export function registerSendFn(
    fn: (to: string, subject: string, html: string) => Promise<void>
): void {
    _sendFn = fn;
}

// ─── Queue management ─────────────────────────────────────────────────────────

/** Add an email to the back of the queue and start the processor if idle. */
export function enqueue(to: string, subject: string, html: string): void {
    const item: QueuedEmail = {
        id:        `eq-${++idCounter}`,
        to,
        subject,
        html,
        attempts:  0,
        addedAt:   new Date(),
        nextTryAt: new Date(),
    };
    queue.push(item);
    console.log(`[email-queue] Enqueued "${subject}" → ${to} (queue depth: ${queue.length})`);
    if (!processing) {
        void processQueue();
    }
}

/** Return a snapshot of the current queue state. */
export function getQueueStatus(): QueueStatus {
    return {
        pending:     queue.length,
        processing,
        totalSent,
        totalFailed,
    };
}

/**
 * Drain the queue immediately (does NOT send pending emails — just discards
 * them).  Useful for tests or graceful shutdown where you want a clean slate.
 */
export function flushQueue(): void {
    const dropped = queue.length;
    queue.length = 0;
    processing   = false;
    if (dropped > 0) {
        console.warn(`[email-queue] Flushed ${dropped} pending email(s) from queue.`);
    }
}

// ─── Processor ────────────────────────────────────────────────────────────────

async function processQueue(): Promise<void> {
    if (processing) return;
    processing = true;

    while (queue.length > 0) {
        const item = queue[0];

        // Honour back-off delay for retried items
        const now  = Date.now();
        const wait = item.nextTryAt.getTime() - now;
        if (wait > 0) {
            await sleep(wait);
        }

        const success = await trySend(item);

        if (success) {
            queue.shift();   // remove from front
            totalSent++;
            // Pace subsequent sends to avoid bursting
            if (queue.length > 0) {
                await sleep(DELAY_MS);
            }
        } else {
            item.attempts++;
            if (item.attempts >= MAX_RETRIES) {
                console.error(
                    `[email-queue] Permanently failed after ${item.attempts} attempt(s): ` +
                    `"${item.subject}" → ${item.to} (id: ${item.id})`
                );
                queue.shift();
                totalFailed++;
                // Still pace before the next item
                if (queue.length > 0) {
                    await sleep(DELAY_MS);
                }
            } else {
                // Exponential back-off: 2^attempts × DELAY_MS, capped at 60 s
                const backoff = Math.min(
                    Math.pow(2, item.attempts) * DELAY_MS,
                    60_000
                );
                item.nextTryAt = new Date(Date.now() + backoff);
                console.warn(
                    `[email-queue] Retry ${item.attempts}/${MAX_RETRIES} in ${backoff}ms: ` +
                    `"${item.subject}" → ${item.to} (id: ${item.id})`
                );
                // Move to back of queue so other emails aren't blocked by one bad address
                queue.push(queue.shift()!);
                await sleep(DELAY_MS);
            }
        }
    }

    processing = false;
    console.log(
        `[email-queue] Queue drained. ` +
        `Total sent: ${totalSent}, total failed: ${totalFailed}`
    );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function trySend(item: QueuedEmail): Promise<boolean> {
    if (!_sendFn) {
        console.error("[email-queue] No send function registered — dropping email.");
        return false;
    }
    try {
        await _sendFn(item.to, item.subject, item.html);
        return true;
    } catch (err: any) {
        // Treat 429 and network errors as retryable
        const msg: string = err?.message ?? String(err);
        const isRateLimit = msg.includes("429") || msg.toLowerCase().includes("too many");
        console.warn(
            `[email-queue] Send error (${isRateLimit ? "rate-limit" : "transient"}): ${msg}`
        );
        return false;
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
