import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { getWork } from "@/lib/works";

export const dynamic = "force-dynamic";

export default async function WorkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const work = getWork(Number(id));
  if (!work) notFound();

  const media = work.compressed_path || work.original_path;
  const poster = work.video_cover_path || work.thumbnail_path || work.compressed_path || undefined;
  const title = work.title.trim();
  const alt = title || work.category_name;

  return (
    <main className="site-shell min-h-screen">
      <Header />
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-12 lg:grid-cols-[1fr_360px] lg:px-8">
        <div className="overflow-hidden rounded-md border border-[#f7f2e8]/10 bg-[#0d0c0b] shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
          {work.type === "video" ? (
            <video
              src={work.original_path}
              controls
              playsInline
              preload="metadata"
              poster={poster}
              className="max-h-[78vh] w-full bg-black object-contain"
            >
              <a href={work.original_path} className="text-white">
                下载或打开视频
              </a>
            </video>
          ) : (
            <img src={media} alt={alt} className="max-h-[78vh] w-full object-contain" />
          )}
        </div>
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="text-sm uppercase tracking-[0.22em] text-[#d7b56d]">{work.category_name}</p>
          {title ? <h1 className="mt-3 text-3xl font-semibold text-[#fff8ec]">{title}</h1> : null}
          {work.description ? <p className="mt-5 leading-8 text-[#c9c0b1]">{work.description}</p> : null}
          <div className="mt-8 grid gap-3 border-t border-[#f7f2e8]/10 pt-6 text-sm text-[#8d8375]">
            <p>类型：{work.type === "video" ? "视频" : "图片"}</p>
            {work.taken_at ? <p>拍摄时间：{work.taken_at}</p> : null}
          </div>
          <Link
            href={`/categories/${work.category_slug}`}
            className="mt-8 inline-flex rounded-full border border-[#f7f2e8]/15 bg-white/[0.03] px-5 py-3 text-sm text-[#f7f2e8] transition hover:border-[#d7b56d]/60"
          >
            返回{work.category_name}
          </Link>
        </aside>
      </section>
      <Footer />
    </main>
  );
}
