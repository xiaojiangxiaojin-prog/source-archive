export const categories = [
  { name: "研学", slug: "study" },
  { name: "人像", slug: "portrait" },
  { name: "视频", slug: "video" },
] as const;

export const visibleCategorySlugs = categories.map((category) => category.slug);
export const siteName = "JIANGJING Photography";
export const siteDescription = "研学、人像与影像记录";
