import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly redisUrl = process.env.REDIS_URL?.trim();
  private client: Redis | null = null;
  private connectionAttempted = false;
  private disabled = false;
  private readonly memoryCache = new Map<string, CacheEntry>();

  private getClientInstance() {
    if (!this.redisUrl || this.disabled) {
      return null;
    }

    if (!this.client) {
      this.client = new Redis(this.redisUrl, {
        connectTimeout: 1000,
        enableOfflineQueue: false,
        maxRetriesPerRequest: 2,
        lazyConnect: true,
        retryStrategy: () => null,
      });
      this.client.on("error", (error) => {
        this.logger.warn(`Redis error: ${error.message}`);
      });
    }

    return this.client;
  }

  async getClient() {
    const client = this.getClientInstance();
    if (!client) {
      return null;
    }

    const status = (client as Redis & { status?: string }).status;
    if (status === "ready") {
      return client;
    }

    if (!this.connectionAttempted) {
      this.connectionAttempted = true;
      try {
        await client.connect();
        this.logger.log("Redis connected");
      } catch (error) {
        this.logger.warn(
          `Redis unavailable, falling back to in-memory caching: ${
            error instanceof Error ? error.message : "unknown error"
          }`,
        );
        this.disabled = true;
        client.disconnect(false);
        this.client = null;
        return null;
      }
    }

    return (client as Redis & { status?: string }).status === "ready" ? client : null;
  }

  async getJson<T>(key: string): Promise<T | null> {
    // 1. Check in-memory L1 cache (instant 0ms response)
    const mem = this.memoryCache.get(key);
    const now = Date.now();
    if (mem) {
      if (mem.expiresAt > now) {
        return mem.value as T;
      }
      this.memoryCache.delete(key);
    }

    // 2. Check Redis L2 cache
    const client = await this.getClient();
    if (!client) {
      return null;
    }

    try {
      const value = await client.get(key);
      if (!value) {
        return null;
      }
      const parsed = JSON.parse(value) as T;
      this.memoryCache.set(key, { value: parsed, expiresAt: now + 30_000 });
      return parsed;
    } catch {
      return null;
    }
  }

  async setJson(key: string, value: unknown, ttlSeconds = 60) {
    const now = Date.now();
    const expiresAt = now + Math.max(5, ttlSeconds) * 1000;
    this.memoryCache.set(key, { value, expiresAt });

    const client = await this.getClient();
    if (!client) {
      return;
    }

    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds && ttlSeconds > 0) {
        await client.set(key, serialized, "EX", ttlSeconds);
        return;
      }
      await client.set(key, serialized);
    } catch {
      // Redis error ignored gracefully
    }
  }

  async delete(key: string) {
    this.memoryCache.delete(key);
    const client = await this.getClient();
    if (!client) {
      return;
    }
    try {
      await client.del(key);
    } catch {
      // Redis error ignored gracefully
    }
  }

  async deletePrefix(prefix: string) {
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        this.memoryCache.delete(key);
      }
    }
    const client = await this.getClient();
    if (!client) {
      return;
    }
    try {
      const keys = await client.keys(`${prefix}*`);
      if (keys.length > 0) {
        await client.del(...keys);
      }
    } catch {
      // Redis error ignored gracefully
    }
  }

  async onModuleDestroy() {
    this.memoryCache.clear();
    if (this.client) {
      await this.client.quit();
    }
  }
}
