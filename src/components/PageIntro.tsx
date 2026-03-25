import { ReactNode } from "react";
import { useI18n } from "../lib/i18n";
import { FeaturePage, PAGE_CATEGORY } from "../lib/categories";

interface PageIntroProps {
  page: FeaturePage;
  title: string;
  description: string;
  actions?: ReactNode;
  className?: string;
}

export function PageIntro({ page, title, description, actions, className }: PageIntroProps) {
  const { t } = useI18n();

  return (
    <div
      className={`mb-8 border-b border-[var(--border)] pb-6 ${actions ? "flex items-end justify-between gap-4" : ""} ${
        className ?? ""
      }`}
    >
      <div>
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-disabled)]">
          {t(PAGE_CATEGORY[page] ?? "cat.documents")} {" > "} {t(`nav.${page}`)}
        </p>
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">{title}</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}
