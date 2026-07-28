"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { ApiError, apiFetch } from "@/lib/api";
import { loginPath } from "@/lib/auth-navigation";
import type { PageResult, Prescription } from "@/lib/types";

const statusLabels: Record<string, string> = {
  SUBMITTED: "ارسال‌شده",
  UNDER_REVIEW: "در حال بررسی",
  CLARIFICATION_REQUESTED: "نیازمند توضیح",
  APPROVED: "تأییدشده",
  REJECTED: "ردشده",
  EXPIRED: "منقضی‌شده",
  CANCELLED: "لغوشده"
};

function uploadWithProgress(
  formData: FormData,
  onProgress: (value: number) => void
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
        "نسخه ارسال نشد. فایل و اتصال خود را بررسی کنید.";
      reject(new Error(message));
    };
    request.onerror = () =>
      reject(new Error("ارتباط با سرور برقرار نشد. دوباره کوشش کنید."));
    request.send(formData);
  });
}

export default function PrescriptionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedMedicineId = searchParams.get("medicineId");
  const formRef = useRef<HTMLFormElement>(null);
  const [items, setItems] = useState<Prescription[] | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [responses, setResponses] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<PageResult<Prescription>>("prescriptions/");
      setItems(data.results);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push(loginPath("/prescriptions"));
        return;
      }
      setError(err instanceof Error ? err.message : "نسخه‌ها بار نشد.");
    }
  }, [router]);

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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedFile) {
      setError("نخست عکس یا فایل نسخه را انتخاب کنید.");
      return;
    }
    setBusy(true);
    setError("");
    setSuccess("");
    setProgress(0);
    try {
      const data = new FormData(event.currentTarget);
      data.set("document", selectedFile);
      await uploadWithProgress(data, setProgress);
      setSuccess("نسخه با موفقیت ارسال شد و در صف بررسی قرار گرفت.");
      setSelectedFile(null);
      setProgress(null);
      formRef.current?.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "نسخه ارسال نشد.");
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
      setError(err instanceof Error ? err.message : "درخواست انجام نشد.");
    }
  }

  async function addAuthorized(
    prescriptionId: string,
    medicineId: string
  ) {
    setError("");
    try {
      await apiFetch("cart/items/", {
        method: "POST",
        body: JSON.stringify({
          medicine_id: medicineId,
          prescription_id: prescriptionId,
          quantity: 1
        })
      });
      router.push("/cart");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "دوا به سبد افزوده نشد."
      );
    }
  }

  return (
    <section className="page-section prescription-page">
      <div className="prescription-heading">
        <div>
          <p className="eyebrow">بررسی امن توسط فارمسست</p>
          <h1>نسخه‌های من</h1>
          <p className="muted">
            نسخه به‌صورت خصوصی نگهداری می‌شود و فقط شما و تیم مجاز داروخانه
            به آن دسترسی دارید.
          </p>
        </div>
        <span aria-hidden="true">Rx</span>
      </div>

      <form ref={formRef} className="panel prescription-form" onSubmit={submit}>
        <h2>ارسال نسخه جدید</h2>
        <p className="muted">JPG، PNG یا PDF تا ۱۰ مگابایت</p>
        <label className="file-drop">
          <span>انتخاب عکس یا فایل نسخه</span>
          <input
            type="file"
            name="document"
            accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
            onChange={(event) =>
              setSelectedFile(event.target.files?.[0] || null)
            }
            required
          />
          <small>{selectedFile?.name || "هیچ فایلی انتخاب نشده است"}</small>
        </label>
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="prescription-preview" src={preview} alt="پیش‌نمایش نسخه" />
        )}
        <div className="form-grid">
          <label>
            <span>نام مریض (اختیاری)</span>
            <input name="patient_name" maxLength={180} />
          </label>
          <label>
            <span>شماره تماس</span>
            <input name="contact_phone" dir="ltr" maxLength={32} />
          </label>
          <label className="full">
            <span>یادداشت (اختیاری)</span>
            <input name="customer_note" maxLength={1000} />
          </label>
        </div>
        {progress !== null && (
          <div className="upload-progress" aria-live="polite">
            <span style={{ width: `${progress}%` }} />
            <small>{progress.toLocaleString("fa-AF")}٪ ارسال شد</small>
          </div>
        )}
        {error && <p className="form-error" role="alert">{error}</p>}
        {success && <p className="success-banner">{success}</p>}
        <button className="wide" disabled={busy}>
          {busy ? "در حال ارسال..." : "ارسال برای بررسی"}
        </button>
      </form>

      <h2 className="subheading">تاریخچه نسخه‌ها</h2>
      {!items && !error && <div className="loading">در حال بارگذاری...</div>}
      {items?.length === 0 && (
        <div className="empty-state">
          <h2>هنوز نسخه‌ای ندارید</h2>
          <p>پس از ارسال، وضعیت بررسی در همین‌جا نشان داده می‌شود.</p>
        </div>
      )}
      <div className="prescription-list">
        {items?.map((item) => (
          <article className="prescription-card" key={item.id}>
            <div className="prescription-card-title">
              <div>
                <span className={`status status-${item.status.toLowerCase()}`}>
                  {statusLabels[item.status] || item.status}
                </span>
                <h3>{item.patient_name || "نسخه مشتری"}</h3>
                <small>
                  {new Date(item.created_at).toLocaleString("fa-AF")}
                </small>
              </div>
              <Link
                className="secondary button"
                href={`/api/backend/prescriptions/${item.id}/file/?download=1`}
              >
                مشاهده فایل
              </Link>
            </div>
            {item.customer_visible_note && <p>{item.customer_visible_note}</p>}
            {item.clarification_request && (
              <div className="clarification-box">
                <strong>توضیح خواسته‌شده</strong>
                <p>{item.clarification_request}</p>
              </div>
            )}
            {item.can_respond && (
              <div className="clarification-response">
                <label>
                  <span>پاسخ شما</span>
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
                  ارسال پاسخ
                </button>
              </div>
            )}
            {item.authorized_medicines.length > 0 && (
              <div className="authorized-list">
                <strong>دواهای تأییدشده</strong>
                {item.authorized_medicines.map((authorized) => (
                  <div className="authorized-row" key={authorized.id}>
                    <p>
                      {authorized.medicine_name} — تا{" "}
                      {authorized.max_quantity.toLocaleString("fa-AF")} عدد
                    </p>
                    <button
                      disabled={
                        requestedMedicineId !== null &&
                        requestedMedicineId !== authorized.medicine_id
                      }
                      onClick={() =>
                        addAuthorized(item.id, authorized.medicine_id)
                      }
                    >
                      افزودن به سبد
                    </button>
                  </div>
                ))}
              </div>
            )}
            {item.can_cancel && (
              <button
                className="danger-link"
                onClick={() => act(item.id, "cancel")}
              >
                لغو درخواست
              </button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
