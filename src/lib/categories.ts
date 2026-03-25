import type { Page } from "../components/Sidebar";

export const PAGE_CATEGORY: Partial<Record<Page, string>> = {
  extract: "cat.documents",
  compress: "cat.documents",
  merge: "cat.documents",
  split: "cat.documents",
  organize: "cat.documents",
  clean: "cat.documents",
  repair: "cat.documents",
  convert: "cat.content",
  extractImages: "cat.content",
  watermark: "cat.content",
  metadata: "cat.content",
  forms: "cat.content",
  security: "cat.security",
  sign: "cat.security",
  flatten: "cat.security",
  ai: "cat.intelligence",
  ocr: "cat.intelligence",
};

export type FeaturePage = keyof typeof PAGE_CATEGORY;
