import 'dart:io';

import 'package:darmalton_pharmacy/src/core/models.dart';
import 'package:darmalton_pharmacy/src/core/providers.dart';
import 'package:darmalton_pharmacy/src/features/prescription/prescription_picker.dart';
import 'package:darmalton_pharmacy/src/features/prescription/prescription_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

class FakePicker implements PrescriptionPickerGateway {
  PrescriptionDocument? result;
  Object? error;

  @override
  Future<PrescriptionDocument?> pick(PrescriptionPickSource source) async {
    if (error != null) throw error!;
    return result;
  }
}

class FakePrescriptionRepository implements PrescriptionRepositoryBase {
  int failuresRemaining = 0;
  int uploads = 0;

  @override
  Future<Prescription> upload({
    required String filePath,
    required String filename,
    required Map<String, String> fields,
    void Function(int sent, int total)? onProgress,
  }) async {
    uploads += 1;
    onProgress?.call(5, 10);
    if (failuresRemaining > 0) {
      failuresRemaining -= 1;
      throw Exception('temporary upload failure');
    }
    return Prescription(
      id: 'prescription-id',
      patientName: '',
      status: 'SUBMITTED',
      customerVisibleNote: '',
      clarificationRequest: '',
      customerResponse: '',
      createdAt: DateTime.utc(2026),
      canCancel: true,
      canRespond: false,
      canAddToCart: false,
      authorizedMedicines: const [],
      history: const [],
    );
  }

  @override
  Future<void> cancel(String id) async {}

  @override
  Future<void> respond(String id, String message) async {}
}

Widget harness(FakePicker picker, FakePrescriptionRepository repository) =>
    ProviderScope(
      overrides: [
        prescriptionPickerProvider.overrideWithValue(picker),
        prescriptionRepositoryProvider.overrideWithValue(repository),
        prescriptionsProvider.overrideWith((ref) async => const []),
      ],
      child: const MaterialApp(home: PrescriptionScreen()),
    );

Future<void> openPicker(WidgetTester tester) async {
  await tester.tap(find.byKey(const Key('prescription-source-button')));
  await tester.pumpAndSettle();
}

void main() {
  testWidgets('prescription source sheet exposes camera, gallery, and file', (
    tester,
  ) async {
    await tester.pumpWidget(
      harness(FakePicker(), FakePrescriptionRepository()),
    );
    await tester.pumpAndSettle();
    await openPicker(tester);

    expect(find.text('عکس گرفتن'), findsOneWidget);
    expect(find.text('انتخاب از گالری'), findsOneWidget);
    expect(find.text('انتخاب فایل'), findsOneWidget);
  });

  testWidgets('camera permission denial is explained', (tester) async {
    final picker = FakePicker()
      ..error = PlatformException(code: 'camera_access_denied');
    await tester.pumpWidget(harness(picker, FakePrescriptionRepository()));
    await tester.pumpAndSettle();
    await openPicker(tester);
    await tester.tap(find.byKey(const Key('prescription-camera-option')));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.textContaining('اجازه دسترسی داده نشد'), findsOneWidget);
  });

  testWidgets('cancelled capture leaves the upload empty', (tester) async {
    await tester.pumpWidget(
      harness(FakePicker(), FakePrescriptionRepository()),
    );
    await tester.pumpAndSettle();
    await openPicker(tester);
    await tester.tap(find.byKey(const Key('prescription-camera-option')));
    await tester.pumpAndSettle();

    expect(find.text('افزودن عکس یا فایل نسخه'), findsOneWidget);
    expect(find.text('عکس دوباره'), findsNothing);
  });

  testWidgets('captured image previews with retake controls', (tester) async {
    final image = File('assets/branding/landing-hero.png');
    final imageLength = await tester.runAsync(image.length);
    final picker = FakePicker()
      ..result = PrescriptionDocument(
        path: image.path,
        name: 'prescription.jpg',
        size: imageLength!,
        temporary: false,
        isImage: true,
      );
    await tester.pumpWidget(harness(picker, FakePrescriptionRepository()));
    await tester.pumpAndSettle();
    await openPicker(tester);
    await tester.tap(find.byKey(const Key('prescription-camera-option')));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.text('prescription.jpg'), findsOneWidget);
    expect(find.text('عکس دوباره'), findsOneWidget);
  });

  testWidgets('failed upload can retry and succeeds without losing selection', (
    tester,
  ) async {
    final directory = await tester.runAsync(
      () => Directory.systemTemp.createTemp('darmalton-rx-test'),
    );
    addTearDown(() => directory!.deleteSync(recursive: true));
    final document = File('${directory!.path}/prescription.pdf');
    await tester.runAsync(
      () => document.writeAsBytes([0x25, 0x50, 0x44, 0x46]),
    );
    final picker = FakePicker()
      ..result = PrescriptionDocument(
        path: document.path,
        name: 'prescription.pdf',
        size: document.lengthSync(),
        temporary: false,
        isImage: false,
      );
    final repository = FakePrescriptionRepository()..failuresRemaining = 1;
    await tester.pumpWidget(harness(picker, repository));
    await tester.pumpAndSettle();
    await openPicker(tester);
    await tester.tap(find.byKey(const Key('prescription-camera-option')));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));
    expect(find.text('prescription.pdf'), findsOneWidget);

    final uploadButton = find.byKey(const Key('prescription-upload-button'));
    await tester.ensureVisible(uploadButton);
    await tester.pumpAndSettle();
    await tester.tap(uploadButton);
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));
    expect(find.textContaining('temporary upload failure'), findsOneWidget);
    expect(find.text('prescription.pdf'), findsOneWidget);

    await tester.tap(uploadButton);
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));
    expect(repository.uploads, 2);
    expect(find.textContaining('نسخه با موفقیت ارسال شد'), findsOneWidget);
  });

  test('temporary documents are removed after use', () async {
    final directory = await Directory.systemTemp.createTemp(
      'darmalton-rx-cleanup-test',
    );
    addTearDown(() => directory.deleteSync(recursive: true));
    final document = File('${directory.path}/prescription.pdf');
    await document.writeAsBytes([0x25, 0x50, 0x44, 0x46]);
    final selected = PrescriptionDocument(
      path: document.path,
      name: 'prescription.pdf',
      size: await document.length(),
      temporary: true,
      isImage: false,
    );

    await selected.deleteIfTemporary();

    expect(document.existsSync(), isFalse);
  });

  test('oversized and invalid prescription documents are rejected', () {
    const oversized = PrescriptionDocument(
      path: 'unused',
      name: 'prescription.jpg',
      size: maxPrescriptionBytes + 1,
      temporary: false,
      isImage: true,
    );
    const invalid = PrescriptionDocument(
      path: 'unused',
      name: 'prescription.exe',
      size: 10,
      temporary: false,
      isImage: false,
    );
    expect(
      () => validatePrescriptionDocument(oversized),
      throwsFormatException,
    );
    expect(() => validatePrescriptionDocument(invalid), throwsFormatException);
  });
}
