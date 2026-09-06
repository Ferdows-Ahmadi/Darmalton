import type { LocalizedCopy } from "@/components/StaticInfoPage";

const copy = (en: string, fa: string, ps: string): LocalizedCopy => ({
  en,
  "fa-AF": fa,
  "ps-AF": ps
});

export const staticPages = {
  about: {
    eyebrow: copy("About us", "درباره ما", "زموږ په اړه"),
    title: copy("Care, within reach", "مراقبت، در دسترس شما", "پاملرنه، ستاسو په لاس کې"),
    intro: copy(
      "Darmalton brings product browsing, private prescription review and order history together.",
      "درملتون مشاهده محصولات، بررسی محرمانه نسخه و پیگیری سفارش را در یک جا فراهم می‌کند.",
      "درملتون د توکو کتنه، د نسخې محرم ارزونه او د فرمایشونو تاریخ په یوه ځای کې راټولوي."
    ),
    sections: [
      {
        title: copy("Our role", "نقش ما", "زموږ دنده"),
        body: copy(
          "The pharmacy server controls prices, stock and order status. Authorized pharmacy staff review prescriptions.",
          "سرور داروخانه قیمت، موجودی و وضعیت سفارش را کنترل می‌کند. نسخه‌ها توسط کارمندان مجاز بررسی می‌شوند.",
          "د درملتون سرور بیې، موجودي او د فرمایش حالت کنټرولوي. نسخې د مجاز کارکوونکو لخوا ارزول کېږي."
        )
      }
    ]
  },
  contact: {
    eyebrow: copy("Contact", "تماس", "اړیکه"),
    title: copy("How can we help?", "چگونه می‌توانیم کمک کنیم؟", "څنګه مرسته درسره وکړو؟"),
    intro: copy(
      "Use your account notifications for order or prescription updates. Published contact details appear here when configured by the pharmacy team.",
      "برای پیگیری سفارش یا نسخه از اعلان‌های حساب استفاده کنید. معلومات تماس پس از ثبت توسط تیم داروخانه در این بخش نمایش داده می‌شود.",
      "د فرمایش یا نسخې د خبرونو لپاره د حساب خبرتیاوې وکاروئ. د اړیکې معلومات به د درملتون د ډلې له ثبت وروسته دلته ښکاره شي."
    ),
    sections: [
      {
        title: copy("Urgent care", "حالت عاجل", "بیړنۍ پاملرنه"),
        body: copy(
          "Darmalton is not an emergency service. Contact local emergency health services for urgent medical help.",
          "درملتون خدمات عاجل نیست. برای کمک فوری طبی با خدمات صحی اضطراری محل تماس بگیرید.",
          "درملتون بیړنی خدمت نه دی. د عاجلې طبي مرستې لپاره له سیمه‌ییزو بیړنیو روغتیايي خدمتونو سره اړیکه ونیسئ."
        )
      }
    ]
  },
  help: {
    eyebrow: copy("Help", "راهنما", "لارښود"),
    title: copy("Customer help", "راهنمای مشتری", "د پېرودونکي لارښود"),
    intro: copy(
      "Find products, upload a prescription, manage your cart and follow your orders from one account.",
      "محصول را پیدا کنید، نسخه بفرستید، سبد را مدیریت کنید و سفارش را از یک حساب پیگیری کنید.",
      "توکي ومومئ، نسخه پورته کړئ، ټوکرۍ اداره کړئ او خپل فرمایشونه له یوه حسابه تعقیب کړئ."
    ),
    sections: [
      {
        title: copy("Ordering", "سفارش", "فرمایش"),
        body: copy(
          "Add an available non-prescription product to your cart, sign in, select an address and confirm cash on delivery.",
          "محصول موجود بدون نسخه را به سبد بیفزایید، وارد شوید، آدرس را انتخاب و پرداخت هنگام تحویل را تأیید کنید.",
          "موجود بې نسخې توکی ټوکرۍ ته واچوئ، ننوځئ، پته وټاکئ او د سپارلو پر مهال نغدې پیسې تایید کړئ."
        )
      },
      {
        title: copy("Prescriptions", "نسخه‌ها", "نسخې"),
        body: copy(
          "Prescription products enter the cart only after an authorized review and approval.",
          "داروی نسخه‌ای فقط پس از بررسی و تأیید مجاز وارد سبد می‌شود.",
          "نسخه‌يي درمل یوازې له مجازې ارزونې او تایید وروسته ټوکرۍ ته داخلېږي."
        )
      }
    ]
  },
  faq: {
    eyebrow: copy("FAQ", "پرسش‌های متداول", "ډېرې پوښتل شوې پوښتنې"),
    title: copy("Frequently asked questions", "پرسش‌های متداول", "ډېرې پوښتل شوې پوښتنې"),
    intro: copy(
      "Answers about browsing, prescriptions, stock and ordering.",
      "پاسخ‌هایی درباره مشاهده محصولات، نسخه، موجودی و سفارش.",
      "د توکو کتنې، نسخې، موجودۍ او فرمایش په اړه ځوابونه."
    ),
    sections: [
      {
        title: copy("Can I browse without an account?", "آیا بدون حساب می‌توانم محصولات را ببینم؟", "ایا له حساب پرته توکي کتلی شم؟"),
        body: copy("Yes. Sign in is required at checkout and for private account records.", "بله. برای ثبت سفارش و دیدن سوابق خصوصی باید وارد شوید.", "هو. د فرمایش ثبتولو او شخصي سوابقو لپاره ننوتل اړین دي.")
      },
      {
        title: copy("When is stock confirmed?", "موجودی چه زمانی تأیید می‌شود؟", "موجودي کله تاییدېږي؟"),
        body: copy("The server verifies price and stock again when the order is placed.", "سرور هنگام ثبت نهایی سفارش قیمت و موجودی را دوباره بررسی می‌کند.", "سرور د فرمایش د ثبت پر مهال بیه او موجودي بیا تاییدوي.")
      }
    ]
  },
  prescriptionHelp: {
    eyebrow: copy("Prescription help", "راهنمای نسخه", "د نسخې لارښود"),
    title: copy("How prescription upload works", "راهنمای ارسال نسخه", "د نسخې پورته کولو لارښود"),
    intro: copy(
      "Send a clear JPG, PNG or PDF. Your file stays private to you and authorized pharmacy staff.",
      "عکس یا PDF واضح بفرستید. فایل فقط برای شما و کارمندان مجاز قابل دسترسی است.",
      "روښانه JPG، PNG یا PDF واستوئ. فایل یوازې تاسو او مجاز درملتون کارکوونکي لیدلی شي."
    ),
    sections: [
      {
        title: copy("Review", "بررسی", "ارزونه"),
        body: copy("The pharmacy may approve, reject or request clarification. Upload does not create an order.", "داروخانه می‌تواند نسخه را تأیید یا رد کند یا توضیح بخواهد. ارسال نسخه سفارش ایجاد نمی‌کند.", "درملتون نسخه تایید یا ردولی شي، یا وضاحت غوښتلی شي. پورته کول فرمایش نه جوړوي.")
      }
    ],
    action: {
      href: "/prescriptions/upload",
      label: copy("Upload prescription", "ارسال نسخه", "نسخه پورته کړئ")
    }
  },
  delivery: {
    eyebrow: copy("Delivery", "تحویل", "سپارل"),
    title: copy("Delivery and ordering", "تحویل و سفارش", "سپارل او فرمایش"),
    intro: copy("Delivery availability and order status come from the pharmacy service.", "امکان تحویل و وضعیت سفارش توسط خدمات داروخانه تعیین می‌شود.", "د سپارلو امکان او د فرمایش حالت د درملتون خدمت ټاکي."),
    sections: [
      {
        title: copy("Address", "آدرس", "پته"),
        body: copy("Choose or add a delivery address during checkout. Review it before placing the order.", "در مرحله ثبت سفارش یک آدرس را انتخاب یا اضافه کنید و پیش از تأیید آن را بررسی کنید.", "د فرمایش پر مهال پته وټاکئ یا زیاته کړئ او له تایید مخکې یې وګورئ.")
      }
    ]
  },
  returns: {
    eyebrow: copy("Returns", "بازگشت و لغو", "بېرته ستنول او لغوه کول"),
    title: copy("Returns and cancellation", "بازگشت و لغو سفارش", "بېرته ستنول او د فرمایش لغوه کول"),
    intro: copy("Pharmacy staff review return requests under the recorded order and medicine conditions.", "تیم داروخانه درخواست بازگشت را بر اساس سفارش ثبت‌شده و وضعیت دارو بررسی می‌کند.", "د درملتون ډله د ثبت شوي فرمایش او د درملو د حالت له مخې د بېرته ستنولو غوښتنه ارزوي."),
    sections: [
      {
        title: copy("Before requesting a return", "پیش از درخواست", "له غوښتنې مخکې"),
        body: copy("Keep the product and packaging unchanged and use the contact route for current instructions.", "محصول و بسته‌بندی را بدون تغییر نگه دارید و برای راهنمایی فعلی از بخش تماس استفاده کنید.", "توکی او بسته بندي مه بدلوئ او د اوسنۍ لارښوونې لپاره د اړیکې برخه وکاروئ.")
      }
    ]
  },
  privacy: {
    eyebrow: copy("Privacy", "حریم خصوصی", "محرمیت"),
    title: copy("Your information is handled carefully", "اطلاعات شما با احتیاط نگهداری می‌شود", "ستاسو معلومات په پاملرنې ساتل کېږي"),
    intro: copy("Account, address and prescription data is used to provide and protect the service.", "اطلاعات حساب، آدرس و نسخه برای ارائه و حفاظت از خدمات استفاده می‌شود.", "د حساب، پتې او نسخې معلومات د خدمت د وړاندې کولو او خوندي کولو لپاره کارېږي."),
    sections: [
      {
        title: copy("Private records", "سوابق خصوصی", "شخصي سوابق"),
        body: copy("Prescription files are available only to their owner and authorized pharmacy roles.", "فایل نسخه فقط برای مالک آن و نقش‌های مجاز داروخانه قابل دسترسی است.", "د نسخې فایل یوازې مالک او د درملتون مجاز کارکوونکي لیدلی شي.")
      }
    ]
  },
  terms: {
    eyebrow: copy("Terms", "شرایط استفاده", "د کارولو شرایط"),
    title: copy("Responsible use of Darmalton", "استفاده مسئولانه از درملتون", "د درملتون مسؤلانه کارول"),
    intro: copy("Provide accurate information and do not treat product content as a medical diagnosis.", "اطلاعات درست ارائه کنید و معلومات محصول را جای تشخیص طبی ندانید.", "سم معلومات ورکړئ او د توکو معلومات طبي تشخیص مه ګڼئ."),
    sections: [
      {
        title: copy("Price and stock", "قیمت و موجودی", "بیه او موجودي"),
        body: copy("The server confirms authoritative price, stock, ownership and prescription rules when you act.", "سرور هنگام انجام عملیات قیمت، موجودی، مالکیت و قواعد نسخه را تأیید می‌کند.", "سرور د عمل پر مهال بیه، موجودي، مالکیت او د نسخې اصول تاییدوي.")
      }
    ]
  },
  app: {
    eyebrow: copy("Mobile app", "اپلیکیشن موبایل", "موبایل اپ"),
    title: copy("Darmalton on Android", "درملتون در اندروید", "درملتون په اندروید کې"),
    intro: copy("Download the signed Darmalton Android package. An iOS release is not available yet.", "نسخه امضاشده اندروید درملتون را دانلود کنید. نسخه iOS هنوز منتشر نشده است.", "د درملتون لاسلیک شوی اندروید فایل ښکته کړئ. د iOS نسخه لا نه ده خپره شوې."),
    sections: [
      {
        title: copy("Install", "نصب", "نصب"),
        body: copy("Open the downloaded APK on your Android device and follow its installation prompts.", "فایل APK دانلودشده را در دستگاه اندروید باز و مراحل نصب را دنبال کنید.", "ښکته شوی APK په اندروید وسیله کې خلاص او د نصب پړاوونه تعقیب کړئ.")
      }
    ],
    action: {
      href: "https://darmalton.com/downloads/darmalton-android-1.0.0.apk",
      label: copy("Download Android", "دانلود اندروید", "اندروید ښکته کړئ")
    }
  },
  forgot: {
    eyebrow: copy("Account help", "راهنمای حساب", "د حساب مرسته"),
    title: copy("Forgot password", "فراموشی رمز عبور", "پټنوم هېر شوی"),
    intro: copy("Email password recovery is not configured in this local environment.", "بازیابی رمز با ایمیل در این محیط محلی تنظیم نشده است.", "په دې محلي چاپېریال کې د برېښنالیک د پټنوم بېرته اخیستل نه دي تنظیم شوي."),
    sections: [
      {
        title: copy("Get help", "دریافت کمک", "مرسته ترلاسه کړئ"),
        body: copy("Use the contact page for current account-support instructions.", "برای راهنمایی فعلی حساب از صفحه تماس استفاده کنید.", "د حساب د اوسنۍ مرستې لپاره د اړیکې پاڼه وکاروئ.")
      }
    ],
    action: { href: "/contact", label: copy("Contact", "تماس", "اړیکه") }
  },
  reset: {
    eyebrow: copy("Account help", "راهنمای حساب", "د حساب مرسته"),
    title: copy("Reset password", "بازنشانی رمز عبور", "پټنوم بدلول"),
    intro: copy("A valid recovery flow is not configured in this local environment.", "مسیر معتبر بازیابی در این محیط محلی تنظیم نشده است.", "په دې محلي چاپېریال کې د بېرته اخیستلو معتبر بهیر نه دی تنظیم شوی."),
    sections: [
      {
        title: copy("Protect your account", "حفاظت از حساب", "خپل حساب خوندي کړئ"),
        body: copy("Do not share passwords or recovery links. Ask the pharmacy team for account help.", "رمز یا لینک بازیابی را با دیگران شریک نکنید. از تیم داروخانه کمک بخواهید.", "پټنوم یا د بېرته اخیستلو لینک له نورو سره مه شریکوئ. د درملتون له ډلې مرسته وغواړئ.")
      }
    ],
    action: { href: "/contact", label: copy("Contact", "تماس", "اړیکه") }
  }
} as const;
