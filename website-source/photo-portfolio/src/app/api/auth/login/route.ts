import { redirect } from "next/navigation";
import { loginAdmin } from "@/lib/auth";

export async function POST(request: Request) {
  const formData = await request.formData();
  const username = String(formData.get("username") || "");
  const password = String(formData.get("password") || "");
  const ok = await loginAdmin(username, password);

  if (!ok) {
    redirect("/admin/login?error=1");
  }
  redirect("/admin");
}
