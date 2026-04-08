import "server-only";

import dotenv from "dotenv";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

declare global {
  var __schoolHubPrisma__: PrismaClient | undefined;
}

dotenv.config({ path: path.resolve(process.cwd(), "../.env"), quiet: true });

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "";
const adapter = new PrismaPg({ connectionString });

export const prisma =
  global.__schoolHubPrisma__ ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__schoolHubPrisma__ = prisma;
}
