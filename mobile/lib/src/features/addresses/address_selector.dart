import 'package:flutter/material.dart' hide Text;
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';

import '../../core/app_settings.dart';
import '../../core/design_system.dart';
import '../../core/localized_text.dart';
import '../../core/models.dart';
import '../../core/phone_number.dart';
import '../../core/providers.dart';
import '../../core/strings.dart';
import '../../core/widgets.dart';

bool shouldClearSelectedAddress({
  required String? selectedAddressId,
  required String deletedAddressId,
}) => selectedAddressId == deletedAddressId;

Future<String?> showAddressSelector(BuildContext context, WidgetRef ref) async {
  final user = await ref.read(authProvider.future);
  if (!context.mounted) return null;
  if (user == null) {
    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (sheetContext) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.location_on_outlined,
                color: DarmaltonColors.teal,
                size: 36,
              ),
              const SizedBox(height: 10),
              const Text(
                'برای ذخیره و انتخاب آدرس تحویل وارد حساب شوید.',
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: () {
                  Navigator.pop(sheetContext);
                  context.push('/login?returnTo=/catalogue');
                },
                icon: const Icon(Icons.login_rounded),
                label: const Text('ورود به حساب'),
              ),
            ],
          ),
        ),
      ),
    );
    return null;
  }

  return showModalBottomSheet<String>(
    context: context,
    showDragHandle: true,
    isScrollControlled: true,
    builder: (sheetContext) => Consumer(
      builder: (context, sheetRef, _) {
        final addresses = sheetRef.watch(addressesProvider);
        final selectedId = sheetRef.watch(selectedAddressIdProvider).value;
        final offline = sheetRef.watch(offlineProvider);
        return SafeArea(
          child: FractionallySizedBox(
            heightFactor: 0.82,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      const Expanded(
                        child: Text(
                          'آدرس تحویل',
                          style: TextStyle(
                            fontSize: 21,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      IconButton(
                        tooltip: DariStrings.translate('بستن'),
                        onPressed: () => Navigator.pop(sheetContext),
                        icon: const Icon(Icons.close_rounded),
                      ),
                    ],
                  ),
                  if (offline)
                    const Padding(
                      padding: EdgeInsets.only(bottom: 8),
                      child: Text(
                        'آفلاین هستید؛ آدرس‌های ذخیره‌شده قابل انتخاب‌اند، اما افزودن و ویرایش پس از اتصال فعال می‌شود.',
                        style: TextStyle(color: Color(0xFF79510D)),
                      ),
                    ),
                  Expanded(
                    child: addresses.when(
                      loading: () =>
                          const Center(child: CircularProgressIndicator()),
                      error: (error, _) => AsyncMessage(
                        message: '$error',
                        onRetry: () => sheetRef.invalidate(addressesProvider),
                      ),
                      data: (items) => items.isEmpty
                          ? const EmptyMessage(
                              'آدرسی ثبت نشده است',
                              'یک آدرس دستی یا موقعیت فعلی خود را اضافه کنید.',
                              icon: Icons.location_off_outlined,
                            )
                          : ListView.separated(
                              itemCount: items.length,
                              separatorBuilder: (_, _) =>
                                  const SizedBox(height: 8),
                              itemBuilder: (context, index) {
                                final address = items[index];
                                final selected =
                                    selectedId == address.id ||
                                    (selectedId == null && address.isDefault);
                                return _AddressTile(
                                  address: address,
                                  selected: selected,
                                  offline: offline,
                                  onSelect: () => _selectAddress(
                                    sheetContext,
                                    sheetRef,
                                    address,
                                    offline,
                                  ),
                                  onEdit: () => showAddressEditor(
                                    context,
                                    sheetRef,
                                    address: address,
                                  ),
                                  onDelete: () => _deleteAddress(
                                    context,
                                    sheetRef,
                                    address,
                                  ),
                                );
                              },
                            ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: offline
                              ? null
                              : () =>
                                    _addFromCurrentLocation(context, sheetRef),
                          icon: const Icon(Icons.my_location_rounded),
                          label: const Text('موقعیت فعلی'),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: FilledButton.icon(
                          onPressed: offline
                              ? null
                              : () => showAddressEditor(context, sheetRef),
                          icon: const Icon(Icons.add_location_alt_outlined),
                          label: const Text('آدرس جدید'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        );
      },
    ),
  );
}

Future<void> _selectAddress(
  BuildContext sheetContext,
  WidgetRef ref,
  Address address,
  bool offline,
) async {
  try {
    await selectDeliveryAddress(ref, address, offline: offline);
  } catch (error) {
    if (sheetContext.mounted) {
      ScaffoldMessenger.of(
        sheetContext,
      ).showSnackBar(SnackBar(content: Text('$error')));
    }
    return;
  }
  if (sheetContext.mounted) Navigator.pop(sheetContext, address.id);
}

Future<void> selectDeliveryAddress(
  WidgetRef ref,
  Address address, {
  bool? offline,
}) async {
  final user = await ref.read(authProvider.future);
  if (user == null) return;
  await ref
      .read(localCacheProvider)
      .writeSelectedAddressId(user.id, address.id);
  ref.invalidate(selectedAddressIdProvider);
  if (!(offline ?? ref.read(offlineProvider)) && !address.isDefault) {
    await ref
        .read(apiClientProvider)
        .patch<Map<String, dynamic>>(
          '/addresses/${address.id}/',
          data: {'is_default': true},
        );
    ref.invalidate(addressesProvider);
  }
}

Future<void> _deleteAddress(
  BuildContext context,
  WidgetRef ref,
  Address address,
) async {
  final confirmed = await showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      title: const Text('حذف آدرس'),
      content: Text(
        DariStrings.t(
          'آدرس «${address.labelOrFallback}» حذف شود؟',
          'Delete “${address.labelOrFallback}”?',
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context, false),
          child: const Text('لغو'),
        ),
        FilledButton(
          onPressed: () => Navigator.pop(context, true),
          child: const Text('حذف'),
        ),
      ],
    ),
  );
  if (confirmed != true) return;
  try {
    final user = await ref.read(authProvider.future);
    final selectedId = user == null
        ? null
        : await ref.read(localCacheProvider).readSelectedAddressId(user.id);
    await ref.read(apiClientProvider).delete('/addresses/${address.id}/');
    if (user != null &&
        shouldClearSelectedAddress(
          selectedAddressId: selectedId,
          deletedAddressId: address.id,
        )) {
      await ref.read(localCacheProvider).deleteSelectedAddressId(user.id);
    }
    ref.invalidate(addressesProvider);
    ref.invalidate(selectedAddressIdProvider);
  } catch (error) {
    if (context.mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('$error')));
    }
  }
}

Future<void> _addFromCurrentLocation(
  BuildContext context,
  WidgetRef ref,
) async {
  try {
    final position = await _getCurrentLocation();
    if (context.mounted) {
      await showAddressEditor(
        context,
        ref,
        initialLatitude: position.latitude,
        initialLongitude: position.longitude,
      );
    }
  } on Object catch (error) {
    if (context.mounted) {
      final message = error is FormatException
          ? error.message
          : 'موقعیت فعلی دریافت نشد. دوباره تلاش کنید.';
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(message)));
    }
  }
}

Future<Position> _getCurrentLocation() async {
  if (!await Geolocator.isLocationServiceEnabled()) {
    throw const FormatException('خدمات موقعیت دستگاه خاموش است.');
  }
  var permission = await Geolocator.checkPermission();
  if (permission == LocationPermission.denied) {
    permission = await Geolocator.requestPermission();
  }
  if (permission == LocationPermission.denied ||
      permission == LocationPermission.deniedForever) {
    throw const FormatException(
      'اجازهٔ موقعیت داده نشد. می‌توانید آدرس را دستی وارد کنید.',
    );
  }
  return Geolocator.getCurrentPosition(
    locationSettings: const LocationSettings(
      accuracy: LocationAccuracy.high,
      timeLimit: Duration(seconds: 12),
    ),
  );
}

Future<LatLng?> _showMapPicker(
  BuildContext context, {
  double? latitude,
  double? longitude,
}) {
  var selected = LatLng(latitude ?? 34.5553, longitude ?? 69.2075);
  return showDialog<LatLng>(
    context: context,
    builder: (dialogContext) => StatefulBuilder(
      builder: (context, setDialogState) => AlertDialog(
        insetPadding: const EdgeInsets.all(16),
        title: const Text('انتخاب موقعیت روی نقشه'),
        content: SizedBox(
          width: 560,
          height: 430,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('برای جابه‌جایی نشان، نقطهٔ مورد نظر را لمس کنید.'),
              const SizedBox(height: 10),
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(DarmaltonRadius.small),
                  child: FlutterMap(
                    options: MapOptions(
                      initialCenter: selected,
                      initialZoom: 15,
                      onTap: (_, point) =>
                          setDialogState(() => selected = point),
                    ),
                    children: [
                      _mapTiles(),
                      MarkerLayer(
                        markers: [
                          Marker(
                            point: selected,
                            width: 52,
                            height: 52,
                            child: const Icon(
                              Icons.location_pin,
                              size: 48,
                              color: DarmaltonColors.teal,
                            ),
                          ),
                        ],
                      ),
                      const RichAttributionWidget(
                        attributions: [
                          TextSourceAttribution('OpenStreetMap contributors'),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 8),
              LtrText(
                '${selected.latitude.toStringAsFixed(6)}, ${selected.longitude.toStringAsFixed(6)}',
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('لغو'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(dialogContext, selected),
            child: const Text('استفاده از این موقعیت'),
          ),
        ],
      ),
    ),
  );
}

TileLayer _mapTiles() => TileLayer(
  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  userAgentPackageName: 'com.darmalton.pharmacy',
);

Future<void> showAddressEditor(
  BuildContext context,
  WidgetRef ref, {
  Address? address,
  double? initialLatitude,
  double? initialLongitude,
}) async {
  final formKey = GlobalKey<FormState>();
  final controllers = <String, TextEditingController>{
    'label': TextEditingController(text: address?.label ?? 'خانه'),
    'recipient_name': TextEditingController(text: address?.recipientName ?? ''),
    'recipient_phone': TextEditingController(
      text: address?.recipientPhone ?? '',
    ),
    'province': TextEditingController(text: address?.province ?? 'کابل'),
    'city': TextEditingController(text: address?.city ?? 'کابل'),
    'district': TextEditingController(text: address?.district ?? ''),
    'street_address': TextEditingController(text: address?.streetAddress ?? ''),
    'landmark': TextEditingController(text: address?.landmark ?? ''),
    'delivery_instructions': TextEditingController(
      text: address?.deliveryInstructions ?? '',
    ),
  };
  var latitude = initialLatitude ?? address?.latitude;
  var longitude = initialLongitude ?? address?.longitude;
  var saving = false;
  String? submitError;

  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (sheetContext) => StatefulBuilder(
      builder: (context, setSheetState) => SafeArea(
        child: Padding(
          padding: EdgeInsets.fromLTRB(
            16,
            0,
            16,
            MediaQuery.viewInsetsOf(context).bottom + 16,
          ),
          child: SingleChildScrollView(
            child: Form(
              key: formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    address == null ? 'آدرس جدید' : 'ویرایش آدرس',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 12),
                  ...[
                    ('label', 'نام آدرس', Icons.label_outline_rounded, false),
                    (
                      'recipient_name',
                      'نام گیرنده',
                      Icons.person_outline,
                      true,
                    ),
                    (
                      'recipient_phone',
                      'شماره تماس',
                      Icons.phone_outlined,
                      true,
                    ),
                    ('province', 'ولایت', Icons.map_outlined, true),
                    ('city', 'شهر', Icons.location_city_outlined, true),
                    ('district', 'ناحیه یا ولسوالی', Icons.map_outlined, false),
                    ('street_address', 'آدرس دقیق', Icons.home_outlined, true),
                    ('landmark', 'نشانی نزدیک', Icons.signpost_outlined, false),
                    (
                      'delivery_instructions',
                      'راهنمای تحویل',
                      Icons.notes_rounded,
                      false,
                    ),
                  ].map(
                    (field) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: TextFormField(
                        controller: controllers[field.$1],
                        enabled: !saving,
                        textDirection: field.$1 == 'recipient_phone'
                            ? TextDirection.ltr
                            : TextDirection.rtl,
                        keyboardType: field.$1 == 'recipient_phone'
                            ? TextInputType.phone
                            : TextInputType.text,
                        minLines:
                            field.$1 == 'street_address' ||
                                field.$1 == 'delivery_instructions'
                            ? 2
                            : 1,
                        maxLines:
                            field.$1 == 'street_address' ||
                                field.$1 == 'delivery_instructions'
                            ? 3
                            : 1,
                        decoration: InputDecoration(
                          labelText: DariStrings.translate(field.$2),
                          prefixIcon: Icon(field.$3),
                        ),
                        validator: field.$4
                            ? (value) {
                                if (value == null || value.trim().isEmpty) {
                                  return DariStrings.translate(
                                    'این بخش الزامی است.',
                                  );
                                }
                                if (field.$1 == 'recipient_phone') {
                                  return validateAfghanPhone(value);
                                }
                                return null;
                              }
                            : null,
                      ),
                    ),
                  ),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: saving
                              ? null
                              : () async {
                                  try {
                                    final position =
                                        await _getCurrentLocation();
                                    if (!sheetContext.mounted) return;
                                    setSheetState(() {
                                      latitude = position.latitude;
                                      longitude = position.longitude;
                                      submitError = null;
                                    });
                                  } on Object catch (error) {
                                    if (!sheetContext.mounted) return;
                                    setSheetState(() {
                                      submitError = error is FormatException
                                          ? error.message
                                          : 'موقعیت فعلی دریافت نشد. دوباره تلاش کنید.';
                                    });
                                  }
                                },
                          icon: const Icon(Icons.my_location_rounded),
                          label: const Text('موقعیت فعلی'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: saving
                              ? null
                              : () async {
                                  final selected = await _showMapPicker(
                                    context,
                                    latitude: latitude,
                                    longitude: longitude,
                                  );
                                  if (!sheetContext.mounted ||
                                      selected == null) {
                                    return;
                                  }
                                  setSheetState(() {
                                    latitude = selected.latitude;
                                    longitude = selected.longitude;
                                    submitError = null;
                                  });
                                },
                          icon: const Icon(Icons.map_outlined),
                          label: const Text('انتخاب روی نقشه'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  if (latitude != null && longitude != null)
                    DarmaltonCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(
                              DarmaltonRadius.small,
                            ),
                            child: SizedBox(
                              height: 145,
                              child: FlutterMap(
                                options: MapOptions(
                                  initialCenter: LatLng(latitude!, longitude!),
                                  initialZoom: 15,
                                  interactionOptions: const InteractionOptions(
                                    flags: InteractiveFlag.none,
                                  ),
                                ),
                                children: [
                                  _mapTiles(),
                                  MarkerLayer(
                                    markers: [
                                      Marker(
                                        point: LatLng(latitude!, longitude!),
                                        width: 44,
                                        height: 44,
                                        child: const Icon(
                                          Icons.location_pin,
                                          size: 42,
                                          color: DarmaltonColors.teal,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const RichAttributionWidget(
                                    attributions: [
                                      TextSourceAttribution(
                                        'OpenStreetMap contributors',
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),
                          ListTile(
                            contentPadding: EdgeInsets.zero,
                            leading: const Icon(
                              Icons.pin_drop_outlined,
                              color: DarmaltonColors.teal,
                            ),
                            title: const Text('موقعیت تحویل ثبت شد'),
                            subtitle: LtrText(
                              '${latitude!.toStringAsFixed(6)}, ${longitude!.toStringAsFixed(6)}',
                            ),
                            trailing: IconButton(
                              tooltip: DariStrings.translate('حذف موقعیت'),
                              onPressed: saving
                                  ? null
                                  : () => setSheetState(() {
                                      latitude = null;
                                      longitude = null;
                                    }),
                              icon: const Icon(Icons.close_rounded),
                            ),
                          ),
                        ],
                      ),
                    ),
                  if (submitError != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      submitError!,
                      style: const TextStyle(color: DarmaltonColors.danger),
                    ),
                  ],
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: saving
                              ? null
                              : () => Navigator.pop(sheetContext),
                          child: const Text('لغو'),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: FilledButton(
                          onPressed: saving
                              ? null
                              : () async {
                                  if (!formKey.currentState!.validate()) return;
                                  setSheetState(() {
                                    saving = true;
                                    submitError = null;
                                  });
                                  final data = {
                                    for (final entry in controllers.entries)
                                      entry.key: entry.key == 'recipient_phone'
                                          ? normalizeAfghanPhone(
                                              entry.value.text,
                                            )
                                          : entry.value.text.trim(),
                                    'country_code': 'AF',
                                    'is_default': address?.isDefault ?? true,
                                    'latitude': latitude,
                                    'longitude': longitude,
                                  };
                                  try {
                                    if (address == null) {
                                      await ref
                                          .read(apiClientProvider)
                                          .post<Map<String, dynamic>>(
                                            '/addresses/',
                                            data: data,
                                          );
                                    } else {
                                      await ref
                                          .read(apiClientProvider)
                                          .patch<Map<String, dynamic>>(
                                            '/addresses/${address.id}/',
                                            data: data,
                                          );
                                    }
                                    ref.invalidate(addressesProvider);
                                    ref.invalidate(selectedAddressIdProvider);
                                    if (sheetContext.mounted) {
                                      Navigator.pop(sheetContext);
                                    }
                                  } catch (error) {
                                    if (!sheetContext.mounted) return;
                                    setSheetState(() {
                                      saving = false;
                                      submitError = '$error';
                                    });
                                  }
                                },
                          child: Text(saving ? 'در حال ذخیره…' : 'ذخیره'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    ),
  );
  for (final controller in controllers.values) {
    controller.dispose();
  }
}

class _AddressTile extends StatelessWidget {
  const _AddressTile({
    required this.address,
    required this.selected,
    required this.offline,
    required this.onSelect,
    required this.onEdit,
    required this.onDelete,
  });

  final Address address;
  final bool selected;
  final bool offline;
  final VoidCallback onSelect;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) => Semantics(
    button: true,
    selected: selected,
    label:
        '${address.labelOrFallback}، ${address.city}، ${address.streetAddress}',
    child: DarmaltonCard(
      padding: EdgeInsets.zero,
      onTap: onSelect,
      child: ListTile(
        minTileHeight: 72,
        leading: Icon(
          selected ? Icons.check_circle_rounded : Icons.location_on_outlined,
          color: DarmaltonColors.teal,
        ),
        title: Text(address.labelOrFallback),
        subtitle: Text(
          '${address.city}، ${address.streetAddress}',
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        trailing: offline
            ? null
            : PopupMenuButton<String>(
                tooltip: DariStrings.t('کارهای آدرس', 'Address actions'),
                onSelected: (value) {
                  if (value == 'edit') onEdit();
                  if (value == 'delete') onDelete();
                },
                itemBuilder: (context) => const [
                  PopupMenuItem(value: 'edit', child: Text('ویرایش')),
                  PopupMenuItem(value: 'delete', child: Text('حذف')),
                ],
              ),
      ),
    ),
  );
}

extension on Address {
  String get labelOrFallback => label.isEmpty ? 'آدرس تحویل' : label;
}
