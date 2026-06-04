import { siteDescription, siteName } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-[#f7f2e8]/10 bg-[#0d0c0b]/80 px-5 py-10 text-[#8d8375]">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm uppercase tracking-[0.22em] text-[#d7b56d]">{siteName}</p>
        <p className="text-sm">{siteDescription}</p>
      </div>
    </footer>
  );
}
