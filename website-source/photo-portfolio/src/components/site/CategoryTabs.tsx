import Link from "next/link";
import type { Category } from "@/lib/types";

export function CategoryTabs({
  categories,
  activeSlug,
}: {
  categories: Category[];
  activeSlug?: string;
}) {
  const itemClass =
    "rounded-full border px-4 py-2 text-sm transition shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/works"
        className={`${itemClass} ${
          !activeSlug
            ? "border-[#d7b56d]/70 bg-[#f7f2e8] text-[#15130f]"
            : "border-[#f7f2e8]/10 bg-white/[0.04] text-[#c9c0b1] hover:border-[#d7b56d]/50 hover:text-white"
        }`}
      >
        全部
      </Link>
      {categories.map((category) => (
        <Link
          key={category.slug}
          href={`/categories/${category.slug}`}
          className={`${itemClass} ${
            activeSlug === category.slug
              ? "border-[#d7b56d]/70 bg-[#f7f2e8] text-[#15130f]"
              : "border-[#f7f2e8]/10 bg-white/[0.04] text-[#c9c0b1] hover:border-[#d7b56d]/50 hover:text-white"
          }`}
        >
          {category.name}
        </Link>
      ))}
    </div>
  );
}
