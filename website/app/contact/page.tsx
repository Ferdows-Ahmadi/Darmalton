import { InfoPage } from "@/components/InfoPage";
import { CmsInfoPage } from "@/components/CmsInfoPage";
import { publicContentPage } from "@/lib/public-cms";

export const metadata = { title: "تماس با درملتون" };

export default async function ContactPage() {
  const page = await publicContentPage("contact");
  if (page) return <CmsInfoPage page={page} eyebrow="تماس" />;
  return (
    <InfoPage
      eyebrow="تماس"
      title="چگونه می‌توانیم کمک کنیم؟"
      intro="برای راهنمایی عمومی، پیگیری خدمات یا همکاری با تیم درملتون تماس بگیرید."
    >
      <h2>پشتیبانی مشتری</h2>
      <p dir="ltr">+93 700 123 456</p>
      <p>
        <a href="mailto:help@darmalton.af">help@darmalton.af</a>
      </p>
      <h2>ساعات پاسخ‌گویی</h2>
      <p>شنبه تا پنج‌شنبه، ساعت ۸ صبح تا ۸ شب به وقت کابل.</p>
      <p>
        در وضعیت عاجل طبی با خدمات صحی اضطراری تماس بگیرید؛ درملتون جایگزین
        خدمات عاجل نیست.
      </p>
    </InfoPage>
  );
}
