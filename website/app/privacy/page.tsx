import { InfoPage } from "@/components/InfoPage";
import { CmsInfoPage } from "@/components/CmsInfoPage";
import { publicContentPage } from "@/lib/public-cms";

export const metadata = { title: "حریم خصوصی" };

export default async function PrivacyPage() {
  const page = await publicContentPage("privacy");
  if (page) return <CmsInfoPage page={page} eyebrow="حریم خصوصی" />;
  return (
    <InfoPage
      eyebrow="حریم خصوصی"
      title="اطلاعات شما با احتیاط نگهداری می‌شود"
      intro="این خلاصه توضیح می‌دهد درملتون برای ارائه خدمات چه اطلاعاتی را استفاده می‌کند."
    >
      <h2>اطلاعات حساب و سفارش</h2>
      <p>
        نام، راه تماس، آدرس تحویل و سابقه سفارش فقط برای ارائه، پشتیبانی و
        حفاظت از خدمات استفاده می‌شود.
      </p>
      <h2>نسخه و معلومات صحی</h2>
      <p>
        فایل نسخه عمومی نیست و فقط برای مشتری مالک و افراد حرفه‌ای مجاز قابل
        دسترسی است. حساسیت‌ها و یادداشت طبی اختیاری‌اند.
      </p>
      <h2>کنترل شما</h2>
      <p>
        می‌توانید اطلاعات حساب را اصلاح کنید و برای درخواست حذف حساب با
        پشتیبانی تماس بگیرید؛ سوابقی که قانون یا ایمنی داروخانه نیاز دارد ممکن
        است حفظ شود.
      </p>
    </InfoPage>
  );
}
