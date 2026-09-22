import { cmsText } from "@/lib/cms-locale";
import type { Locale } from "@/lib/locale";
import type { PublicAnnouncement } from "@/lib/types";
import { CmsActionLink } from "./CmsActionLink";

export function PublicAnnouncements({
  announcements,
  locale = "fa-AF"
}: {
  announcements: PublicAnnouncement[];
  locale?: Locale;
}) {
  if (announcements.length === 0) return null;
  return (
    <section className="public-announcements" aria-label={locale === "ps-AF" ? "د درملتون خبرتیاوې" : "اطلاعیه‌های درملتون"}>
      {announcements.map((announcement) => (
        <article
          className={`public-announcement announcement-${announcement.level.toLowerCase()}`}
          key={announcement.id}
        >
          <div>
            <strong>{(locale === "ps-AF" ? cmsText(announcement.title, announcement.title_dari, locale) : announcement.title_dari || announcement.title)}</strong>
            <p>{(locale === "ps-AF" ? cmsText(announcement.body, announcement.body_dari, locale) : announcement.body_dari || announcement.body)}</p>
          </div>
          {announcement.action_url &&
            ((locale === "ps-AF" ? cmsText(announcement.action_label, announcement.action_label_dari, locale) : announcement.action_label_dari || announcement.action_label)) && (
              <CmsActionLink
                className="announcement-action"
                href={announcement.action_url}
                label={(locale === "ps-AF" ? cmsText(announcement.action_label, announcement.action_label_dari, locale) : announcement.action_label_dari || announcement.action_label)}
              />
            )}
        </article>
      ))}
    </section>
  );
}
