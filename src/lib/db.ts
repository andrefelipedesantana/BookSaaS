import { PrismaClient } from "../../generated/prisma/client";

import { PrismaMariaDb } from "@prisma/adapter-mariadb";

declare global {
    var prisma: PrismaClient | undefined;
}

const connectionString = (process.env.DATABASE_URL || "").replace("mysql://", "mariadb://");
const adapter = new PrismaMariaDb(connectionString);

const db = globalThis.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalThis.prisma = db;

export default db;