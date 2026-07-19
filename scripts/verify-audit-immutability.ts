import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required.");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const event = await prisma.auditEvent.findFirst({ select: { id: true } });
  if (!event) throw new Error("Seed an audit event before running this check.");

  let deleteBlocked = false;
  try {
    await prisma.auditEvent.delete({ where: { id: event.id } });
  } catch (error) {
    deleteBlocked = error instanceof Error && error.message.includes("append-only");
  }

  let updateBlocked = false;
  try {
    await prisma.auditEvent.update({ where: { id: event.id }, data: { action: "MUTATION_TEST" } });
  } catch (error) {
    updateBlocked = error instanceof Error && error.message.includes("append-only");
  }

  const stillExists = await prisma.auditEvent.findUnique({ where: { id: event.id } });
  if (!deleteBlocked || !updateBlocked || !stillExists || stillExists.action === "MUTATION_TEST") {
    throw new Error("Audit log mutation protection is not active.");
  }
  console.log("Audit immutability verified: UPDATE/DELETE protection is active.");
}

main().finally(() => prisma.$disconnect());
