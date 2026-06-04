import { PrismaClient } from "../../generated/prisma/client";
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

declare global {
    var prisma: PrismaClient | undefined;
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = globalThis.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalThis.prisma = db;

export default db;