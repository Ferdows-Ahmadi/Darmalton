import { CmsImage } from "./CmsImage";
import { InfoPage } from "./InfoPage";
import type { Locale } from "@/lib/locale";
import type { PublicContentPage } from "@/lib/types";

export function CmsInfoPage({
  page,
  eyebrow,
  locale = "fa-AF"
}: {
  page: PublicContentPage;
  eyebrow: string;
  locale?: Locale;
}) {
  const localized = (english: string, dari: string) =>
    locale === "fa-AF" ? dari || english : english || dari;
  return (
    <InfoPage
      eyebrow={eyebrow}
      title={localized(page.title, page.title_dari)}
      intro={localized(page.summary, page.summary_dari) || localized(page.body, page.body_dari)}
    >
      {page.image_url && (
        <div className="cms-info-image">
          <CmsImage
            src={page.image_url}
            alt={localized(page.alt_text, page.alt_text_dari) || localized(page.title, page.title_dari)}
          />
        </div>
      )}
      <div className="cms-rich-text">{localized(page.body, page.body_dari)}</div>
    </InfoPage>
  );
}
