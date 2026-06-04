import Link from "next/link";
import { getCategories } from "@/lib/works";
import { siteName } from "@/lib/constants";

export function Header() {
  const categories = getCategories();

  return (
    <header className="sticky top-0 z-40 border-b border-[#f7f2e8]/10 bg-[#15130f]/78 shadow-[0_16px_40px_rgba(0,0,0,0.18)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#d7b56d] shadow-[0_0_18px_rgba(215,181,109,0.65)]" />
          <span className="text-sm font-semibold uppercase tracking-[0.28em] text-[#f7f2e8] transition group-hover:text-white">
            {siteName}
          </span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-[#c9c0b1] md:flex">
          <Link href="/works" className="transition hover:text-[#f7f2e8]">
            全部作品
          </Link>
          {categories.map((category) => (
            <Link key={category.slug} href={`/categories/${category.slug}`} className="transition hover:text-[#f7f2e8]">
              {category.name}
            </Link>
          ))}
        </nav>
        <Link
          href="/admin"
          className="rounded-full border border-[#f7f2e8]/15 bg-white/[0.03] px-4 py-2 text-sm text-[#e5dac8] transition hover:border-[#d7b56d]/60 hover:text-white"
        >
          管理
        </Link>
      </div>
    </header>
  );
}
