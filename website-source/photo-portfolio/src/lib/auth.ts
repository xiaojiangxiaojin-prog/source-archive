import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "node:crypto";
import { getDb } from "./db";

const cookieName = "admin_session";
const maxAge = 60 * 60 * 24 * 7;

function getSecret() {
  return process.env.AUTH_SECRET || "local-dev-secret-change-me";
}

function sign(value: string) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
}

export async function loginAdmin(username: string, password: string) {
  const admin = getDb()
    .prepare("SELECT * FROM admins WHERE username = ?")
    .get(username) as { id: number; username: string; password_hash: string } | undefined;

  const envLoginOk =
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD &&
    Boolean(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD);

  if ((!admin || !bcrypt.compareSync(password, admin.password_hash)) && !envLoginOk) {
    return false;
  }

  const expires = Math.floor(Date.now() / 1000) + maxAge;
  const payload = `${admin?.id ?? 1}:${username}:${expires}`;
  const token = `${payload}:${sign(payload)}`;
  const cookieStore = await cookies();
  cookieStore.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
  return true;
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName);
}

export async function isAdminLoggedIn() {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;
  if (!token) return false;

  const parts = token.split(":");
  if (parts.length !== 4) return false;
  const [id, username, expires, signature] = parts;
  const payload = `${id}:${username}:${expires}`;
  const expected = sign(payload);
  if (signature.length !== expected.length) return false;
  const isValid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  return isValid && Number(expires) > Math.floor(Date.now() / 1000);
}

export async function requireAdmin() {
  if (!(await isAdminLoggedIn())) {
    redirect("/admin/login");
  }
}
