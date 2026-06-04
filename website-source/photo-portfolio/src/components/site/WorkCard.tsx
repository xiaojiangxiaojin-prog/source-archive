import Link from "next/link";
import type { Work } from "@/lib/types";

export function WorkCard({ work, priority = false }: { work: Work; priority?: boolean }) {
  const src = work.thumbnail_path || work.compressed_path || work.video_cover_path;
  const title = work.title.trim();
  const alt = title || work.category_name;
  const ratio =
    work.width && work.height ? `${work.width} / ${work.height}` : work.type === "video" ? "16 / 9" : "4 / 5";

  return (
    <Link
      href={`/works/${work.id}`}
      className="group mb-5 block break-inside-avoid overflow-hidden rounded-md border border-[#f7f2e8]/10 bg-[#181611] shadow-[0_18px_50px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-0.5 hover:border-[#d7b56d]/45"
    >
      <div className="relative overflow-hidden" style={{ aspectRatio: ratio }}>
        {work.type === "video" ? (
          <div className="relative h-full w-full">
            {src ? (
              <img
                src={src}
                alt={alt}
                loading={priority ? "eager" : "lazy"}
                className="h-full w-full object-cover opacity-88 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgba(215,181,109,0.22),transparent_28%),linear-gradient(135deg,#201d17,#0d0c0b)]">
                <div className="rounded-full border border-[#d7b56d]/35 px-5 py-3 text-sm uppercase tracking-[0.28em] text-[#f2d99f]">
                  Video
                </div>
              </div>
            )}
            <span className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/55 px-3 py-1 text-xs text-white backdrop-blur">
              VIDEO
            </span>
          </div>
        ) : (
          <img
            src={src || work.original_path}
            alt={alt}
            loading={priority ? "eager" : "lazy"}
            className="h-full w-full object-cover opacity-92 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
          />
        )}
        {title ? (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/82 to-transparent p-4 opacity-0 transition group-hover:opacity-100">
            <p className="text-sm font-medium text-white">{title}</p>
            <p className="mt-1 text-xs text-[#d7b56d]">{work.category_name}</p>
          </div>
        ) : null}
      </div>
    </Link>
  );
}
