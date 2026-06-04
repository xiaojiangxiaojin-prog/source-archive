import { redirect } from "next/navigation";
import { isAdminLoggedIn } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await isAdminLoggedIn()) redirect("/admin");
  const { error } = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center bg-neutral-950 px-5">
      <form
        action="/api/auth/login"
        method="post"
        encType="multipart/form-data"
        className="w-full max-w-sm rounded-md border border-white/10 bg-white/[0.04] p-6"
      >
        <p className="text-sm uppercase tracking-[0.24em] text-neutral-500">Admin Login</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">后台登录</h1>
        {error ? <p className="mt-4 rounded bg-red-500/15 px-3 py-2 text-sm text-red-200">账号或密码错误</p> : null}
        <label className="mt-6 grid gap-2">
          <span className="text-sm text-neutral-300">账号</span>
          <input name="username" required className="rounded-md border border-white/10 bg-neutral-900 px-4 py-3 text-white" />
        </label>
        <label className="mt-4 grid gap-2">
          <span className="text-sm text-neutral-300">密码</span>
          <input name="password" required type="password" className="rounded-md border border-white/10 bg-neutral-900 px-4 py-3 text-white" />
        </label>
        <button className="mt-6 w-full rounded-full bg-white px-6 py-3 text-sm font-medium text-neutral-950">登录</button>
      </form>
    </main>
  );
}
