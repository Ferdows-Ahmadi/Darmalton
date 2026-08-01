import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

const maxPrescriptionBytes = 10 * 1024 * 1024;

enum PrescriptionPickSource { camera, gallery, file }

class PrescriptionDocument {
  const PrescriptionDocument({
    required this.path,
    required this.name,
    required this.size,
    required this.temporary,
    required this.isImage,
  });

  final String path;
  final String name;
  final int size;
  final bool temporary;
  final bool isImage;

  Future<void> deleteIfTemporary() async {
    if (!temporary) return;
    final file = File(path);
    if (await file.exists()) await file.delete();
  }
}

abstract interface class PrescriptionPickerGateway {
  Future<PrescriptionDocument?> pick(PrescriptionPickSource source);
}

class SystemPrescriptionPickerGateway implements PrescriptionPickerGateway {
  SystemPrescriptionPickerGateway({ImagePicker? imagePicker})
    : _imagePicker = imagePicker ?? ImagePicker();

  final ImagePicker _imagePicker;

  @override
  Future<PrescriptionDocument?> pick(PrescriptionPickSource source) async {
    if (source == PrescriptionPickSource.file) {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: const ['jpg', 'jpeg', 'png', 'pdf'],
        allowMultiple: false,
      );
      if (result == null || result.files.single.path == null) return null;
      final selected = result.files.single;
      return validatePrescriptionDocument(
        PrescriptionDocument(
          path: selected.path!,
          name: selected.name,
          size: selected.size,
          temporary: false,
          isImage: _isImageName(selected.name),
        ),
      );
    }

    final image = await _imagePicker.pickImage(
      source: source == PrescriptionPickSource.camera
          ? ImageSource.camera
          : ImageSource.gallery,
      imageQuality: 95,
      maxWidth: 3200,
      maxHeight: 3200,
      requestFullMetadata: false,
    );
    if (image == null) return null;
    final correctedPath = '${image.path}.review.jpg';
    final corrected = await FlutterImageCompress.compressAndGetFile(
      image.path,
      correctedPath,
      minWidth: 1800,
      minHeight: 1800,
      quality: 88,
      format: CompressFormat.jpeg,
      autoCorrectionAngle: true,
      keepExif: false,
    );
    final selected = corrected ?? image;
    if (selected.path != image.path) {
      final original = File(image.path);
      if (await original.exists()) await original.delete();
    }
    final document = PrescriptionDocument(
      path: selected.path,
      name: 'prescription-${DateTime.now().millisecondsSinceEpoch}.jpg',
      size: await selected.length(),
      temporary: true,
      isImage: true,
    );
    try {
      return validatePrescriptionDocument(document);
    } on Object {
      await document.deleteIfTemporary();
      rethrow;
    }
  }

  bool _isImageName(String name) {
    final extension = name.split('.').last.toLowerCase();
    return {'jpg', 'jpeg', 'png'}.contains(extension);
  }
}

PrescriptionDocument validatePrescriptionDocument(
  PrescriptionDocument document,
) {
  final extension = document.name.split('.').last.toLowerCase();
  if (!{'jpg', 'jpeg', 'png', 'pdf'}.contains(extension)) {
    throw const FormatException('فقط فایل‌های JPG، PNG یا PDF پذیرفته می‌شود.');
  }
  if (document.size <= 0 || document.size > maxPrescriptionBytes) {
    throw const FormatException('حجم نسخه باید کمتر از ۱۰ مگابایت باشد.');
  }
  return document;
}

final prescriptionPickerProvider = Provider<PrescriptionPickerGateway>(
  (ref) => SystemPrescriptionPickerGateway(),
);
