import { notFound } from "next/navigation";
import { CategoryTabs } from "@/components/site/CategoryTabs";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { LiveAlbumGrid } from "@/components/site/LiveAlbumGrid";
import { MasonryGrid } from "@/components/site/MasonryGrid";
import { getLiveAlbums } from "@/lib/live";
import { getCategories, getWorks } from "@/lib/works";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const categories = getCategories();
  const active = categories.find((category) => category.slug === slug);
  if (!active) notFound();

  const works = getWorks({ categorySlug: slug });
  const liveAlbums = getLiveAlbums({ enabledOnly: true });

  return (
    <main className="site-shell min-h-screen">
      <Header />
      <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
        <p className="text-sm uppercase tracking-[0.28em] text-[#d7b56d]">Category</p>
        <h1 className="mt-4 text-4xl font-semibold text-[#fff8ec] md:text-6xl">{active.name}</h1>
        <div className="mt-8">
          <CategoryTabs categories={categories} activeSlug={slug} />
        </div>
      </section>
      {slug === "study" && liveAlbums.length ? (
        <section className="mx-auto max-w-7xl px-5 pb-12 lg:px-8">
          <LiveAlbumGrid albums={liveAlbums} />
        </section>
      ) : null}
      <section className="mx-auto max-w-7xl px-5 pb-20 lg:px-8">
        <MasonryGrid works={works} />
      </section>
      <Footer />
    </main>
  );
}
