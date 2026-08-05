import 'strings.dart';

class User {
  const User({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.role,
    this.preferredLanguage = 'fa',
    this.phone,
  });

  factory User.fromJson(Map<String, dynamic> json) => User(
    id: json['id'] as String,
    email: json['email'] as String,
    firstName: json['first_name'] as String? ?? '',
    lastName: json['last_name'] as String? ?? '',
    role: json['role'] as String? ?? 'CUSTOMER',
    preferredLanguage: (json['preferred_language'] as String?) == 'en'
        ? 'en'
        : 'fa',
    phone: json['phone'] as String?,
  );

  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final String role;
  final String preferredLanguage;
  final String? phone;

  String get displayName {
    final name = '$firstName $lastName'.trim();
    return name.isEmpty ? email : name;
  }
}

class Category {
  const Category({
    required this.id,
    required this.name,
    required this.nameDari,
    required this.slug,
  });

  factory Category.fromJson(Map<String, dynamic> json) => Category(
    id: json['id'] as String,
    name: json['name'] as String,
    nameDari: json['name_dari'] as String? ?? '',
    slug: json['slug'] as String,
  );

  final String id;
  final String name;
  final String nameDari;
  final String slug;

  String get displayName =>
      DariStrings.isEnglish || nameDari.isEmpty ? name : nameDari;

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'name_dari': nameDari,
    'slug': slug,
  };
}

class PromotionalBanner {
  const PromotionalBanner({
    required this.id,
    required this.title,
    required this.titleDari,
    required this.imageUrl,
    required this.altText,
    required this.altTextDari,
    required this.actionUrl,
    required this.displayOrder,
  });

  factory PromotionalBanner.fromJson(Map<String, dynamic> json) =>
      PromotionalBanner(
        id: json['id'] as String,
        title: json['title'] as String? ?? '',
        titleDari: json['title_dari'] as String? ?? '',
        imageUrl: json['image_url'] as String? ?? '',
        altText: json['alt_text'] as String? ?? '',
        altTextDari: json['alt_text_dari'] as String? ?? '',
        actionUrl: json['action_url'] as String? ?? '',
        displayOrder: json['display_order'] as int? ?? 0,
      );

  final String id;
  final String title;
  final String titleDari;
  final String imageUrl;
  final String altText;
  final String altTextDari;
  final String actionUrl;
  final int displayOrder;

  String get semanticLabel {
    if (DariStrings.isEnglish) {
      return altText.isNotEmpty ? altText : title;
    }
    return altTextDari.isNotEmpty ? altTextDari : titleDari;
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'title_dari': titleDari,
    'image_url': imageUrl,
    'alt_text': altText,
    'alt_text_dari': altTextDari,
    'action_url': actionUrl,
    'display_order': displayOrder,
  };
}

List<PromotionalBanner> normalizePromotionalBanners(
  Iterable<PromotionalBanner> banners,
) {
  final result = banners.where((item) => item.imageUrl.isNotEmpty).toList()
    ..sort((left, right) {
      final byOrder = left.displayOrder.compareTo(right.displayOrder);
      return byOrder != 0 ? byOrder : left.id.compareTo(right.id);
    });
  return result.take(10).toList(growable: false);
}

class Medicine {
  const Medicine({
    required this.id,
    required this.brandName,
    required this.brandNameDari,
    required this.genericName,
    required this.strength,
    required this.dosageForm,
    required this.dosageFormDari,
    required this.packSize,
    required this.categoryName,
    required this.categoryNameDari,
    required this.manufacturer,
    required this.description,
    required this.descriptionDari,
    required this.imageUrl,
    required this.prescriptionRequired,
    required this.availableQuantity,
    required this.price,
  });

  factory Medicine.fromJson(Map<String, dynamic> json) => Medicine(
    id: json['id'] as String,
    brandName: json['brand_name'] as String,
    brandNameDari: json['brand_name_dari'] as String? ?? '',
    genericName: json['generic_name'] as String? ?? '',
    strength: json['strength'] as String? ?? '',
    dosageForm:
        (json['dosage_form'] as Map<String, dynamic>?)?['name'] as String? ??
        '',
    dosageFormDari:
        (json['dosage_form'] as Map<String, dynamic>?)?['name_dari']
            as String? ??
        '',
    packSize: json['pack_size'] as String? ?? '',
    categoryName:
        (json['category'] as Map<String, dynamic>?)?['name'] as String? ?? '',
    categoryNameDari:
        (json['category'] as Map<String, dynamic>?)?['name_dari'] as String? ??
        '',
    manufacturer:
        (json['manufacturer'] as Map<String, dynamic>?)?['name'] as String? ??
        'Not listed',
    description: json['description'] as String? ?? '',
    descriptionDari: json['description_dari'] as String? ?? '',
    imageUrl: json['image_url'] as String? ?? '',
    prescriptionRequired: json['prescription_required'] as bool? ?? false,
    availableQuantity: json['available_quantity'] as int? ?? 0,
    price: json['price'] as String?,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'brand_name': brandName,
    'brand_name_dari': brandNameDari,
    'generic_name': genericName,
    'strength': strength,
    'dosage_form': {'name': dosageForm, 'name_dari': dosageFormDari},
    'pack_size': packSize,
    'category': {'name': categoryName, 'name_dari': categoryNameDari},
    'manufacturer': {'name': manufacturer},
    'description': description,
    'description_dari': descriptionDari,
    'image_url': imageUrl,
    'prescription_required': prescriptionRequired,
    'available_quantity': availableQuantity,
    'price': price,
  };

  Map<String, dynamic> toCacheJson() => {
    ...toJson(),
    // Price and stock are intentionally never persisted. Cached catalogue
    // entries are descriptive metadata only and must be refreshed before sale.
    'available_quantity': 0,
    'price': null,
  };

  final String id;
  final String brandName;
  final String brandNameDari;
  final String genericName;
  final String strength;
  final String dosageForm;
  final String dosageFormDari;
  final String packSize;
  final String categoryName;
  final String categoryNameDari;
  final String manufacturer;
  final String description;
  final String descriptionDari;
  final String imageUrl;
  final bool prescriptionRequired;
  final int availableQuantity;
  final String? price;

  bool get inStock => availableQuantity > 0 && price != null;
  String get displayName => DariStrings.isEnglish || brandNameDari.isEmpty
      ? brandName
      : brandNameDari;
  String get displayDescription =>
      DariStrings.isEnglish || descriptionDari.isEmpty
      ? description
      : descriptionDari;
  String get displayDosageForm =>
      DariStrings.isEnglish || dosageFormDari.isEmpty
      ? dosageForm
      : dosageFormDari;
  String get displayCategory =>
      DariStrings.isEnglish || categoryNameDari.isEmpty
      ? categoryName
      : categoryNameDari;
}

class CartItem {
  const CartItem({
    required this.id,
    required this.medicine,
    required this.quantity,
    required this.availableQuantity,
    required this.unitPrice,
    required this.lineTotal,
  });

  factory CartItem.fromJson(Map<String, dynamic> json) => CartItem(
    id: json['id'] as String,
    medicine: Medicine.fromJson(json['medicine'] as Map<String, dynamic>),
    quantity: json['quantity'] as int,
    availableQuantity: json['available_quantity'] as int? ?? 0,
    unitPrice: json['unit_price'] as String?,
    lineTotal: json['line_total'] as String?,
  );

  final String id;
  final Medicine medicine;
  final int quantity;
  final int availableQuantity;
  final String? unitPrice;
  final String? lineTotal;
}

class Cart {
  const Cart({required this.id, required this.items, required this.subtotal});

  factory Cart.fromJson(Map<String, dynamic> json) => Cart(
    id: json['id'] as String,
    items: (json['items'] as List<dynamic>? ?? [])
        .map((item) => CartItem.fromJson(item as Map<String, dynamic>))
        .toList(),
    subtotal: json['subtotal'] as String? ?? '0.00',
  );

  final String id;
  final List<CartItem> items;
  final String subtotal;
}

class Address {
  const Address({
    required this.id,
    required this.label,
    required this.recipientName,
    required this.recipientPhone,
    required this.province,
    required this.city,
    required this.district,
    required this.streetAddress,
    required this.landmark,
    required this.deliveryInstructions,
    required this.isDefault,
    this.latitude,
    this.longitude,
  });

  factory Address.fromJson(Map<String, dynamic> json) => Address(
    id: json['id'] as String,
    label: json['label'] as String? ?? '',
    recipientName: json['recipient_name'] as String,
    recipientPhone: json['recipient_phone'] as String,
    province: json['province'] as String,
    city: json['city'] as String,
    district: json['district'] as String? ?? '',
    streetAddress: json['street_address'] as String,
    landmark: json['landmark'] as String? ?? '',
    deliveryInstructions: json['delivery_instructions'] as String? ?? '',
    isDefault: json['is_default'] as bool? ?? false,
    latitude: double.tryParse('${json['latitude'] ?? ''}'),
    longitude: double.tryParse('${json['longitude'] ?? ''}'),
  );

  final String id;
  final String label;
  final String recipientName;
  final String recipientPhone;
  final String province;
  final String city;
  final String district;
  final String streetAddress;
  final String landmark;
  final String deliveryInstructions;
  final bool isDefault;
  final double? latitude;
  final double? longitude;

  Map<String, dynamic> toJson() => {
    'id': id,
    'label': label,
    'recipient_name': recipientName,
    'recipient_phone': recipientPhone,
    'province': province,
    'city': city,
    'district': district,
    'street_address': streetAddress,
    'landmark': landmark,
    'delivery_instructions': deliveryInstructions,
    'is_default': isDefault,
    'latitude': latitude,
    'longitude': longitude,
  };
}

class OrderStatus {
  const OrderStatus({
    required this.toStatus,
    required this.createdAt,
    required this.note,
  });

  factory OrderStatus.fromJson(Map<String, dynamic> json) => OrderStatus(
    toStatus: json['to_status'] as String,
    createdAt: DateTime.parse(json['created_at'] as String),
    note: json['note'] as String? ?? '',
  );

  final String toStatus;
  final DateTime createdAt;
  final String note;
}

class OrderItem {
  const OrderItem({
    required this.id,
    required this.medicineName,
    required this.strength,
    required this.dosageForm,
    required this.quantity,
    required this.unitPrice,
    required this.lineTotal,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) => OrderItem(
    id: json['id'] as String,
    medicineName: json['medicine_name'] as String,
    strength: json['strength'] as String? ?? '',
    dosageForm: json['dosage_form'] as String? ?? '',
    quantity: json['quantity'] as int,
    unitPrice: json['unit_price'] as String,
    lineTotal: json['line_total'] as String,
  );

  final String id;
  final String medicineName;
  final String strength;
  final String dosageForm;
  final int quantity;
  final String unitPrice;
  final String lineTotal;
}

class Order {
  const Order({
    required this.id,
    required this.orderNumber,
    required this.status,
    required this.paymentMethod,
    required this.paymentStatus,
    required this.currencyCode,
    required this.subtotal,
    required this.deliveryFee,
    required this.discountTotal,
    required this.grandTotal,
    required this.deliveryAddress,
    required this.items,
    required this.placedAt,
    required this.statusHistory,
  });

  factory Order.fromJson(Map<String, dynamic> json) => Order(
    id: json['id'] as String,
    orderNumber: json['order_number'] as String,
    status: json['status'] as String,
    paymentMethod: json['payment_method'] as String? ?? 'CASH_ON_DELIVERY',
    paymentStatus: json['payment_status'] as String? ?? 'UNPAID',
    currencyCode: json['currency_code'] as String? ?? 'AFN',
    subtotal: json['subtotal'] as String? ?? '0.00',
    deliveryFee: json['delivery_fee'] as String? ?? '0.00',
    discountTotal: json['discount_total'] as String? ?? '0.00',
    grandTotal: json['grand_total'] as String,
    deliveryAddress: Map<String, String>.from(
      (json['delivery_address'] as Map<String, dynamic>? ?? const {}).map(
        (key, value) => MapEntry(key, value?.toString() ?? ''),
      ),
    ),
    items: (json['items'] as List<dynamic>? ?? [])
        .map((item) => OrderItem.fromJson(item as Map<String, dynamic>))
        .toList(),
    placedAt: DateTime.parse(json['placed_at'] as String),
    statusHistory: (json['status_history'] as List<dynamic>? ?? [])
        .map((item) => OrderStatus.fromJson(item as Map<String, dynamic>))
        .toList(),
  );

  final String id;
  final String orderNumber;
  final String status;
  final String paymentMethod;
  final String paymentStatus;
  final String currencyCode;
  final String subtotal;
  final String deliveryFee;
  final String discountTotal;
  final String grandTotal;
  final Map<String, String> deliveryAddress;
  final List<OrderItem> items;
  final DateTime placedAt;
  final List<OrderStatus> statusHistory;
}

String readableStatus(String status) => status
    .split('_')
    .map((word) => '${word[0]}${word.substring(1).toLowerCase()}')
    .join(' ');

class AuthorizedMedicine {
  const AuthorizedMedicine({
    required this.id,
    required this.medicineId,
    required this.medicineName,
    required this.maxQuantity,
    required this.instructions,
  });

  factory AuthorizedMedicine.fromJson(Map<String, dynamic> json) =>
      AuthorizedMedicine(
        id: json['id'] as String,
        medicineId: json['medicine_id'] as String,
        medicineName: json['medicine_name'] as String,
        maxQuantity: json['max_quantity'] as int,
        instructions: json['instructions'] as String? ?? '',
      );

  final String id;
  final String medicineId;
  final String medicineName;
  final int maxQuantity;
  final String instructions;
}

class PrescriptionHistory {
  const PrescriptionHistory({
    required this.status,
    required this.action,
    required this.note,
    required this.createdAt,
  });

  factory PrescriptionHistory.fromJson(Map<String, dynamic> json) =>
      PrescriptionHistory(
        status: json['to_status'] as String,
        action: json['action'] as String,
        note: json['customer_visible_note'] as String? ?? '',
        createdAt: DateTime.parse(json['created_at'] as String),
      );

  final String status;
  final String action;
  final String note;
  final DateTime createdAt;
}

class Prescription {
  const Prescription({
    required this.id,
    required this.patientName,
    required this.status,
    required this.customerVisibleNote,
    required this.clarificationRequest,
    required this.customerResponse,
    required this.createdAt,
    required this.canCancel,
    required this.canRespond,
    required this.authorizedMedicines,
    required this.history,
    this.expiresAt,
  });

  factory Prescription.fromJson(Map<String, dynamic> json) => Prescription(
    id: json['id'] as String,
    patientName: json['patient_name'] as String? ?? '',
    status: json['status'] as String,
    customerVisibleNote: json['customer_visible_note'] as String? ?? '',
    clarificationRequest: json['clarification_request'] as String? ?? '',
    customerResponse: json['customer_response'] as String? ?? '',
    createdAt: DateTime.parse(json['created_at'] as String),
    canCancel: json['can_cancel'] as bool? ?? false,
    canRespond: json['can_respond'] as bool? ?? false,
    expiresAt: json['expires_at'] == null
        ? null
        : DateTime.parse(json['expires_at'] as String),
    authorizedMedicines: (json['authorized_medicines'] as List<dynamic>? ?? [])
        .map(
          (item) => AuthorizedMedicine.fromJson(item as Map<String, dynamic>),
        )
        .toList(),
    history: (json['history'] as List<dynamic>? ?? [])
        .map(
          (item) => PrescriptionHistory.fromJson(item as Map<String, dynamic>),
        )
        .toList(),
  );

  final String id;
  final String patientName;
  final String status;
  final String customerVisibleNote;
  final String clarificationRequest;
  final String customerResponse;
  final DateTime createdAt;
  final DateTime? expiresAt;
  final bool canCancel;
  final bool canRespond;
  final List<AuthorizedMedicine> authorizedMedicines;
  final List<PrescriptionHistory> history;
}

String prescriptionStatusLabel(String status) => switch (status) {
  'SUBMITTED' => DariStrings.t('ارسال‌شده', 'Submitted'),
  'UNDER_REVIEW' => DariStrings.t('در حال بررسی', 'Under review'),
  'CLARIFICATION_REQUESTED' => DariStrings.t(
    'نیازمند توضیح',
    'Clarification requested',
  ),
  'APPROVED' => DariStrings.t('تأییدشده', 'Approved'),
  'REJECTED' => DariStrings.t('ردشده', 'Rejected'),
  'EXPIRED' => DariStrings.t('منقضی‌شده', 'Expired'),
  'CANCELLED' => DariStrings.t('لغوشده', 'Cancelled'),
  _ => readableStatus(status),
};
