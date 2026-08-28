import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { NestExpressApplication } from "@nestjs/platform-express";
import rateLimit from "express-rate-limit";
import { type RedisReply, RedisStore } from "rate-limit-redis";
import { AppModule } from "./app.module";
import { EmailService } from "./infrastructure/email/email.service";
import { RedisService } from "./infrastructure/redis/redis.service";

function getAllowedOrigins() {
  // CORS_ORIGIN may contain several comma-separated sites (for example the
  // production site and a www alias). Keep FRONTEND_URL in the list as it is
  // also used by the OAuth redirect flow.
  const configuredOrigins = [
    process.env.CORS_ORIGIN,
    process.env.FRONTEND_URL,
  ].filter(Boolean).join(",");
  const origins = [...new Set(configuredOrigins
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean))];

  if (origins.length === 0) {
    return ["*"];
  }

  return origins;
}

async function bootstrap() {
  const allowedOrigins = getAllowedOrigins();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  const redisService = app.get(RedisService);
  const emailService = app.get(EmailService);

  if (!emailService.isConfigured()) {
    console.warn("WARNING: SMTP_HOST is not configured. Email notifications will be skipped.");
  }

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
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin.replace(/\/$/, ""))) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin is not allowed by CORS."));
    },
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
