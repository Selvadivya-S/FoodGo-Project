import { Queue } from "bullmq";
import IORedis from "ioredis";
import { env } from "../config/env.js";
let queues = null;
export function getQueues() {
  if (!env.redisUrl) return null;
  if (!queues) {
    const connection = new IORedis(env.redisUrl, { maxRetriesPerRequest: null });
    queues = {
      notifications: new Queue("foodgo-notifications", { connection }),
      emails: new Queue("foodgo-emails", { connection }),
      maintenance: new Queue("foodgo-maintenance", { connection })
    };
  }
  return queues;
}
