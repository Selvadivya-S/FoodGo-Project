import IORedis from "ioredis";
import { env } from "./env.js";
import logger from "../utils/logger.js";
let redis = null;
export function getRedis() {
  if (!env.redisUrl) return null;
  if (!redis) {
    redis = new IORedis(env.redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      lazyConnect: true
    });
    redis.on("error", (err) => logger.warn(`Redis: ${err.message}`));
  }
  return redis;
}
export async function cacheGet(key) {
  const client = getRedis();
  if (!client) return null;
  try {
    if (client.status === "wait") await client.connect();
    return await client.get(key);
  } catch { return null; }
}
export async function cacheSet(key, value, ttlSeconds = 60) {
  const client = getRedis();
  if (!client) return;
  try {
    if (client.status === "wait") await client.connect();
    await client.set(key, value, "EX", ttlSeconds);
  } catch {}
}
