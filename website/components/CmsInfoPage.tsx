import { CmsImage } from "./CmsImage";
import { InfoPage } from "./InfoPage";
import type { PublicContentPage } from "@/lib/types";

export function CmsInfoPage({
  page,
  eyebrow
}: {
  page: PublicContentPage;
  eyebrow: string;
}) {
  return (
    <InfoPage
      eyebrow={eyebrow}
      title={page.title_dari || page.title}
      intro={page.summary_dari || page.summary || page.body_dari || page.body}
    >
      {page.image_url && (
        <div className="cms-info-image">
          <CmsImage
            src={page.image_url}
            alt={page.alt_text_dari || page.alt_text || page.title_dari}
          />
        </div>
      )}
      <div className="cms-rich-text">{page.body_dari || page.body}</div>
    </InfoPage>
  );
}
