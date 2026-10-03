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
  const recoveryEmail = (process.env.OWNER_ADMIN_EMAIL || "nishandhungana939@gmail.com").trim().toLowerCase();
  if (!username || !password) {
    throw new Error("Set ADMIN_USERNAME and ADMIN_PASSWORD before running admin:setup.");
  }
  if (username.length < 3 || username.length > 40) {
    throw new Error("ADMIN_USERNAME must be between 3 and 40 characters.");
  }
  if (password.length < 12) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recoveryEmail)) {
    throw new Error("OWNER_ADMIN_EMAIL must be a valid email address.");
  }

  const existingByUsername = await prisma.adminUser.findUnique({ where: { username } });
  if (existingByUsername && existingByUsername.role !== AdminRole.ADMIN) {
    throw new Error("That username belongs to a staff account. Choose an admin username.");
  }

  const owners = await prisma.adminUser.findMany({ where: { role: AdminRole.ADMIN }, select: { id: true } });
  if (owners.length > 1 && !existingByUsername) {
    throw new Error("More than one admin account exists. Resolve the owner account before running this reset.");
  }
  const existing = existingByUsername ?? (owners.length === 1
    ? await prisma.adminUser.findUnique({ where: { id: owners[0].id } })
    : null);

  const passwordHash = await hashPassword(password);
  const admin = existing
    ? await prisma.adminUser.update({
        where: { id: existing.id },
        data: { username, password: passwordHash, recoveryEmail, active: true },
      })
    : await prisma.adminUser.create({
        data: { username, password: passwordHash, recoveryEmail, role: AdminRole.ADMIN, active: true },
      });

  console.log(`Admin account ${existing ? "password reset" : "created"}: ${admin.username}`);
  if (process.env.DISABLE_EXISTING_STAFF === "true") {
    const disabled = await prisma.adminUser.updateMany({ where: { role: AdminRole.STAFF, active: true }, data: { active: false } });
    console.log(`Disabled ${disabled.count} existing staff account(s). Accounts were preserved.`);
    const otherAdmins = await prisma.adminUser.updateMany({ where: { role: AdminRole.ADMIN, id: { not: admin.id }, active: true }, data: { active: false } });
    console.log(`Disabled ${otherAdmins.count} other admin account(s). Accounts were preserved.`);
  }
  console.log("Clear ADMIN_USERNAME and ADMIN_PASSWORD from the environment after this one-time setup.");
}

main()
  .catch((e) => {
    console.error("❌  Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
