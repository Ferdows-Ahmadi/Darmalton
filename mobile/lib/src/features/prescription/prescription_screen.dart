import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/design_system.dart';
import '../../core/models.dart';
import '../../core/providers.dart';
import '../../core/widgets.dart';

class PrescriptionScreen extends ConsumerStatefulWidget {
  const PrescriptionScreen({this.requestedMedicineId, super.key});

  final String? requestedMedicineId;

  @override
  ConsumerState<PrescriptionScreen> createState() => _PrescriptionScreenState();
}

class _PrescriptionScreenState extends ConsumerState<PrescriptionScreen> {
  final _patientController = TextEditingController();
  final _phoneController = TextEditingController();
  final _noteController = TextEditingController();
  PlatformFile? _file;
  double? _progress;
  bool _submitting = false;
  String _error = '';

  @override
  void dispose() {
    _patientController.dispose();
    _phoneController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  Future<void> _pick() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: const ['jpg', 'jpeg', 'png', 'pdf'],
      allowMultiple: false,
    );
    if (!mounted || result == null) return;
    setState(() {
      _file = result.files.single;
      _error = '';
    });
  }

  Future<void> _submit() async {
    final file = _file;
    if (file == null || file.path == null) {
      setState(() => _error = 'نخست عکس یا فایل نسخه را انتخاب کنید.');
      return;
    }
    setState(() {
      _submitting = true;
      _progress = 0;
      _error = '';
    });
    try {
      await ref
          .read(prescriptionRepositoryProvider)
          .upload(
            filePath: file.path!,
            filename: file.name,
            fields: {
              'patient_name': _patientController.text.trim(),
              'contact_phone': _phoneController.text.trim(),
              'customer_note': _noteController.text.trim(),
            },
            onProgress: (sent, total) {
              if (mounted && total > 0) {
                setState(() => _progress = sent / total);
              }
            },
          );
      ref.invalidate(prescriptionsProvider);
      if (!mounted) return;
      setState(() {
        _file = null;
        _progress = null;
        _patientController.clear();
        _phoneController.clear();
        _noteController.clear();
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('نسخه با موفقیت ارسال شد و در صف بررسی قرار گرفت.'),
        ),
      );
    } catch (error) {
      if (mounted) setState(() => _error = '$error');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<void> _cancel(Prescription prescription) async {
    try {
      await ref.read(prescriptionRepositoryProvider).cancel(prescription.id);
      ref.invalidate(prescriptionsProvider);
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('$error')));
      }
    }
  }

  Future<void> _respond(Prescription prescription) async {
    final controller = TextEditingController();
    final response = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('پاسخ به فارمسست'),
        content: TextField(
          controller: controller,
          minLines: 3,
          maxLines: 5,
          decoration: const InputDecoration(
            hintText: 'توضیح مورد نیاز را بنویسید...',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('انصراف'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, controller.text.trim()),
            child: const Text('ارسال پاسخ'),
          ),
        ],
      ),
    );
    controller.dispose();
    if (response == null || response.isEmpty) return;
    try {
      await ref
          .read(prescriptionRepositoryProvider)
          .respond(prescription.id, response);
      ref.invalidate(prescriptionsProvider);
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('$error')));
      }
    }
  }

  Future<void> _addAuthorized(
    Prescription prescription,
    AuthorizedMedicine authorized,
  ) async {
    try {
      final medicine = await ref.read(
        medicineProvider(authorized.medicineId).future,
      );
      await ref
          .read(cartProvider.notifier)
          .add(medicine, prescriptionId: prescription.id);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${medicine.displayName} به سبد افزوده شد.'),
          action: SnackBarAction(
            label: 'سبد',
            onPressed: () => context.go('/cart'),
          ),
        ),
      );
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('$error')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final prescriptions = ref.watch(prescriptionsProvider);
    return MainScaffold(
      index: 2,
      child: Scaffold(
        appBar: AppBar(title: const Text('نسخه‌های من')),
        body: RefreshIndicator(
          onRefresh: () async => ref.invalidate(prescriptionsProvider),
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 28),
            children: [
              const _Intro(),
              const SizedBox(height: 14),
              _UploadCard(
                file: _file,
                patientController: _patientController,
                phoneController: _phoneController,
                noteController: _noteController,
                progress: _progress,
                error: _error,
                submitting: _submitting,
                onPick: _pick,
                onSubmit: _submit,
              ),
              const SizedBox(height: 24),
              Text(
                'تاریخچه نسخه‌ها',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 12),
              prescriptions.when(
                loading: () => const SkeletonBox(height: 180),
                error: (error, _) => AsyncMessage(
                  message: '$error',
                  onRetry: () => ref.invalidate(prescriptionsProvider),
                ),
                data: (items) => items.isEmpty
                    ? const EmptyMessage(
                        'هنوز نسخه‌ای ندارید',
                        'پس از ارسال، وضعیت بررسی در همین‌جا نمایش داده می‌شود.',
                        icon: Icons.assignment_outlined,
                      )
                    : Column(
                        children: items
                            .map(
                              (item) => Padding(
                                padding: const EdgeInsets.only(bottom: 12),
                                child: _PrescriptionCard(
                                  prescription: item,
                                  requestedMedicineId:
                                      widget.requestedMedicineId,
                                  onCancel: () => _cancel(item),
                                  onRespond: () => _respond(item),
                                  onAdd: (authorized) =>
                                      _addAuthorized(item, authorized),
                                ),
                              ),
                            )
                            .toList(),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Intro extends StatelessWidget {
  const _Intro();

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(20),
    decoration: BoxDecoration(
      color: DarmaltonColors.mint,
      borderRadius: BorderRadius.circular(DarmaltonRadius.large),
    ),
    child: const Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'نسخه داکتر خود را ارسال کنید',
                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 19),
              ),
              SizedBox(height: 8),
              Text(
                'فایل خصوصی می‌ماند و فقط شما و تیم مجاز داروخانه آن را می‌بینید.',
              ),
            ],
          ),
        ),
        SizedBox(width: 14),
        Icon(
          Icons.assignment_add,
          size: 66,
          color: DarmaltonColors.teal,
        ),
      ],
    ),
  );
}

class _UploadCard extends StatelessWidget {
  const _UploadCard({
    required this.file,
    required this.patientController,
    required this.phoneController,
    required this.noteController,
    required this.progress,
    required this.error,
    required this.submitting,
    required this.onPick,
    required this.onSubmit,
  });

  final PlatformFile? file;
  final TextEditingController patientController;
  final TextEditingController phoneController;
  final TextEditingController noteController;
  final double? progress;
  final String error;
  final bool submitting;
  final VoidCallback onPick;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) => DarmaltonCard(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const CircleAvatar(
          radius: 38,
          backgroundColor: DarmaltonColors.mint,
          foregroundColor: DarmaltonColors.teal,
          child: Icon(Icons.cloud_upload_outlined, size: 42),
        ),
        const SizedBox(height: 12),
        const Text(
          'JPG، PNG یا PDF تا ۱۰ مگابایت',
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 12),
        OutlinedButton.icon(
          onPressed: submitting ? null : onPick,
          icon: const Icon(Icons.attach_file),
          label: Text(file?.name ?? 'انتخاب فایل نسخه'),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: patientController,
          decoration: const InputDecoration(
            labelText: 'نام مریض (اختیاری)',
            prefixIcon: Icon(Icons.person_outline),
          ),
        ),
        const SizedBox(height: 10),
        TextField(
          controller: phoneController,
          keyboardType: TextInputType.phone,
          decoration: const InputDecoration(
            labelText: 'شماره تماس',
            prefixIcon: Icon(Icons.phone_outlined),
          ),
        ),
        const SizedBox(height: 10),
        TextField(
          controller: noteController,
          minLines: 2,
          maxLines: 3,
          decoration: const InputDecoration(
            labelText: 'یادداشت (اختیاری)',
            prefixIcon: Icon(Icons.edit_note_outlined),
          ),
        ),
        if (progress != null) ...[
          const SizedBox(height: 14),
          LinearProgressIndicator(value: progress),
          const SizedBox(height: 5),
          Text(
            '${((progress ?? 0) * 100).round()}٪ ارسال شد',
            textAlign: TextAlign.center,
          ),
        ],
        if (error.isNotEmpty) ...[
          const SizedBox(height: 12),
          Text(
            error,
            style: const TextStyle(color: DarmaltonColors.danger),
          ),
        ],
        const SizedBox(height: 14),
        FilledButton.icon(
          onPressed: submitting ? null : onSubmit,
          icon: const Icon(Icons.send_outlined),
          label: Text(submitting ? 'در حال ارسال...' : 'ارسال برای بررسی'),
        ),
      ],
    ),
  );
}

class _PrescriptionCard extends StatelessWidget {
  const _PrescriptionCard({
    required this.prescription,
    required this.requestedMedicineId,
    required this.onCancel,
    required this.onRespond,
    required this.onAdd,
  });

  final Prescription prescription;
  final String? requestedMedicineId;
  final VoidCallback onCancel;
  final VoidCallback onRespond;
  final ValueChanged<AuthorizedMedicine> onAdd;

  @override
  Widget build(BuildContext context) {
    final warning = {
      'REJECTED',
      'EXPIRED',
      'CANCELLED',
    }.contains(prescription.status);
    return DarmaltonCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  prescription.patientName.isEmpty
                      ? 'نسخه مشتری'
                      : prescription.patientName,
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              StatusChip(
                label: prescriptionStatusLabel(prescription.status),
                icon: warning
                    ? Icons.cancel_outlined
                    : prescription.status == 'APPROVED'
                    ? Icons.check_circle_outline
                    : Icons.schedule_outlined,
                color: warning
                    ? DarmaltonColors.danger
                    : prescription.status == 'APPROVED'
                    ? DarmaltonColors.success
                    : DarmaltonColors.teal,
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            _date(prescription.createdAt),
            style: Theme.of(context).textTheme.bodySmall,
          ),
          if (prescription.customerVisibleNote.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(prescription.customerVisibleNote),
          ],
          if (prescription.clarificationRequest.isNotEmpty) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF4D8),
                borderRadius: BorderRadius.circular(DarmaltonRadius.small),
              ),
              child: Text(
                'توضیح خواسته‌شده: ${prescription.clarificationRequest}',
              ),
            ),
          ],
          if (prescription.authorizedMedicines.isNotEmpty) ...[
            const SizedBox(height: 14),
            const Text(
              'دواهای تأییدشده',
              style: TextStyle(fontWeight: FontWeight.w700),
            ),
            ...prescription.authorizedMedicines.map(
              (authorized) => ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(authorized.medicineName),
                subtitle: Text(
                  'تا ${authorized.maxQuantity} عدد'
                  '${authorized.instructions.isEmpty ? '' : ' · ${authorized.instructions}'}',
                ),
                trailing: IconButton.filledTonal(
                  tooltip: 'افزودن به سبد',
                  onPressed:
                      requestedMedicineId == null ||
                          requestedMedicineId == authorized.medicineId
                      ? () => onAdd(authorized)
                      : null,
                  icon: const Icon(Icons.add_shopping_cart_outlined),
                ),
              ),
            ),
          ],
          if (prescription.canRespond) ...[
            const SizedBox(height: 10),
            FilledButton(
              onPressed: onRespond,
              child: const Text('پاسخ به فارمسست'),
            ),
          ],
          if (prescription.canCancel)
            TextButton(
              onPressed: onCancel,
              style: TextButton.styleFrom(
                foregroundColor: DarmaltonColors.danger,
              ),
              child: const Text('لغو درخواست'),
            ),
        ],
      ),
    );
  }
}

String _date(DateTime value) {
  final date = value.toLocal();
  return '${date.year.toString().padLeft(4, '0')}/'
      '${date.month.toString().padLeft(2, '0')}/'
      '${date.day.toString().padLeft(2, '0')}';
}
