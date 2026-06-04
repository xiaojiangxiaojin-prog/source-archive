import type { Work } from "@/lib/types";
import { WorkCard } from "./WorkCard";

export function MasonryGrid({ works }: { works: Work[] }) {
  if (!works.length) {
    return (
      <div className="rounded-md border border-[#f7f2e8]/10 bg-white/[0.045] px-6 py-16 text-center text-[#a9a093] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        暂无作品，登录后台上传后会显示在这里。
      </div>
    );
  }

  return (
    <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 2xl:columns-4">
      {works.map((work, index) => (
        <WorkCard key={work.id} work={work} priority={index < 4} />
      ))}
    </div>
  );
}
