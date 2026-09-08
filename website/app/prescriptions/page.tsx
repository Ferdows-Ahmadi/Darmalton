"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { ApiError, apiFetch } from "@/lib/api";
import { loginPath } from "@/lib/auth-navigation";
import { AccountShell } from "@/components/AccountShell";
import { useLocale } from "@/components/LocaleProvider";
import { Toast } from "@/components/Toast";
import { prescriptionStatus } from "@/lib/status";
import { formatNumber } from "@/lib/locale";
import type { PageResult, Prescription } from "@/lib/types";

function uploadWithProgress(
  formData: FormData,
  onProgress: (value: number) => void,
  failureMessage: string
) {
  return new Promise<Prescription>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", "/api/backend/prescriptions/");
    request.responseType = "json";
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        resolve(request.response as Prescription);
        return;
      }
      const message =
        request.response?.error?.message ||
        failureMessage;
      reject(new Error(message));
    };
    request.onerror = () =>
      reject(new Error(failureMessage));
    request.send(formData);
  });
}

export default function PrescriptionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedMedicineId = searchParams.get("medicineId");
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Prescription[] | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [responses, setResponses] = useState<Record<string, string>>({});
  const { locale, t } = useLocale();
  const copy = locale === "en"
    ? { kicker: "Private pharmacist review", new: "Submit a new prescription", none: "Drop a file here or choose from your device", preview: "Prescription preview", select: "Choose a prescription photo or document first.", replace: "Replace file", removeFile: "Remove file", camera: "Camera, gallery or document", uploadFailure: "The prescription could not be submitted. Check the file and connection.", history: "Prescription history", historyBody: "Review status will appear here after submission.", customer: "Customer prescription", requested: "Clarification requested", upTo: "up to", units: "units", added: "approved medicines were added to your cart. Review your cart and confirm checkout yourself.", already: "The approved medicines are already in your cart.", addFailure: "The medicines could not be added to the cart.", addNote: "No order is created yet. Review price, availability, address and cash payment before final confirmation.", cancelling: "Cancel request", uploading: "Uploading…", uploaded: "uploaded", submitFailure: "The request could not be completed." }
    : locale === "fa-AF"
      ? { kicker: "بررسی امن توسط فارمسست", new: "ارسال نسخه جدید", none: "فایل را اینجا بکشید یا از دستگاه انتخاب کنید", preview: "پیش‌نمایش نسخه", select: "نخست عکس یا فایل نسخه را انتخاب کنید.", replace: "تغییر فایل", removeFile: "حذف فایل", camera: "دوربین، گالری یا فایل", uploadFailure: "نسخه ارسال نشد. فایل و اتصال خود را بررسی کنید.", history: "تاریخچه نسخه‌ها", historyBody: "پس از ارسال، وضعیت بررسی در همین‌جا نشان داده می‌شود.", customer: "نسخه مشتری", requested: "توضیح خواسته‌شده", upTo: "تا", units: "عدد", added: "دوای تأییدشده به سبد افزوده شد. سبد را بررسی و خودتان پرداخت را تأیید کنید.", already: "دواهای تأییدشده از قبل در سبد شما است.", addFailure: "دوا به سبد افزوده نشد.", addNote: "سفارش ساخته نمی‌شود؛ قیمت، موجودی، آدرس و پرداخت نقدی را پیش از ثبت نهایی بررسی می‌کنید.", cancelling: "لغو درخواست", uploading: "در حال ارسال…", uploaded: "ارسال شد", submitFailure: "درخواست انجام نشد." }
      : { kicker: "د درملپوه خوندي کتنه", new: "نوې نسخه لېږل", none: "فایل دلته راکش کړئ یا یې له وسیلې وټاکئ", preview: "د نسخې مخکتنه", select: "لومړی د نسخې انځور یا فایل وټاکئ.", replace: "فایل بدلول", removeFile: "فایل لرې کول", camera: "کمره، انځورونه یا سند", uploadFailure: "نسخه ونه لېږل شوه. فایل او اړیکه وګورئ.", history: "د نسخو تاریخچه", historyBody: "له لېږلو وروسته د کتنې حالت دلته ښکاري.", customer: "د پېرودونکي نسخه", requested: "وضاحت غوښتل شوی", upTo: "تر", units: "دانې", added: "تایید شوي درمل ټوکرۍ ته زیات شول. خپله ټوکرۍ وګورئ او فرمایش تایید کړئ.", already: "تایید شوي درمل لا له مخکې په ټوکرۍ کې دي.", addFailure: "درمل ټوکرۍ ته زیات نه شول.", addNote: "تر اوسه فرمایش نه جوړېږي. بیه، موجودي، پته او نغدي تادیه له وروستي تایید مخکې وګورئ.", cancelling: "غوښتنه لغوه کول", uploading: "لېږل کېږي…", uploaded: "ولېږل شوه", submitFailure: "غوښتنه ترسره نه شوه." };

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<PageResult<Prescription>>("prescriptions/");
      setItems(data.results);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push(loginPath("/account/prescriptions"));
        return;
      }
      setError(err instanceof Error ? err.message : t("connection"));
    }
  }, [router, t]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!selectedFile?.type.startsWith("image/")) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  function chooseFile(file: File | null) {
    if (!file) return;
    const accepted = ["image/jpeg", "image/png", "application/pdf"];
    if (!accepted.includes(file.type) || file.size > 10 * 1024 * 1024) {
      setError(t("uploadHint"));
      return;
    }
    setSelectedFile(file);
    setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedFile) {
      setError(copy.select);
      return;
    }
    setBusy(true);
    setError("");
    setSuccess("");
    setProgress(0);
    try {
      const data = new FormData(event.currentTarget);
      data.set("document", selectedFile);
      const created = await uploadWithProgress(data, setProgress, copy.uploadFailure);
      setSelectedFile(null);
      setProgress(null);
      formRef.current?.reset();
      router.push(`/prescriptions/success/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.uploadFailure);
    } finally {
      setBusy(false);
    }
  }

  async function act(id: string, action: "cancel" | "respond") {
    setError("");
    try {
      await apiFetch(`prescriptions/${id}/${action}/`, {
        method: "POST",
        body:
          action === "respond"
            ? JSON.stringify({ response: responses[id] || "" })
            : JSON.stringify({})
      });
      setResponses((current) => ({ ...current, [id]: "" }));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.submitFailure);
    }
  }

  async function addAuthorizedBundle(prescriptionId: string) {
    setError("");
    try {
      const result = await apiFetch<{added_count: number; already_present_count: number}>(`prescriptions/${prescriptionId}/add-authorized-to-cart/`, {
        method: "POST",
        body: JSON.stringify({})
      });
      setSuccess(result.added_count > 0
        ? `${formatNumber(result.added_count, locale)} ${copy.added}`
        : copy.already);
      router.push("/cart");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : copy.addFailure
      );
    }
  }

  return (
    <section className="page-section prescription-page">
      <AccountShell>
      <div className="prescription-heading">
        <div>
          <p className="eyebrow">{copy.kicker}</p>
          <h1>{t("rxList")}</h1>
          <p className="muted">{t("rxPrivate")}</p>
        </div>
        <span aria-hidden="true">Rx</span>
      </div>

      <form ref={formRef} className="panel prescription-form" onSubmit={submit}>
        <h2>{copy.new}</h2>
        <p className="muted">{t("uploadHint")}</p>
        <label
          className={`file-drop${dragging ? " is-dragging" : ""}${selectedFile ? " has-file" : ""}`}
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            chooseFile(event.dataTransfer.files?.[0] || null);
          }}
        >
          <span className="file-drop-icon" aria-hidden="true">＋</span>
          <strong>{selectedFile ? selectedFile.name : copy.none}</strong>
          <span className="file-drop-action">{selectedFile ? copy.replace : t("chooseFile")}</span>
          <small>{copy.camera}</small>
          <small>{t("uploadHint")}</small>
          <input
            ref={inputRef}
            className="sr-only"
            type="file"
            name="document"
            accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
            onChange={(event) => chooseFile(event.target.files?.[0] || null)}
          />
        </label>
        {selectedFile && <div className="prescription-file-preview">
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="prescription-preview" src={preview} alt={copy.preview} />
          )}
          <div className="actions">
            <button type="button" className="secondary" onClick={() => inputRef.current?.click()}>{copy.replace}</button>
            <button type="button" className="danger-link" onClick={() => { setSelectedFile(null); if (inputRef.current) inputRef.current.value = ""; }}>{copy.removeFile}</button>
          </div>
        </div>}
        <div className="form-grid">
          <label>
            <span>{t("patient")} ({t("optional")})</span>
            <input name="patient_name" maxLength={180} />
          </label>
          <label>
            <span>{t("phone")}</span>
            <input name="contact_phone" dir="ltr" maxLength={32} />
          </label>
          <label className="full">
            <span>{t("notes")} ({t("optional")})</span>
            <input name="customer_note" maxLength={1000} />
          </label>
        </div>
        {progress !== null && (
          <div className="upload-progress" aria-live="polite">
            <span style={{ width: `${progress}%` }} />
            <small>{formatNumber(progress, locale)}% {copy.uploaded}</small>
          </div>
        )}
        {error && <Toast kind="error" message={error} />}
        {success && <Toast kind="success" message={success} />}
        <button className="wide" disabled={busy}>
          {busy ? copy.uploading : t("submitRx")}
        </button>
      </form>

      <h2 className="subheading">{copy.history}</h2>
      {!items && !error && <div className="loading">{t("loading")}</div>}
      {items?.length === 0 && (
        <div className="empty-state">
          <h2>{t("noRx")}</h2>
          <p>{copy.historyBody}</p>
        </div>
      )}
      <div className="prescription-list">
        {items?.map((item) => (
          <article className="prescription-card" key={item.id}>
            <div className="prescription-card-title">
              <div>
                <span className={`status status-${item.status.toLowerCase()}`}>
                  {prescriptionStatus(item.status, locale)}
                </span>
                <h3>{item.patient_name || copy.customer}</h3>
                <small>
                  {new Date(item.created_at).toLocaleString(locale)}
                </small>
              </div>
              <Link
                className="secondary button"
                href={`/api/backend/prescriptions/${item.id}/file/?download=1`}
              >
                {t("file")}
              </Link>
            </div>
            {item.customer_visible_note && <p>{item.customer_visible_note}</p>}
            {item.clarification_request && (
              <div className="clarification-box">
                <strong>{copy.requested}</strong>
                <p>{item.clarification_request}</p>
              </div>
            )}
            {item.can_respond && (
              <div className="clarification-response">
                <label>
                  <span>{t("response")}</span>
                  <input
                    value={responses[item.id] || ""}
                    onChange={(event) =>
                      setResponses((current) => ({
                        ...current,
                        [item.id]: event.target.value
                      }))
                    }
                  />
                </label>
                <button onClick={() => act(item.id, "respond")}>
                  {t("send")}
                </button>
              </div>
            )}
            {item.authorized_medicines.length > 0 && (
              <div className="authorized-list">
                <strong>{t("authorized")}</strong>
                {item.authorized_medicines.map((authorized) => (
                  <div className="authorized-row" key={authorized.id}>
                    <p>
                      {authorized.medicine_name} — {copy.upTo}{" "}
                      {formatNumber(authorized.max_quantity, locale)} {copy.units}
                    </p>
                  </div>
                ))}
                {item.can_add_to_cart &&
                  (requestedMedicineId === null || item.authorized_medicines.some((authorized) => authorized.medicine_id === requestedMedicineId)) && (
                  <div className="authorized-bundle-action">
                    <button onClick={() => addAuthorizedBundle(item.id)}>
                      {t("addBundle")}
                    </button>
                    <small>{copy.addNote}</small>
                  </div>
                )}
              </div>
            )}
            {item.can_cancel && (
              <button
                className="danger-link"
                onClick={() => act(item.id, "cancel")}
              >
                {copy.cancelling}
              </button>
            )}
          </article>
        ))}
      </div>
      </AccountShell>
    </section>
  );
}
