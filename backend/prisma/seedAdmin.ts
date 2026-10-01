import { PrismaClient, AdminRole } from "@prisma/client";
import 'dotenv/config';
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

async function main() {
  const username = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD;
  const recoveryEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!username || !password || !recoveryEmail) {
    throw new Error("Set ADMIN_USERNAME, ADMIN_PASSWORD, and ADMIN_EMAIL before running admin:setup.");
  }
  if (username.length < 3 || username.length > 40) {
    throw new Error("ADMIN_USERNAME must be between 3 and 40 characters.");
  }
  if (password.length < 12) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recoveryEmail)) {
    throw new Error("ADMIN_EMAIL must be a valid recovery email address.");
  }

  const existing = await prisma.adminUser.findUnique({ where: { username } });
  if (existing && existing.role !== AdminRole.ADMIN) {
    throw new Error("That username belongs to a staff account. Choose an admin username.");
  }

  const passwordHash = await hashPassword(password);
  const admin = existing
    ? await prisma.adminUser.update({
        where: { id: existing.id },
        data: { password: passwordHash, recoveryEmail, active: true },
      })
    : await prisma.adminUser.create({
        data: { username, password: passwordHash, recoveryEmail, role: AdminRole.ADMIN, active: true },
      });

  console.log(`Admin account ${existing ? "password reset" : "created"}: ${admin.username}`);
  console.log("Clear ADMIN_USERNAME, ADMIN_EMAIL, and ADMIN_PASSWORD from the environment after this one-time setup.");
}

main()
  .catch((e) => {
    console.error("❌  Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
