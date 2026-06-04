import { notFound } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { LiveAlbumForm } from "@/components/admin/LiveAlbumForm";
import { requireAdmin } from "@/lib/auth";
import { getLiveAlbum } from "@/lib/live";

export const dynamic = "force-dynamic";

export default async function EditLiveAlbumPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const album = getLiveAlbum(Number(id));
  if (!album) notFound();

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 lg:flex">
      <AdminNav />
      <section className="flex-1 px-5 py-8 lg:px-10">
        <div className="max-w-3xl">
          <p className="text-sm uppercase tracking-[0.24em] text-neutral-500">Edit Live Album</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">编辑直播相册</h1>
          <div className="mt-8 rounded-md border border-white/10 bg-white/[0.03] p-5">
            <LiveAlbumForm album={album} />
          </div>
        </div>
      </section>
    </main>
  );
}
