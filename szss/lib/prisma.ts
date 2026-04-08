import "server-only";

import dotenv from "dotenv";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

declare global {
  var __schoolHubPrisma__: PrismaClient | undefined;
}

if (!process.env.VERCEL) {
  dotenv.config({ path: path.resolve(process.cwd(), ".env"), quiet: true });
  dotenv.config({ path: path.resolve(process.cwd(), "../.env"), quiet: true });
}

function normalizeConnectionString(rawConnectionString: string) {
  const connectionUrl = new URL(rawConnectionString);
  const sslMode = connectionUrl.searchParams.get("sslmode");

  if (sslMode === "prefer" || sslMode === "require" || sslMode === "verify-ca") {
    connectionUrl.searchParams.set("sslmode", "verify-full");
  }

  return connectionUrl.toString();
}

const rawConnectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "";

if (!rawConnectionString) {
  throw new Error("Missing DIRECT_URL or DATABASE_URL environment variable.");
}

const connectionString = normalizeConnectionString(rawConnectionString);
const adapter = new PrismaPg({ connectionString });

export const prisma =
  global.__schoolHubPrisma__ ??
  new PrismaClient({
    adapter,
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__schoolHubPrisma__ = prisma;
}
