import type { PublicAnnouncement } from "@/lib/types";
import { CmsActionLink } from "./CmsActionLink";

export function PublicAnnouncements({
  announcements
}: {
  announcements: PublicAnnouncement[];
}) {
  if (announcements.length === 0) return null;
  return (
    <section className="public-announcements" aria-label="اطلاعیه‌های درملتون">
      {announcements.map((announcement) => (
        <article
          className={`public-announcement announcement-${announcement.level.toLowerCase()}`}
          key={announcement.id}
        >
          <div>
            <strong>{announcement.title_dari || announcement.title}</strong>
            <p>{announcement.body_dari || announcement.body}</p>
          </div>
          {announcement.action_url &&
            (announcement.action_label_dari || announcement.action_label) && (
              <CmsActionLink
                className="announcement-action"
                href={announcement.action_url}
                label={announcement.action_label_dari || announcement.action_label}
              />
            )}
        </article>
      ))}
    </section>
  );
}
