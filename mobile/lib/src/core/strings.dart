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
  };

  static const appName = 'درملتون';
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
