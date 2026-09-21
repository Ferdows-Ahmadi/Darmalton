import { CmsImage } from "./CmsImage";
import { InfoPage } from "./InfoPage";
import type { Locale } from "@/lib/locale";
import type { PublicContentPage } from "@/lib/types";
import { cmsText } from "@/lib/cms-locale";

export function CmsInfoPage({
  page,
  eyebrow,
  locale,
  utility = false,
  className
}: {
  page: PublicContentPage;
  eyebrow: string;
  locale: Locale;
  utility?: boolean;
  className?: string;
}) {
  const localized = (english: string, dari: string) =>
    cmsText(english, dari, locale);
  return (
    <InfoPage
      utility={utility}
      className={className}
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
