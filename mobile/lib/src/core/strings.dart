abstract final class DariStrings {
  static String _languageCode = 'fa';
  static String sanitizeLanguageCode(String? languageCode) =>
      languageCode == 'en' ? 'en' : 'fa';

  static void configure(String languageCode) {
    _languageCode = sanitizeLanguageCode(languageCode);
  }

  static bool get isEnglish => _languageCode == 'en';
  static String t(String dari, String english) => isEnglish ? english : dari;
  static String tForLanguage(
    String? languageCode,
    String dari,
    String english,
  ) => sanitizeLanguageCode(languageCode) == 'en' ? english : dari;
  static String translateForLanguage(String? languageCode, String value) =>
      sanitizeLanguageCode(languageCode) == 'en'
      ? (_english[value] ?? value)
      : value;
  static String translate(String value) =>
      translateForLanguage(_languageCode, value);

  static const Map<String, String> _english = {
    'خانه': 'Home',
    'دسته‌بندی': 'Categories',
    'دسته‌بندی‌ها': 'Categories',
    'سفارش‌های من': 'My orders',
    'سبد خرید': 'Cart',
    'حساب کاربری': 'Account',
    'تنظیمات': 'Settings',
    'جستجو': 'Search',
    'پروفایل': 'Profile',
    'نام': 'First name',
    'نام خانوادگی': 'Last name',
    'ایمیل': 'Email',
    'شماره تماس': 'Phone number',
    'شماره تماس (اختیاری)': 'Phone number (optional)',
    'رمز عبور': 'Password',
    'ورود': 'Sign in',
    'ایجاد حساب': 'Create account',
    'خروج': 'Sign out',
    'انصراف': 'Cancel',
    'لغو': 'Cancel',
    'تأیید': 'Confirm',
    'حذف': 'Delete',
    'ویرایش': 'Edit',
    'ذخیره': 'Save',
    'بستن': 'Close',
    'ادامه': 'Continue',
    'تلاش': 'Retry',
    'تلاش دوباره': 'Retry',
    'مشاهده همه': 'See all',
    'افزودن به سبد': 'Add to cart',
    'ناموجود': 'Unavailable',
    'موجود در انبار': 'In stock',
    'در حال بارگذاری...': 'Loading...',
    'تنظیمات حساب': 'Account settings',
    'حساب و امنیت': 'Account and security',
    'پروفایل و شماره تماس': 'Profile and phone number',
    'آدرس‌ها': 'Addresses',
    'آدرس‌های من': 'My addresses',
    'آدرس تحویل': 'Delivery address',
    'آدرس جدید': 'New address',
    'ویرایش آدرس': 'Edit address',
    'نام آدرس': 'Address label',
    'نام گیرنده': 'Recipient name',
    'ولایت': 'Province',
    'شهر': 'City',
    'ناحیه یا ولسوالی': 'District',
    'آدرس دقیق': 'Street address',
    'نشانی نزدیک': 'Landmark',
    'راهنمای تحویل': 'Delivery instructions',
    'موقعیت فعلی': 'Current location',
    'موقعیت دستگاه ثبت شد': 'Device location attached',
    'موقعیت تحویل ثبت شد': 'Delivery location attached',
    'انتخاب روی نقشه': 'Select on map',
    'انتخاب موقعیت روی نقشه': 'Select location on map',
    'برای جابه‌جایی نشان، نقطهٔ مورد نظر را لمس کنید.':
        'Tap the map to move the pin.',
    'استفاده از این موقعیت': 'Use this location',
    'حذف موقعیت': 'Remove location',
    'آدرس تحویل را انتخاب کنید': 'Select a delivery address',
    'افزودن آدرس تحویل': 'Add a delivery address',
    'پرداخت': 'Checkout',
    'روش تحویل': 'Delivery method',
    'روش پرداخت': 'Payment method',
    'تحویل استاندارد': 'Standard delivery',
    'هنگام تحویل': 'Cash on delivery',
    'ثبت سفارش': 'Place order',
    'خلاصه سفارش': 'Order summary',
    'هزینه ارسال': 'Delivery fee',
    'تخفیف': 'Discount',
    'مجموع فعلی': 'Current total',
    'بازگشت': 'Back',
    'تأیید و ثبت': 'Confirm and place order',
    'سفارش‌ها': 'Orders',
    'جزئیات سفارش': 'Order details',
    'پیگیری سفارش': 'Track order',
    'مبلغ کل': 'Total',
    'وضعیت فعلی': 'Current status',
    'محصولات سفارش': 'Order items',
    'تاریخچه سفارش': 'Order history',
    'جزئیات بیشتر': 'More details',
    'پیک اختصاص نیافته': 'Courier not assigned',
    'نسخه‌های من': 'My prescriptions',
    'ارسال نسخه': 'Upload prescription',
    'افزودن نسخه': 'Add prescription',
    'عکس گرفتن': 'Take a photo',
    'انتخاب از گالری': 'Choose from gallery',
    'انتخاب فایل': 'Choose a file',
    'افزودن عکس یا فایل نسخه': 'Add a prescription photo or file',
    'عکس دوباره': 'Retake photo',
    'ارسال برای بررسی': 'Submit for review',
    'در حال ارسال...': 'Uploading...',
    'نام مریض (اختیاری)': 'Patient name (optional)',
    'یادداشت (اختیاری)': 'Note (optional)',
    'تاریخچه نسخه‌ها': 'Prescription history',
    'توضیح مورد نیاز را بنویسید...': 'Write the requested clarification...',
    'ارسال پاسخ': 'Send response',
    'افزودن محصول مجاز': 'Add authorized product',
    'فیلترها': 'Filters',
    'فیلتر محصولات': 'Product filters',
    'فقط محصولات موجود': 'In-stock products only',
    'نیاز به نسخه': 'Prescription requirement',
    'همه': 'All',
    'بدون نسخه': 'No prescription',
    'نسخه‌ای': 'Prescription required',
    'تولیدکننده': 'Manufacturer',
    'حداقل قیمت': 'Minimum price',
    'حداکثر قیمت': 'Maximum price',
    'اعمال فیلتر': 'Apply filters',
    'نام محصول': 'Product name',
    'قیمت: کم به زیاد': 'Price: low to high',
    'قیمت: زیاد به کم': 'Price: high to low',
    'پاک کردن': 'Clear',
    'نمایش رمز': 'Show password',
    'پنهان کردن رمز': 'Hide password',
    'کد تخفیف': 'Promotion code',
    'این بخش الزامی است.': 'This field is required.',
    'پاک کردن فیلترها': 'Clear filters',
    'نتیجه‌ای پیدا نشد': 'No results found',
    'زبان برنامه': 'App language',
    'زبان و خوانایی': 'Language and readability',
    'متن بزرگ‌تر': 'Larger text',
    'کاهش حرکت': 'Reduce motion',
    'اعلان‌ها': 'Notifications',
    'تصاویر محصولات': 'Product images',
    'جستجوهای اخیر': 'Recent searches',
    'حافظه برنامه': 'App storage',
    'پاک‌کردن کش': 'Clear cache',
    'امنیت و رمز عبور': 'Security and password',
    'مرکز کمک': 'Help center',
    'درباره درملتون': 'About Darmalton',
    'شرایط استفاده': 'Terms of use',
    'حریم خصوصی': 'Privacy',
    'تماس با ما': 'Contact us',
    'ویرایش پروفایل': 'Edit profile',
    'معلومات حساب': 'Account information',
    'ذخیره تغییرات': 'Save changes',
    'تغییر رمز عبور': 'Change password',
    'رمز فعلی': 'Current password',
    'رمز جدید': 'New password',
    'تکرار رمز جدید': 'Confirm new password',
    'غیرفعال‌کردن حساب': 'Deactivate account',
    'محصولی موجود نیست': 'No products are available',
    'دواهای پرطرفدار': 'Popular medicines',
    'پیشنهادهای امروز': "Today's picks",
    'ادامه خرید': 'Continue shopping',
    'برندها': 'Brands',
    'مقالات سلامتی': 'Health articles',
    'خدمات درملتون': 'Darmalton services',
    'ورود به حساب': 'Sign in',
    'برای ادامه وارد حساب شوید': 'Sign in to continue',
    'برای ادامه کار قبلی وارد حساب شوید؛ پس از ورود به همان بخش برمی‌گردید.':
        'Sign in to continue; you will return to the same place.',
    'خوش آمدید': 'Welcome',
    'برای خرید دوا و پیگیری سفارش‌های خود وارد شوید.':
        'Sign in to buy medicines and track your orders.',
    'یک ایمیل معتبر وارد کنید.': 'Enter a valid email address.',
    'رمز عبور حداقل ۸ نویسه باشد.': 'Password must be at least 8 characters.',
    'رمز عبور را فراموش کرده‌اید؟': 'Forgot your password?',
    'در حال ورود...': 'Signing in...',
    'یا': 'or',
    'ادامه با گوگل': 'Continue with Google',
    'ورود با گوگل در این نسخه تنظیم نشده است.':
        'Google sign-in is not configured in this build.',
    'ایجاد حساب کاربری': 'Create an account',
    'ادامه بدون ورود': 'Continue without signing in',
    'تشخیص اتصال توسعه': 'Development connection diagnostics',
    'با ورود، استفاده از معلومات شخصی صرفاً برای انجام سفارش پذیرفته می‌شود.':
        'By signing in, you agree that personal information is used only to fulfil your orders.',
    'حساب کاربری خود را بسازید': 'Create your account',
    'برای ثبت سفارش، آدرس و شماره تماس معتبر وارد کنید.':
        'Enter a valid address and phone number to place orders.',
    'در حال ایجاد حساب...': 'Creating account...',
    'ایجاد حساب با گوگل': 'Create account with Google',
    'قبلاً حساب دارید؟ ورود': 'Already have an account? Sign in',
    'ادامه بدون ایجاد حساب': 'Continue without creating an account',
    'داروخانه آنلاین شما': 'Your online pharmacy',
    'مرور محصولات آزاد است؛ این بخش به معلومات شخصی حساب شما نیاز دارد.':
        'Browsing is open; this section needs your personal account information.',
    'بازگشت به خانه': 'Back to Home',
    'برای خروج، دکمه برگشت را دوباره فشار دهید.': 'Press Back again to exit.',
    'ارتباط با درملتون برقرار نشد': 'Could not connect to Darmalton',
    'آفلاین': 'Offline',
    'آفلاین. قیمت و موجودی تا اتصال دوباره نمایش داده نمی‌شود.':
        'Offline. Price and stock are hidden until you reconnect.',
    'آفلاین؛ قیمت و موجودی زنده در دسترس نیست.':
        'Offline; live price and stock are unavailable.',
    'بستن پیام آفلاین': 'Dismiss offline message',
    'تلاش و کشف دوباره': 'Retry and rediscover',
    'تصویر عمومی دوا': 'Generic medicine image',
    'دوای درملتون': 'Darmalton medicine',
    'برندهای برتر': 'Top brands',
    'پیشنهاد برای شما': 'Recommended for you',
    'مقاله‌های سلامت': 'Health articles',
    'مقاله‌های سلامت دریافت نشد.': 'Health articles could not be loaded.',
    'هنوز مقاله سلامت منتشر نشده است.':
        'No health articles have been published yet.',
    'محصولاتی که اخیراً دیدید': 'Recently viewed products',
    'محصولات معتبر': 'Trusted products',
    'محصولات مراقبتی': 'Care products',
    'پیشنهاد امروز': "Today's recommendation",
    'برای نیازهای روزمره': 'For everyday needs',
    'آمادگی برای فصل حساسیت': 'Prepare for allergy season',
    'مشاهده محصولات حساسیت': 'View allergy products',
    'بررسی امن توسط فارمسست': 'Reviewed safely by a pharmacist',
    'پرداخت امن': 'Secure payment',
    'کنترل کیفیت': 'Quality controlled',
    'تولیدکنندگان موجود': 'Available manufacturers',
    'قیمت زنده از سرور': 'Live server price',
    'موجودی دقیق': 'Accurate stock',
    'نیازمند توضیح': 'Clarification required',
    'دواهای تأییدشده': 'Authorized medicines',
    'نخست عکس یا فایل نسخه را انتخاب کنید.':
        'Choose a prescription photo or file first.',
    'نسخه با موفقیت ارسال شد و در صف بررسی قرار گرفت.':
        'Your prescription was submitted for review.',
    'هنوز نسخه‌ای ندارید': 'You do not have any prescriptions yet',
    'پس از ارسال، وضعیت بررسی در همین‌جا نمایش داده می‌شود.':
        'Its review status will appear here after submission.',
    'لغو درخواست': 'Cancel request',
    'پاسخ به فارمسست': 'Reply to pharmacist',
    'یادداشت فارمسست': 'Pharmacist note',
    'منقضی‌شده': 'Expired',
    'ارسال‌شده': 'Submitted',
    'در حال بررسی': 'Under review',
    'تأییدشده': 'Approved',
    'ردشده': 'Rejected',
    'لغوشده': 'Cancelled',
    'در حال دریافت آدرس...': 'Loading addresses...',
    'آدرسی ثبت نشده است': 'No address has been added',
    'یک آدرس دستی یا موقعیت فعلی خود را اضافه کنید.':
        'Add a manual address or your current location.',
    'افزودن آدرس': 'Add address',
    'انتخاب آدرس تحویل': 'Select delivery address',
    'انتخاب، افزودن و ویرایش': 'Select, add, and edit',
    'آفلاین هستید؛ آدرس‌های ذخیره‌شده قابل انتخاب‌اند، اما افزودن و ویرایش پس از اتصال فعال می‌شود.':
        'You are offline. Saved addresses can be selected; adding and editing resume after reconnection.',
    'خدمات موقعیت دستگاه خاموش است.':
        'Device location services are turned off.',
    'اجازهٔ موقعیت داده نشد. می‌توانید آدرس را دستی وارد کنید.':
        'Location permission was denied. You can enter the address manually.',
    'موقعیت فعلی دریافت نشد. دوباره تلاش کنید.':
        'Current location could not be obtained. Try again.',
    'حذف آدرس': 'Delete address',
    'در حال ذخیره…': 'Saving…',
    'ادامه به پرداخت': 'Continue to checkout',
    'سبد خرید شما خالی است': 'Your cart is empty',
    'محصول مورد نیازتان را پیدا کنید و به سبد بیفزایید.':
        'Find the product you need and add it to your cart.',
    'پس از افزودن محصولات، این بخش به‌روز می‌شود.':
        'This section updates after you add products.',
    'حذف از سبد خرید؟': 'Remove from cart?',
    'مشاهده سبد': 'View cart',
    'برای ادامه، یک آدرس معتبر تحویل اضافه کنید.':
        'Add a valid delivery address to continue.',
    'پرداخت هنگام تحویل': 'Cash on delivery',
    'اطلاعات شما محفوظ است و مبلغ را هنگام تحویل می‌پردازید.':
        'Your information is protected and you pay on delivery.',
    'آدرس و پرداخت هنگام تحویل تأیید است؟ قیمت و موجودی نهایی توسط سرور بررسی می‌شود.':
        'Confirm the address and cash on delivery? Final price and stock are checked by the server.',
    'مبلغ قطعی در پاسخ ثبت سفارش برگردانده می‌شود.':
        'The final amount is returned by the order response.',
    'زمان تحویل پس از تأیید سفارش مشخص می‌شود':
        'Delivery time is confirmed after the order is accepted',
    'توسط سرور محاسبه می‌شود': 'Calculated by the server',
    'در مرحله پرداخت': 'At checkout',
    'شماره سفارش': 'Order number',
    'روند سفارش': 'Order progress',
    'زمان تحویل': 'Delivery time',
    'پس از تأیید داروخانه': 'After pharmacy confirmation',
    'منتظر به‌روزرسانی': 'Awaiting update',
    'روش مصرف': 'Directions',
    'ترکیبات': 'Ingredients',
    'توضیحات': 'Description',
    'نوع محصول': 'Product type',
    'قدرت': 'Strength',
    'بسته‌بندی': 'Package',
    'تعداد': 'Quantity',
    'خرید فوری': 'Buy now',
    'موجودی و قیمت نهایی در مرحله پرداخت دوباره بررسی می‌شود.':
        'Final stock and price are checked again at checkout.',
    'جستجوهای اخیر:': 'Recent searches:',
    'پاک‌کردن جستجوهای اخیر': 'Clear recent searches',
    'عبارت کوتاه‌تر یا دسته‌بندی دیگری را امتحان کنید.':
        'Try a shorter search or another category.',
    'محدوده قیمت را درست وارد کنید.': 'Enter a valid price range.',
    'افزودن به علاقه‌مندی‌ها': 'Add to favorites',
    'حذف از علاقه‌مندی‌ها': 'Remove from favorites',
    '· نسخه‌ای': '· Prescription required',
    'همه سفارش‌ها': 'All orders',
    'جاری': 'Active',
    'تکمیل‌شده': 'Completed',
    'سفارش جاری ندارید': 'You have no active orders',
    'سفارش تکمیل‌شده ندارید': 'You have no completed orders',
    'سفارش لغوشده ندارید': 'You have no cancelled orders',
    'سفارش‌های مرتبط با این وضعیت در اینجا نمایش داده می‌شود.':
        'Orders with this status appear here.',
    'جزئیات': 'Details',
    'پیگیری': 'Track',
    'پرداخت‌شده': 'Paid',
    'پرداخت‌نشده': 'Unpaid',
    'ثبت شده': 'Placed',
    'تأیید شده': 'Confirmed',
    'در حال آماده‌سازی': 'Preparing',
    'آماده تحویل': 'Ready for delivery',
    'در حال ارسال': 'Out for delivery',
    'تحویل شده': 'Delivered',
    'لغو شده': 'Cancelled',
    'رد شده': 'Rejected',
    'جمع محصولات': 'Products subtotal',
    'مبلغ نهایی': 'Final total',
    'ارتباط با داروخانه برقرار نشد. اینترنت خود را بررسی و دوباره کوشش کنید.':
        'Could not reach the pharmacy. Check your internet connection and try again.',
    'مشکلی رخ داد. دوباره کوشش کنید.': 'Something went wrong. Try again.',
    'تنظیمات ورود با گوگل کامل نیست. با پشتیبانی تماس بگیرید.':
        'Google sign-in is not fully configured. Contact support.',
    'ورود با گوگل انجام نشد. دوباره کوشش کنید.':
        'Google sign-in failed. Try again.',
    'ورود با گوگل در این دستگاه پشتیبانی نمی‌شود.':
        'Google sign-in is not supported on this device.',
    'ورود با گوگل لغو شد.': 'Google sign-in was cancelled.',
    'گوگل معلومات معتبر ورود را برنگرداند. دوباره کوشش کنید.':
        'Google did not return valid sign-in information. Try again.',
    'شماره معتبر افغانستان را مانند +93 700 123 456 وارد کنید.':
        'Enter a valid Afghan number, such as +93 700 123 456.',
    'برای ذخیره و انتخاب آدرس تحویل وارد حساب شوید.':
        'Sign in to save and select a delivery address.',
    'کارهای آدرس': 'Address actions',
    'خیر': 'No',
    'مبلغ فعلی': 'Current amount',
    'مشاهده محصولات': 'View products',
    '۰ افغانی': 'AFN 0',
    'با ایجاد حساب، سبد شما حفظ می‌شود و می‌توانید سفارش و نسخه‌های خود را پیگیری کنید.':
        'Create an account to keep your cart and track orders and prescriptions.',
    'بعداً': 'Later',
    'تأیید هنگام سفارش': 'Confirmed when ordering',
    'محصولات حساسیت و تنفسی را ببینید؛ برای علایم شدید با داکتر مشوره کنید.':
        'Browse allergy and respiratory products; consult a doctor for severe symptoms.',
    'مراقبت پوست': 'Skin care',
    'ویتامین‌ها و مکمل‌ها': 'Vitamins and supplements',
    'پرفروش‌ترین': 'Best selling',
    'این مطلب آموزشی است و جای مشوره داکتر یا فارمسست را نمی‌گیرد.':
        'This article is educational and does not replace advice from a doctor or pharmacist.',
    'ارسال نسخه برای بررسی': 'Submit prescription for review',
    'اشتراک‌گذاری': 'Share',
    'اشتراک‌گذاری در نسخه بعدی فعال می‌شود.':
        'Sharing will be available in a future release.',
    'برای معلومات شخصی با داکتر یا فارمسست مشوره کنید.':
        'Consult a doctor or pharmacist for personal medical advice.',
    'ترکیبات این محصول در کاتالوگ نمایشی ثبت نشده است.':
        'Ingredients have not been provided for this product.',
    'ثبت نشده': 'Not provided',
    'در صورت حساسیت، بارداری یا مصرف دوای دیگر، پیش از خرید مشوره بگیرید.':
        'If you have allergies, are pregnant, or take other medicines, seek advice before buying.',
    'روش مصرف باید مطابق نسخه یا راهنمای تأییدشده محصول باشد.':
        'Use only as prescribed or according to approved product guidance.',
    'معلومات ثبت نشده': 'Information not provided',
    'افغانی': 'AFN',
    'دنبال دوا، محصول یا دسته‌بندی بگردید...':
        'Search medicines, products, or categories...',
    'زمان تحویل پس از تأیید داروخانه مشخص می‌شود.':
        'Delivery time is confirmed after pharmacy approval.',
    'مدیریت آدرس‌ها': 'Manage addresses',
    'پرداخت آنلاین': 'Online payment',
    'پرداخت از موجودی کیف پول': 'Pay from wallet balance',
    'پرداخت نقدی در زمان دریافت سفارش': 'Pay cash when the order is delivered',
    'کارت بانکی': 'Bank card',
    'کیف پول': 'Wallet',
    'اطلاعات پیک و تماس در این نسخه پشتیبانی نمی‌شود.':
        'Courier and contact information are not available in this release.',
    'حجم نسخه باید کمتر از ۱۰ مگابایت باشد.':
        'The prescription file must be smaller than 10 MB.',
    'فقط فایل‌های JPG، PNG یا PDF پذیرفته می‌شود.':
        'Only JPG, PNG, or PDF files are accepted.',
    'JPG، PNG یا PDF تا ۱۰ مگابایت': 'JPG, PNG, or PDF up to 10 MB',
    'اجازه دسترسی داده نشد. از تنظیمات دستگاه اجازه دوربین یا گالری را فعال کنید.':
        'Permission was denied. Enable camera or gallery access in device settings.',
    'سبد': 'Cart',
    'عکس دریافت نشد. دوباره تلاش کنید.':
        'The photo could not be captured. Try again.',
    'فایل خصوصی می‌ماند و فقط شما و تیم مجاز داروخانه آن را می‌بینید.':
        'The file stays private and is visible only to you and authorized pharmacy staff.',
    'نسخه داکتر خود را ارسال کنید': 'Upload your doctor\'s prescription',
    'نسخه مشتری': 'Customer prescription',
    'از حساب خارج شده‌اید': 'You are signed out',
    'برای مشاهده حساب کاربری دوباره وارد شوید.':
        'Sign in again to view your account.',
    'خروج از حساب': 'Sign out',
    'می‌خواهید از حساب کاربری خود خارج شوید؟':
        'Do you want to sign out of your account?',
    'نسخه نمایشی فروشگاه آنلاین دوا با قیمت و موجودی کنترل‌شده توسط سرور.':
        'Online pharmacy demo with server-controlled prices and stock.',
    'معلومات پروفایل ذخیره شد.': 'Profile information was saved.',
    'نام را وارد کنید.': 'Enter a first name.',
    'نام خانوادگی را وارد کنید.': 'Enter a last name.',
    'امنیت حساب': 'Account security',
    'ایمیل حساب برای امنیت از داخل برنامه تغییر نمی‌کند.':
        'For security, the account email cannot be changed in the app.',
    'رمز فعلی را وارد کنید.': 'Enter your current password.',
    'رمز جدید باید حداقل هشت حرف باشد.':
        'The new password must be at least eight characters.',
    'دو رمز جدید یکسان نیست.': 'The new passwords do not match.',
    'رمز عبور با موفقیت تغییر کرد.': 'Password changed successfully.',
    'رمز عبور جدید': 'New password',
    'رمز عبور فعلی': 'Current password',
    'غیرفعال': 'Disabled',
    'غیرفعال‌کردن': 'Deactivate',
    'ورود بایومتریک': 'Biometric sign-in',
    'یک رمز یکتا و حداقل هشت‌حرفی انتخاب کنید.':
        'Choose a unique password with at least eight characters.',
    'تغییر رمز و غیرفعال‌کردن حساب': 'Change password or deactivate account',
    'حریم خصوصی و داده': 'Privacy and data',
    'اعلان و حافظه': 'Notifications and storage',
    'اعلان‌های برنامه': 'App notifications',
    'انتخاب‌های این دستگاه؛ وضعیت زنده از سرور می‌آید.':
        'Device preferences; live status comes from the server.',
    'حرکت صفحه‌ها و تصویرها را محدود می‌کند.':
        'Limits screen and image motion.',
    'خوانایی متن‌های اصلی را افزایش می‌دهد.':
        'Improves readability of primary text.',
    'درملتون به‌صورت پیش‌فرض دری و راست‌به‌چپ است.':
        'Darmalton defaults to Dari and right-to-left layout.',
    'انگلیسی': 'English',
    'دری': 'Dari',
    'دری (افغانستان)': 'Dari (Afghanistan)',
    'حفظ تصویرهای کوچک': 'Cache thumbnails',
    'برای مرور سریع‌تر در اتصال ضعیف.':
        'For faster browsing on a weak connection.',
    'حفظ جستجوهای اخیر': 'Remember recent searches',
    'عبارت‌ها فقط در همین دستگاه نگهداری می‌شوند.':
        'Search terms are stored only on this device.',
    'قیمت، موجودی و وضعیت سفارش هرگز در کش عمومی ذخیره نمی‌شود.':
        'Prices, stock, and order status are never stored in the public cache.',
    'پاک‌کردن محتوای عمومی ذخیره‌شده': 'Clear cached public content',
    'دسته‌بندی و مشخصات عمومی محصولات پاک می‌شود.':
        'Cached categories and public product details will be cleared.',
    'محتوای عمومی ذخیره‌شده پاک شد.': 'Cached public content was cleared.',
    'راهنما و معلومات': 'Help and information',
    'سیاست‌ها، پشتیبانی و معلومات برنامه.':
        'Policies, support, and app information.',
    'سیاست حریم خصوصی': 'Privacy policy',
    'معلومات حساب، آدرس‌ها و گزینه‌های امنیتی.':
        'Account information, addresses, and security options.',
    'نام و شماره تماس': 'Name and phone number',
    'نسخه برنامه': 'App version',
    'پاک‌کردن': 'Clear',
    'یادآوری نسخه و سفارش در داخل برنامه.':
        'In-app prescription and order reminders.',
    'آخرین اتصال موفق': 'Last successful connection',
    'بک‌اند در دسترس است': 'Backend is reachable',
    'بک‌اند در دسترس نیست': 'Backend is unreachable',
    'در حال بررسی اتصال…': 'Checking connection…',
    'نشانی دستی': 'Manual endpoint',
    'نشانی دستی برای توسعه': 'Manual development endpoint',
    'LAN ذخیره‌شده': 'Remembered LAN',
    'دستی': 'Manual',
    'تولید': 'Production',
    'این بخش فقط در نسخهٔ دیباگ دیده می‌شود و در نسخهٔ تولید غیرفعال است.':
        'This section is visible only in debug builds and is disabled in production.',
    '۱.۰.۰ (Milestone 1)': '1.0.0 (Milestone 1)',
    'شماره نمایشی': 'Demo phone number',
    'ایمیل پشتیبانی': 'Support email',
    'درخواست انجام نشد. دوباره کوشش کنید.':
        'The request could not be completed. Try again.',
  };

  static String get appName => t('درملتون', 'Darmalton');
  static String get home => t('خانه', 'Home');
  static String get categories => t('دسته‌بندی', 'Categories');
  static String get cart => t('سبد خرید', 'Cart');
  static String get orders => t('سفارش‌های من', 'My orders');
  static String get profile => t('حساب کاربری', 'Account');
  static String get settings => t('تنظیمات', 'Settings');
  static String get search => t('جستجو', 'Search');
  static String get searchHint => t(
    'دنبال دوا، محصول یا دسته‌بندی بگردید...',
    'Search medicines, products, or categories...',
  );
  static String get seeAll => t('مشاهده همه', 'See all');
  static String get retry => t('تلاش دوباره', 'Retry');
  static String get unavailable => t('ناموجود', 'Unavailable');
  static String get inStock => t('موجود در انبار', 'In stock');
  static String get addToCart => t('افزودن به سبد', 'Add to cart');
  static String get afn => t('افغانی', 'AFN');
  static String get comingSoon => t('به‌زودی', 'Coming soon');
  static String get back => t('برگشت', 'Back');
  static String get loading => t('در حال بارگذاری...', 'Loading...');

  static const Map<String, String> status = {
    'PENDING': 'ثبت شده',
    'CONFIRMED': 'تأیید شده',
    'PREPARING': 'در حال آماده‌سازی',
    'READY_FOR_DELIVERY': 'آماده تحویل',
    'OUT_FOR_DELIVERY': 'در حال ارسال',
    'DELIVERED': 'تحویل شده',
    'CANCELLED': 'لغو شده',
    'REJECTED': 'رد شده',
  };

  static const Map<String, String> statusEnglish = {
    'PENDING': 'Placed',
    'CONFIRMED': 'Confirmed',
    'PREPARING': 'Preparing',
    'READY_FOR_DELIVERY': 'Ready for delivery',
    'OUT_FOR_DELIVERY': 'Out for delivery',
    'DELIVERED': 'Delivered',
    'CANCELLED': 'Cancelled',
    'REJECTED': 'Rejected',
  };

  static String statusLabel(String value) =>
      (isEnglish ? statusEnglish : status)[value] ?? value;
}
