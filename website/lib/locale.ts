export type Locale = "en" | "fa-AF" | "ps-AF";
export const locales: Locale[] = ["en", "fa-AF", "ps-AF"];
export function validLocale(value?: string): Locale { return locales.includes(value as Locale) ? value as Locale : "fa-AF"; }
const words = {
  home: ["Home", "خانه", "کور"], shop: ["Shop medicines", "فروشگاه دارو", "د درملو پلورنځی"],
  categories: ["Categories", "دسته‌بندی‌ها", "کټګورۍ"], manufacturers: ["Manufacturers", "تولیدکنندگان", "جوړوونکي"],
  search: ["Search medicines, vitamins and more…", "جستجوی دارو، ویتامین و محصولات…", "درمل، ویټامینونه او نور ولټوئ…"],
  searchButton: ["Search", "جستجو", "لټون"], account: ["My account", "حساب من", "زما حساب"],
  cart: ["Your cart", "سبد خرید", "ستاسو ټوکرۍ"], login: ["Sign in", "ورود", "ننوتل"], logout: ["Sign out", "خروج", "وتل"],
  register: ["Create account", "ایجاد حساب", "حساب جوړول"], rx: ["Upload prescription", "ارسال نسخه", "نسخه پورته کول"],
  rxList: ["My prescriptions", "نسخه‌های من", "زما نسخې"], health: ["Health & wellness", "سلامت و تندرستی", "روغتیا او هوساینه"],
  help: ["Help", "راهنما", "لارښود"], app: ["Get the app", "دریافت اپ", "اپ ترلاسه کړئ"],
  heroTitle: ["Your health, delivered simply.", "سلامتی شما، ساده‌تر از همیشه.", "ستاسو روغتیا، په اسانه توګه دررسېږي."],
  heroBody: ["Find medicines and everyday health essentials. Send your prescription for pharmacist review.", "دارو و محصولات صحی را بیابید. نسخه خود را برای بررسی فارمسیست بفرستید.", "درمل او ورځني روغتیایي توکي ومومئ. خپله نسخه د درملپوه د کتنې لپاره واستوئ."],
  heroKicker: ["Everyday care, closer to you", "مراقبت روزانه، نزدیک‌تر به شما", "ورځنۍ پاملرنه، تاسو ته نږدې"],
  haveRx: ["Have a prescription?", "نسخه دارید؟", "نسخه لرئ؟"],
  rxBody: ["Upload it for a private review by our pharmacy team.", "آن را برای بررسی محرمانه تیم داروخانه ارسال کنید.", "د درملتون د ډلې د محرمې کتنې لپاره یې پورته کړئ."],
  viewAll: ["View all", "مشاهده همه", "ټول وګورئ"], products: ["Medicines & essentials", "دارو و محصولات صحی", "درمل او روغتیایي توکي"],
  wellness: ["Everyday wellness", "تندرستی روزانه", "ورځنۍ هوساینه"], family: ["Care for home & family", "مراقبت از خانه و خانواده", "د کور او کورنۍ پاملرنه"],
  browse: ["Explore the catalogue", "دیدن فهرست محصولات", "د توکو لړ وګورئ"], about: ["About Darmalton", "درباره درملتون", "د درملتون په اړه"],
  story: ["Care, within reach.", "مراقبت، در دسترس شما.", "پاملرنه، ستاسو په لاس کې."],
  storyBody: ["Browse, send a prescription and keep your orders together in one place.", "محصولات را ببینید، نسخه بفرستید و سفارش‌ها را در یک جا پیگیری کنید.", "توکي وګورئ، نسخه واستوئ او خپل فرمایشونه په یوه ځای کې وساتئ."],
  privateRx: ["Private prescriptions", "نسخه‌های محرمانه", "محرمې نسخې"], cod: ["Cash on delivery", "پرداخت نقدی هنگام تحویل", "د سپارلو پر مهال نغدې پیسې"],
  orderHistory: ["Order history", "تاریخچه سفارش‌ها", "د فرمایشونو تاریخچه"], support: ["Customer help", "راهنمای مشتری", "د پېرودونکي لارښود"],
  contact: ["Contact", "تماس", "اړیکه"], faq: ["Frequently asked questions", "پرسش‌های متداول", "ډېرې پوښتل شوې پوښتنې"],
  privacy: ["Privacy policy", "حریم خصوصی", "د محرمیت تګلاره"], terms: ["Terms of use", "شرایط استفاده", "د کارولو شرایط"],
  delivery: ["Delivery & ordering", "تحویل و سفارش", "سپارل او فرمایش"], returns: ["Returns & cancellation", "بازگشت و لغو", "بېرته ستنول او لغوه کول"],
  footer: ["Your pharmacy, wherever you are.", "داروخانه شما، هر جا که باشید.", "ستاسو درملتون، هر چېرې چې یاست."],
  language: ["Language", "زبان", "ژبه"], menu: ["Menu", "منو", "مینو"], close: ["Close", "بستن", "تړل"],
  add: ["Add to cart", "افزودن به سبد", "ټوکرۍ ته زیاتول"], adding: ["Adding…", "در حال افزودن…", "زیاتېږي…"],
  outOfStock: ["Unavailable", "ناموجود", "نشته"], inStock: ["In stock", "موجود", "شته"],
  requiresRx: ["Prescription required", "نیازمند نسخه", "نسخې ته اړتیا لري"], details: ["View product", "مشاهده محصول", "توکی وګورئ"],
  price: ["Price", "قیمت", "بیه"], noPrice: ["Price not available", "قیمت ثبت نشده", "بیه نشته"], afn: ["AFN", "افغانی", "افغانۍ"],
  filters: ["Filters", "فیلترها", "چاڼونه"], allCategories: ["All categories", "همه دسته‌ها", "ټولې کټګورۍ"],
  sort: ["Sort by", "مرتب‌سازی", "ترتیب"], name: ["Name", "نام", "نوم"], priceLow: ["Price: low to high", "قیمت: کم به زیاد", "بیه: له ټیټې تر لوړې"],
  priceHigh: ["Price: high to low", "قیمت: زیاد به کم", "بیه: له لوړې تر ټیټې"], clear: ["Clear filters", "پاک کردن فیلترها", "چاڼونه پاک کړئ"],
  results: ["products", "محصول", "توکي"], next: ["Next", "بعدی", "بل"], previous: ["Previous", "قبلی", "مخکینی"],
  noResults: ["No products found", "محصولی پیدا نشد", "توکي ونه موندل شول"], trySearch: ["Try a shorter search or another category.", "عبارت کوتاه‌تر یا دسته دیگری را امتحان کنید.", "لنډه پلټنه یا بله کټګوري وکاروئ."],
  unavailable: ["Service unavailable", "خدمات در دسترس نیست", "خدمت نشته"], retry: ["Try again", "کوشش دوباره", "بیا هڅه وکړئ"],
  connection: ["Check your connection and try again.", "اتصال خود را بررسی و دوباره کوشش کنید.", "خپله اړیکه وګورئ او بیا هڅه وکړئ."],
  loading: ["Loading…", "در حال بارگذاری…", "بارېږي…"], emptyCart: ["Your cart is empty", "سبد خرید شما خالی است", "ستاسو ټوکرۍ تشه ده"],
  continueShopping: ["Continue shopping", "ادامه خرید", "پېرود ته دوام ورکړئ"], remove: ["Remove", "حذف", "لرې کول"],
  removeConfirm: ["Remove this item?", "این محصول حذف شود؟", "دا توکی لرې شي؟"], cancel: ["Cancel", "لغو", "لغوه"],
  quantity: ["Quantity", "تعداد", "شمېر"], subtotal: ["Subtotal", "مجموع محصولات", "د توکو ټولټال"], total: ["Total", "مجموع", "ټولټال"],
  summary: ["Order summary", "خلاصه سفارش", "د فرمایش لنډیز"], checkout: ["Checkout", "ثبت سفارش", "فرمایش ثبتول"],
  finalPrice: ["Final price and availability are confirmed when you place your order.", "قیمت و موجودی هنگام ثبت نهایی سفارش تأیید می‌شود.", "وروستۍ بیه او موجودي د فرمایش پر مهال تاییدېږي."],
  guestCart: ["Your guest cart is saved on this device. Sign in at checkout to sync it.", "سبد مهمان روی این دستگاه ذخیره می‌شود. برای همگام‌سازی هنگام پرداخت وارد شوید.", "ستاسو ټوکرۍ په دې وسیله ساتل کېږي. د همغږۍ لپاره د فرمایش پر مهال ننوځئ."],
  address: ["Delivery address", "آدرس تحویل", "د سپارلو پته"], addresses: ["Saved addresses", "آدرس‌های ذخیره‌شده", "ساتل شوې پتې"],
  newAddress: ["Add address", "افزودن آدرس", "پته زیاتول"], editAddress: ["Edit address", "ویرایش آدرس", "پته سمول"],
  recipient_name: ["Recipient name", "نام تحویل‌گیرنده", "د اخیستونکي نوم"], recipient_phone: ["Phone number", "شماره تماس", "د اړیکې شمېره"],
  province: ["Province", "ولایت", "ولایت"], city: ["City", "شهر", "ښار"], district: ["District", "ناحیه", "ناحیه"],
  street_address: ["Street address", "آدرس دقیق", "کره پته"], landmark: ["Nearby landmark", "نشانی نزدیک", "نږدې نښه"],
  label: ["Address label", "عنوان آدرس", "د پتې نوم"], defaultAddress: ["Default address", "آدرس اصلی", "اصلي پته"],
  save: ["Save", "ذخیره", "ساتل"], saved: ["Saved", "ذخیره شد", "وساتل شو"], edit: ["Edit", "ویرایش", "سمول"],
  payment: ["Payment", "پرداخت", "تادیه"], reviewItems: ["Review items", "بررسی محصولات", "توکي وګورئ"],
  placeOrder: ["Place order", "ثبت نهایی سفارش", "فرمایش ثبت کړئ"], orderReceived: ["Order received", "سفارش دریافت شد", "فرمایش ترلاسه شو"],
  order: ["Order", "سفارش", "فرمایش"], orders: ["My orders", "سفارش‌های من", "زما فرمایشونه"], noOrders: ["No orders yet", "هنوز سفارشی ندارید", "تر اوسه فرمایش نشته"],
  profile: ["Profile", "پروفایل", "پېژندپاڼه"], first_name: ["First name", "نام", "نوم"], last_name: ["Last name", "نام خانوادگی", "تخلص"],
  email: ["Email", "ایمیل", "برېښنالیک"], password: ["Password", "رمز عبور", "پټنوم"], phone: ["Phone", "شماره تماس", "شمېره"],
  signInCheckout: ["Sign in to continue checkout", "برای ادامه سفارش وارد شوید", "د فرمایش لپاره ننوځئ"],
  authBody: ["Keep your orders, addresses and prescriptions together.", "سفارش‌ها، آدرس‌ها و نسخه‌های خود را یک جا نگه دارید.", "فرمایشونه، پتې او نسخې په یوه ځای کې وساتئ."],
  forgot: ["Forgot password", "فراموشی رمز عبور", "پټنوم هېر شوی"], reset: ["Reset password", "بازنشانی رمز عبور", "پټنوم بدلول"],
  noAccount: ["New to Darmalton?", "در درملتون حساب ندارید؟", "په درملتون کې نوي یاست؟"], haveAccount: ["Already have an account?", "حساب دارید؟", "حساب لرئ؟"],
  notifications: ["Notifications", "اعلان‌ها", "خبرتیاوې"], noNotifications: ["No notifications", "اعلانی ندارید", "خبرتیا نشته"],
  markRead: ["Mark as read", "علامت‌گذاری خوانده‌شده", "لوستل شوې وټاکئ"], markAllRead: ["Mark all as read", "همه خوانده شد", "ټولې لوستل شوې وټاکئ"],
  status: ["Status", "وضعیت", "حالت"], date: ["Date", "تاریخ", "نېټه"], view: ["View", "مشاهده", "کتل"],
  noRx: ["No prescriptions yet", "هنوز نسخه‌ای ندارید", "تر اوسه نسخه نشته"], rxSuccess: ["Prescription submitted", "نسخه ارسال شد", "نسخه واستول شوه"],
  rxPrivate: ["Only you and the authorized pharmacy team can access your prescription.", "فقط شما و تیم مجاز داروخانه به نسخه دسترسی دارید.", "یوازې تاسو او د درملتون مجازه ډله ستاسو نسخې ته لاسرسی لري."],
  chooseFile: ["Choose a photo or document", "انتخاب عکس یا فایل", "انځور یا سند وټاکئ"], uploadHint: ["JPG, PNG or PDF up to 10 MB", "JPG، PNG یا PDF تا ۱۰ مگابایت", "JPG، PNG یا PDF تر ۱۰ مېګابایټه"],
  patient: ["Patient name", "نام مریض", "د ناروغ نوم"], notes: ["Notes", "یادداشت", "یادښتونه"], optional: ["Optional", "اختیاری", "اختیاري"],
  submitRx: ["Submit for review", "ارسال برای بررسی", "د کتنې لپاره لېږل"], file: ["View document", "مشاهده فایل", "سند وګورئ"],
  response: ["Your response", "پاسخ شما", "ستاسو ځواب"], send: ["Send", "ارسال", "لېږل"], authorized: ["Approved medicines", "داروهای تأییدشده", "تایید شوي درمل"],
  addBundle: ["Add approved medicines to cart", "افزودن داروهای تأییدشده به سبد", "تایید شوي درمل ټوکرۍ ته زیات کړئ"],
  noArticles: ["No articles published yet", "هنوز مقاله‌ای منتشر نشده است", "تر اوسه لیکنه نه ده خپره شوې"],
  pack: ["Pack size", "اندازه بسته", "د بستې اندازه"], strength: ["Strength", "مقدار", "قوت"], form: ["Dosage form", "شکل دارو", "د درملو بڼه"],
  ingredient: ["Generic / ingredient", "نام علمی / ترکیب", "عمومي نوم / ترکیب"], description: ["Product information", "معلومات محصول", "د توکي معلومات"],
  storage: ["Storage instructions", "شرایط نگهداری", "د ساتنې لارښوونې"], unspecified: ["Not supplied", "ثبت نشده", "نه دي ورکړل شوي"],
  related: ["More medicines", "داروهای دیگر", "نور درمل"], notFound: ["We can’t find that page", "این صفحه پیدا نشد", "دا پاڼه ونه موندل شوه"],
  variantsAvailable: ["strengths available", "قدرت موجود", "قوتونه شته"],
  chooseStrength: ["Choose strength", "انتخاب قدرت", "قوت وټاکئ"],
  shopperCategories: ["Shop by category", "خرید بر اساس دسته", "د کټګورۍ له مخې پېرود"],
  healthNeeds: ["Browse by health need", "مرور بر اساس نیاز صحی", "د روغتیا اړتیا له مخې وګورئ"],
  popularMedicines: ["Popular medicines", "داروهای پرطرفدار", "مشهور درمل"],
  vitaminsSupplements: ["Vitamins & supplements", "ویتامین‌ها و مکمل‌ها", "ویټامینونه او بشپړوونکي"],
  personalFamilyCare: ["Personal & family care", "مراقبت شخصی و خانواده", "شخصي او کورنۍ پاملرنه"],
  generalError: ["Something went wrong", "مشکلی پیش آمد", "ستونزه رامنځته شوه"], backHome: ["Back to home", "بازگشت به خانه", "کور ته ستنېدل"],
  cmsContext: ["Darmalton information", "معلومات درملتون", "د درملتون معلومات"],
  articleContext: ["Health article", "مقاله سلامت", "روغتیایي لیکنه"],
  missingArticle: ["Article not found", "مقاله پیدا نشد", "لیکنه ونه موندل شوه"],
  missingArticleBody: ["This article is not available. You can return to the published articles list.", "این مقاله در دسترس نیست. می‌توانید به فهرست مقاله‌های منتشرشده برگردید.", "دا لیکنه نشته. د خپرو شویو لیکنو لړ ته ستنېدلی شئ."],
  missingCms: ["Content page not found", "صفحه معلوماتی پیدا نشد", "معلوماتي پاڼه ونه موندل شوه"],
  missingCmsBody: ["This content page is not available. Return home to continue browsing.", "این صفحه معلوماتی در دسترس نیست. برای ادامه به خانه برگردید.", "دا معلوماتي پاڼه نشته. د دوام لپاره کور ته ستانه شئ."],
  android: ["Download Android", "دانلود اندروید", "اندروید ښکته کړئ"], ios: ["iOS is not released yet", "نسخه iOS هنوز منتشر نشده", "د iOS نسخه لا نه ده خپره شوې"],
  appTitle: ["Darmalton on your phone", "درملتون در تلفن شما", "درملتون ستاسو په ټیلیفون کې"],
  rxHelp: ["How prescription upload works", "راهنمای ارسال نسخه", "د نسخې پورته کولو لارښود"],
  secure: ["Protected account", "حساب محافظت‌شده", "خوندي حساب"], offline: ["You are offline. Reconnect before placing an order.", "آفلاین هستید. پیش از ثبت سفارش وصل شوید.", "تاسو افلاین یاست. د فرمایش مخکې وصل شئ."],
  minimum: ["Minimum price", "حداقل قیمت", "لږ تر لږه بیه"], maximum: ["Maximum price", "حداکثر قیمت", "تر ټولو لوړه بیه"],
  noRxRequired: ["No prescription required", "بدون نیاز به نسخه", "نسخې ته اړتیا نشته"],
  location: ["Use my location", "استفاده از موقعیت من", "زما موقعیت وکاروئ"],
  resetUnavailable: ["Email password recovery is not configured for this local environment. Contact the pharmacy team for account help.", "بازیابی رمز با ایمیل در این محیط محلی تنظیم نشده است. برای کمک با تیم داروخانه تماس بگیرید.", "په دې محلي چاپېریال کې د برېښنالیک له لارې د پټنوم بېرته ترلاسه کول نه دي تنظیم شوي. د مرستې لپاره د درملتون له ډلې سره اړیکه ونیسئ."],
} as const;
export type TextKey = keyof typeof words;
export function textFor(locale: Locale, key: TextKey): string { return words[key][locale === "en" ? 0 : locale === "fa-AF" ? 1 : 2]; }
const easternArabicDigits = "۰۱۲۳۴۵۶۷۸۹";
export function formatNumber(value: number | string, locale: Locale) {
  const numeric = Number(value);
  const raw = Number.isFinite(numeric) ? String(numeric) : String(value);
  const [integer, fraction] = raw.split(".");
  const sign = integer.startsWith("-") ? "-" : "";
  const digits = sign ? integer.slice(1) : integer;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const ascii = `${sign}${grouped}${fraction === undefined ? "" : `.${fraction}`}`;
  return locale === "en" ? ascii : ascii.replace(/\d/g, digit => easternArabicDigits[Number(digit)]);
}
export function formatMoney(value: string | null, locale: Locale) { return value === null ? textFor(locale,"noPrice") : `${formatNumber(value,locale)} ${textFor(locale,"afn")}`; }
export function formatDateTime(value: string, locale: Locale, options?: Intl.DateTimeFormatOptions) {
  const date = new Date(value);
  if (locale !== "ps-AF") return date.toLocaleString(locale, options);
  // Pashto is absent from some browser ICU bundles. Numeric Gregorian dates
  // avoid falling back to English month names and AM/PM in account history.
  return date.toLocaleString("en-GB", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
    ...(options?.timeStyle === "short" ? {} : { second: "2-digit" }),
    hourCycle: "h23", timeZone: options?.timeZone
  }).replace(/\d/g, digit => easternArabicDigits[Number(digit)]);
}
export function productName(m: {brand_name: string; brand_name_dari: string; brand_name_pashto?: string}, locale: Locale) {
  if (locale === "en") return m.brand_name;
  if (locale === "ps-AF") return m.brand_name_pashto || m.brand_name_dari || m.brand_name;
  return m.brand_name_dari || m.brand_name;
}
