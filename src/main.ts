import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { NestExpressApplication } from "@nestjs/platform-express";
import rateLimit from "express-rate-limit";
import { type RedisReply, RedisStore } from "rate-limit-redis";
import { AppModule } from "./app.module";
import { RedisService } from "./infrastructure/redis/redis.service";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  const redisService = app.get(RedisService);
  const redisClient = await redisService.getClient();

  const buildRateLimiter = (config: {
    windowMs: number;
    max: number;
    message: { message: string };
    prefix: string;
  }) =>
    rateLimit({
      windowMs: config.windowMs,
      max: config.max,
      standardHeaders: true,
      legacyHeaders: false,
      message: config.message,
      store: redisClient
        ? new RedisStore({
            prefix: config.prefix,
            sendCommand: (...args: string[]) =>
              redisClient.call(args[0], ...args.slice(1)) as Promise<RedisReply>,
          })
        : undefined,
    });

  app.setGlobalPrefix("api");
  app.useBodyParser("json", { limit: "15mb" });
  app.useBodyParser("urlencoded", { limit: "15mb", extended: true });
  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  app.use(
    "/api/auth/login",
    buildRateLimiter({
      windowMs: 15 * 60 * 1000,
      max: 10,
      message: {
        message: "Too many login attempts. Please try again shortly.",
      },
      prefix: "rl:auth:login:",
    }),
  );
  app.use(
    "/api/auth/register",
    buildRateLimiter({
      windowMs: 15 * 60 * 1000,
      max: 8,
      message: {
        message: "Too many registration attempts. Please try again shortly.",
      },
      prefix: "rl:auth:register:",
    }),
  );
  app.use(
    "/api/auth/forgot-password",
    buildRateLimiter({
      windowMs: 15 * 60 * 1000,
      max: 6,
      message: {
        message: "Too many password reset requests. Please try again shortly.",
      },
      prefix: "rl:auth:forgot-password:",
    }),
  );
  app.use(
    "/api/auth/reset-password",
    buildRateLimiter({
      windowMs: 15 * 60 * 1000,
      max: 10,
      message: {
        message: "Too many password reset attempts. Please try again shortly.",
      },
      prefix: "rl:auth:reset-password:",
    }),
  );
  app.use(
    "/api/auth/refresh",
    buildRateLimiter({
      windowMs: 15 * 60 * 1000,
      max: 25,
      message: {
        message: "Too many session refresh attempts. Please try again shortly.",
      },
      prefix: "rl:auth:refresh:",
    }),
  );
  app.use(
    "/api/support/tickets",
    buildRateLimiter({
      windowMs: 15 * 60 * 1000,
      max: 80,
      message: {
        message: "Too many support requests. Please try again shortly.",
      },
      prefix: "rl:support:tickets:",
    }),
  );
  app.use(
    "/api/admin",
    buildRateLimiter({
      windowMs: 60 * 1000,
      max: 120,
      message: {
        message: "Too many admin requests. Please slow down.",
      },
      prefix: "rl:admin:",
    }),
  );
  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, "0.0.0.0");
}

bootstrap();
