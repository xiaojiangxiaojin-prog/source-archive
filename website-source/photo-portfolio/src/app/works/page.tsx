import { CategoryTabs } from "@/components/site/CategoryTabs";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { MasonryGrid } from "@/components/site/MasonryGrid";
import { getCategories, getWorks } from "@/lib/works";

export const dynamic = "force-dynamic";

export default function WorksPage() {
  const categories = getCategories();
  const works = getWorks({ excludeVideos: true });

  return (
    <main className="site-shell min-h-screen">
      <Header />
      <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
        <p className="text-sm uppercase tracking-[0.28em] text-[#d7b56d]">Gallery</p>
        <h1 className="mt-4 text-4xl font-semibold text-[#fff8ec] md:text-6xl">全部作品</h1>
        <p className="mt-5 max-w-2xl leading-8 text-[#a9a093]">按分类浏览照片，保持干净的相册式体验。视频请从视频分类进入。</p>
        <div className="mt-8">
          <CategoryTabs categories={categories} />
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 pb-20 lg:px-8">
        <MasonryGrid works={works} />
      </section>
      <Footer />
    </main>
  );
}
