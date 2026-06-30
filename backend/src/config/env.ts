import dotenv from "dotenv";

dotenv.config();

function required(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parseInt(process.env.PORT ?? "4000", 10),
  databaseUrl: required("DATABASE_URL", "postgresql://library:library@localhost:5432/library?schema=public"),
  redisUrl: required("REDIS_URL", "redis://localhost:6379"),
  jwtSecret: required("JWT_SECRET", "dev-insecure-secret-change-me"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  // Default loan period in days
  loanPeriodDays: parseInt(process.env.LOAN_PERIOD_DAYS ?? "14", 10),
  // Max books a user can hold at once
  maxConcurrentBorrows: parseInt(process.env.MAX_CONCURRENT_BORROWS ?? "5", 10),
};

export const isProd = env.nodeEnv === "production";
