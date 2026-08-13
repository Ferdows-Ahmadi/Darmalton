import { publicApi } from "./server-api";
import type {
  Medicine,
  PageResult,
  PublicAnnouncement,
  PublicBanner,
  PublicContentPage,
  PublicFeaturedMedicine
} from "./types";

export async function publicCmsList<T>(path: string): Promise<T[]> {
  try {
    return (await publicApi<PageResult<T>>(path)).results;
  } catch {
    return [];
  }
}

export async function publicContentPage(slug: string) {
  const pages = await publicCmsList<PublicContentPage>(
    `cms/pages/?slug=${encodeURIComponent(slug)}`
  );
  return pages[0] ?? null;
}

export async function publicHomeCms() {
  const [heroes, announcements, features, articles] = await Promise.all([
    publicCmsList<PublicBanner>(
      "cms/banners/?placement=HOME_HERO&ordering=display_order"
    ),
    publicCmsList<PublicAnnouncement>(
      "cms/announcements/?placement=HOME&ordering=display_order"
    ),
    publicCmsList<PublicFeaturedMedicine>(
      "cms/featured-medicines/?placement=HOME_FEATURED&ordering=display_order"
    ),
    publicCmsList<PublicContentPage>(
      "cms/health-articles/?ordering=display_order"
    )
  ]);
  const featuredMedicines = (
    await Promise.all(
      features.slice(0, 6).map(async (feature) => {
        try {
          const medicine = await publicApi<Medicine>(
            `medicines/${feature.medicine_id}/`
          );
          return { feature, medicine };
        } catch {
          return null;
        }
      })
    )
  ).filter(
    (item): item is { feature: PublicFeaturedMedicine; medicine: Medicine } =>
      item !== null
  );
  return {
    hero: heroes[0] ?? null,
    announcements,
    featuredMedicines,
    articles: articles.slice(0, 3)
  };
}
