class User {
  const User({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.role,
    this.phone,
  });

  factory User.fromJson(Map<String, dynamic> json) => User(
    id: json['id'] as String,
    email: json['email'] as String,
    firstName: json['first_name'] as String? ?? '',
    lastName: json['last_name'] as String? ?? '',
    role: json['role'] as String? ?? 'CUSTOMER',
    phone: json['phone'] as String?,
  );

  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final String role;
  final String? phone;

  String get displayName {
    final name = '$firstName $lastName'.trim();
    return name.isEmpty ? email : name;
  }
}

class Category {
  const Category({required this.id, required this.name, required this.slug});

  factory Category.fromJson(Map<String, dynamic> json) => Category(
    id: json['id'] as String,
    name: json['name'] as String,
    slug: json['slug'] as String,
  );

  final String id;
  final String name;
  final String slug;
}

class Medicine {
  const Medicine({
    required this.id,
    required this.brandName,
    required this.genericName,
    required this.strength,
    required this.dosageForm,
    required this.manufacturer,
    required this.description,
    required this.imageUrl,
    required this.prescriptionRequired,
    required this.availableQuantity,
    required this.price,
  });

  factory Medicine.fromJson(Map<String, dynamic> json) => Medicine(
    id: json['id'] as String,
    brandName: json['brand_name'] as String,
    genericName: json['generic_name'] as String? ?? '',
    strength: json['strength'] as String? ?? '',
    dosageForm:
        (json['dosage_form'] as Map<String, dynamic>?)?['name'] as String? ??
        '',
    manufacturer:
        (json['manufacturer'] as Map<String, dynamic>?)?['name'] as String? ??
        'Not listed',
    description: json['description'] as String? ?? '',
    imageUrl: json['image_url'] as String? ?? '',
    prescriptionRequired: json['prescription_required'] as bool? ?? false,
    availableQuantity: json['available_quantity'] as int? ?? 0,
    price: json['price'] as String?,
  );

  final String id;
  final String brandName;
  final String genericName;
  final String strength;
  final String dosageForm;
  final String manufacturer;
  final String description;
  final String imageUrl;
  final bool prescriptionRequired;
  final int availableQuantity;
  final String? price;

  bool get inStock => availableQuantity > 0 && price != null;
}

class CartItem {
  const CartItem({
    required this.id,
    required this.medicine,
    required this.quantity,
    required this.availableQuantity,
    required this.lineTotal,
  });

  factory CartItem.fromJson(Map<String, dynamic> json) => CartItem(
    id: json['id'] as String,
    medicine: Medicine.fromJson(json['medicine'] as Map<String, dynamic>),
    quantity: json['quantity'] as int,
    availableQuantity: json['available_quantity'] as int? ?? 0,
    lineTotal: json['line_total'] as String?,
  );

  final String id;
  final Medicine medicine;
  final int quantity;
  final int availableQuantity;
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
    required this.streetAddress,
    required this.isDefault,
  });

  factory Address.fromJson(Map<String, dynamic> json) => Address(
    id: json['id'] as String,
    label: json['label'] as String? ?? '',
    recipientName: json['recipient_name'] as String,
    recipientPhone: json['recipient_phone'] as String,
    province: json['province'] as String,
    city: json['city'] as String,
    streetAddress: json['street_address'] as String,
    isDefault: json['is_default'] as bool? ?? false,
  );

  final String id;
  final String label;
  final String recipientName;
  final String recipientPhone;
  final String province;
  final String city;
  final String streetAddress;
  final bool isDefault;
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
    required this.paymentStatus,
    required this.currencyCode,
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
    paymentStatus: json['payment_status'] as String? ?? 'UNPAID',
    currencyCode: json['currency_code'] as String? ?? 'AFN',
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
  final String paymentStatus;
  final String currencyCode;
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
