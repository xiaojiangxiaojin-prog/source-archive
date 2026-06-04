import Link from "next/link";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { LiveAlbumGrid } from "@/components/site/LiveAlbumGrid";
import { MasonryGrid } from "@/components/site/MasonryGrid";
import { getLiveAlbums } from "@/lib/live";
import { getWorks } from "@/lib/works";

export const dynamic = "force-dynamic";

export default function Home() {
  const featuredWorks = getWorks({ featured: true, limit: 8 });
  const liveAlbums = getLiveAlbums({ enabledOnly: true });
  const hero = featuredWorks[0];
  const heroImage = hero?.compressed_path || hero?.thumbnail_path || hero?.original_path;
  const stats = [
    { label: "精选作品", value: featuredWorks.length || 0 },
    { label: "直播相册", value: liveAlbums.length || 0 },
    { label: "展示分类", value: 3 },
  ];

  return (
    <main className="site-shell min-h-screen">
      <Header />
      <section className="relative min-h-[82vh] overflow-hidden">
        {heroImage ? (
          <img
            src={heroImage}
            alt={hero?.title || "精选摄影作品"}
            className="absolute inset-0 h-full w-full object-cover opacity-62"
          />
        ) : null}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_24%,rgba(215,181,109,0.18),transparent_28rem),linear-gradient(90deg,rgba(21,19,15,0.84),rgba(21,19,15,0.38)_48%,rgba(21,19,15,0.76)),linear-gradient(180deg,rgba(28,25,20,0.08),#15130f_94%)]" />
        <div className="relative mx-auto grid min-h-[82vh] max-w-7xl content-end gap-10 px-5 pb-14 pt-28 lg:grid-cols-[1fr_360px] lg:px-8">
          <div>
            <p className="mb-5 text-sm uppercase tracking-[0.36em] text-[#d7b56d]">Selected Photography</p>
            <h1 className="text-balance max-w-4xl text-5xl font-semibold leading-tight text-[#fff8ec] md:text-7xl">
              用影像保留现场、人物与旅途里的光。
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#c9c0b1]">
              这里收录研学活动、人像记录和视频片段，访客只需安静浏览，后台由管理员统一上传和整理。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/works"
                className="rounded-full bg-[#f7f2e8] px-6 py-3 text-sm font-medium text-[#15130f] transition hover:bg-white"
              >
                浏览全部作品
              </Link>
              <Link
                href="/categories/video"
                className="rounded-full border border-[#f7f2e8]/20 bg-white/[0.04] px-6 py-3 text-sm font-medium text-[#f7f2e8] transition hover:border-[#d7b56d]/70"
              >
                查看视频
              </Link>
            </div>
          </div>
          <div className="hidden self-end rounded-md border border-[#f7f2e8]/12 bg-[#15130f]/58 p-5 shadow-2xl backdrop-blur md:block">
            <p className="text-xs uppercase tracking-[0.28em] text-[#8d8375]">Portfolio Index</p>
            <div className="mt-5 grid grid-cols-3 gap-3">
              {stats.map((item) => (
                <div key={item.label} className="border-l border-[#d7b56d]/40 pl-3">
                  <p className="text-2xl font-semibold text-[#fff8ec]">{item.value}</p>
                  <p className="mt-1 text-xs text-[#a9a093]">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {liveAlbums.length ? (
        <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-[#d7b56d]">Study Live Albums</p>
              <h2 className="mt-3 text-3xl font-semibold text-[#fff8ec]">研学直播相册</h2>
            </div>
            <p className="max-w-md text-sm leading-7 text-[#a9a093]">点击封面进入喔图直播相册，适合快速查看现场影像。</p>
          </div>
          <LiveAlbumGrid albums={liveAlbums} />
        </section>
      ) : null}

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 border-t border-[#f7f2e8]/10 pt-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-[#d7b56d]">Featured Works</p>
            <h2 className="mt-3 text-3xl font-semibold text-[#fff8ec]">精选作品</h2>
          </div>
          <Link href="/works" className="text-sm text-[#c9c0b1] transition hover:text-white">
            全部作品
          </Link>
        </div>
        <MasonryGrid works={featuredWorks} />
      </section>
      <Footer />
    </main>
  );
}
