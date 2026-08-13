import { InfoPage } from "@/components/InfoPage";
import { CmsInfoPage } from "@/components/CmsInfoPage";
import { publicContentPage } from "@/lib/public-cms";

export const metadata = { title: "درباره درملتون" };

export default async function AboutPage() {
  const page = await publicContentPage("about");
  if (page) return <CmsInfoPage page={page} eyebrow="درباره ما" />;
  return (
    <InfoPage
      eyebrow="درباره ما"
      title="داروخانه دیجیتال با مسئولیت حرفه‌ای"
      intro="درملتون برای ساده‌کردن دسترسی به خدمات داروخانه و حفظ نقش تصمیم‌گیرنده فارمسیست ساخته شده است."
    >
      <h2>ماموریت ما</h2>
      <p>
        فراهم‌کردن تجربه‌ای روشن، امن و دری‌محور برای جستجوی محصولات صحی،
        فرستادن نسخه و پیگیری سفارش.
      </p>
      <h2>اصل‌های کاری</h2>
      <p>
        قیمت و موجودی در سرور داروخانه کنترل می‌شود، نسخه‌ها خصوصی می‌مانند و
        داروی نسخه‌ای فقط پس از تأیید معتبر قابل سفارش است.
      </p>
    </InfoPage>
  );
}
