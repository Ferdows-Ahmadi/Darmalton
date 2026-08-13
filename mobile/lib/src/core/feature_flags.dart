/// Client capabilities that must stay hidden until their complete backend and
/// transaction flows are available. Enabling a flag also requires wiring its
/// real route and tests; these constants are not user-facing preferences.
abstract final class FeatureFlags {
  static const notificationCenter = true;
  static const liveDeliveryTracking = false;
  static const cardPayments = false;
  static const wallet = false;
  static const promotionCodes = false;
  static const passwordRecovery = false;
}
