import Link from "next/link";

const navClass = "rounded-md px-3 py-2 transition hover:bg-white/10 hover:text-white";

export function AdminNav() {
  return (
    <aside className="border-b border-[#f7f2e8]/10 bg-[#15130f]/95 px-5 py-4 lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r lg:px-6">
      <Link href="/admin" className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.24em] text-white">
        <span className="h-2.5 w-2.5 rounded-full bg-[#d7b56d]" />
        Admin
      </Link>
      <nav className="mt-6 flex gap-3 text-sm text-[#c9c0b1] lg:flex-col">
        <Link href="/admin" className={navClass}>
          作品管理
        </Link>
        <Link href="/admin/upload" className={navClass}>
          上传作品
        </Link>
        <Link href="/admin/live" className={navClass}>
          直播入口
        </Link>
        <form action="/api/auth/logout" method="post">
          <button className={`${navClass} text-left`}>退出登录</button>
        </form>
      </nav>
    </aside>
  );
}
