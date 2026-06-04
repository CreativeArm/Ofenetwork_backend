import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly redisUrl = process.env.REDIS_URL?.trim();
  private client: Redis | null = null;
  private connectionAttempted = false;
  private disabled = false;

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
          `Redis unavailable, falling back to non-shared memory behavior: ${
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
    const client = await this.getClient();
    if (!client) {
      return null;
    }

    const value = await client.get(key);
    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  async setJson(key: string, value: unknown, ttlSeconds?: number) {
    const client = await this.getClient();
    if (!client) {
      return;
    }

    const serialized = JSON.stringify(value);
    if (ttlSeconds && ttlSeconds > 0) {
      await client.set(key, serialized, "EX", ttlSeconds);
      return;
    }

    await client.set(key, serialized);
  }

  async delete(key: string) {
    const client = await this.getClient();
    if (!client) {
      return;
    }

    await client.del(key);
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }
}
