abstract final class DariStrings {
  static const appName = 'درملتون';
  static const home = 'خانه';
  static const categories = 'دسته‌بندی';
  static const cart = 'سبد خرید';
  static const orders = 'سفارش‌های من';
  static const profile = 'حساب کاربری';
  static const search = 'جستجو';
  static const searchHint = 'دنبال دوا، محصول یا دسته‌بندی بگردید...';
  static const seeAll = 'مشاهده همه';
  static const retry = 'تلاش دوباره';
  static const unavailable = 'ناموجود';
  static const inStock = 'موجود در انبار';
  static const addToCart = 'افزودن به سبد';
  static const afn = 'افغانی';
  static const comingSoon = 'به‌زودی';
  static const back = 'برگشت';
  static const loading = 'در حال بارگذاری...';

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

  static String statusLabel(String value) => status[value] ?? value;
}
