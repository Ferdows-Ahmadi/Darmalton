"use client";

import { useEffect, useState } from "react";

type StaffPreferences = {
  compactTables: boolean;
  reduceMotion: boolean;
  refreshMinutes: string;
};

const defaults: StaffPreferences = {
  compactTables: false,
  reduceMotion: false,
  refreshMinutes: "5"
};

export default function StaffSettingsPage() {
  const [preferences, setPreferences] = useState(defaults);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("darmalton-staff-preferences");
    if (stored) {
      try {
        setPreferences({ ...defaults, ...JSON.parse(stored) });
      } catch {
        window.localStorage.removeItem("darmalton-staff-preferences");
      }
    }
  }, []);

  function save() {
    window.localStorage.setItem(
      "darmalton-staff-preferences",
      JSON.stringify(preferences)
    );
    document.documentElement.classList.toggle(
      "staff-compact",
      preferences.compactTables
    );
    document.documentElement.classList.toggle(
      "staff-reduce-motion",
      preferences.reduceMotion
    );
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }

  return (
    <section className="staff-page">
      <header className="staff-page-heading">
        <div>
          <span className="staff-eyebrow">ترجیحات این دستگاه</span>
          <h1>تنظیمات پنل</h1>
          <p>نمای جدول و رفتار پنل را بدون تغییر قواعد سرور شخصی‌سازی کنید.</p>
        </div>
      </header>
      <div className="staff-settings-grid">
        <article className="staff-panel staff-settings-card">
          <h2>نمایش</h2>
          <label className="staff-switch-row">
            <span>
              <strong>جدول‌های فشرده</strong>
              <small>ردیف‌های بیشتر را در یک صفحه ببینید.</small>
            </span>
            <input
              type="checkbox"
              checked={preferences.compactTables}
              onChange={(event) =>
                setPreferences((value) => ({
                  ...value,
                  compactTables: event.target.checked
                }))
              }
            />
          </label>
          <label className="staff-switch-row">
            <span>
              <strong>کاهش حرکت</strong>
              <small>انیمیشن‌های غیرضروری پنل را محدود می‌کند.</small>
            </span>
            <input
              type="checkbox"
              checked={preferences.reduceMotion}
              onChange={(event) =>
                setPreferences((value) => ({
                  ...value,
                  reduceMotion: event.target.checked
                }))
              }
            />
          </label>
        </article>
        <article className="staff-panel staff-settings-card">
          <h2>تازه‌سازی</h2>
          <label>
            <span>فاصله پیشنهادی تازه‌سازی</span>
            <select
              value={preferences.refreshMinutes}
              onChange={(event) =>
                setPreferences((value) => ({
                  ...value,
                  refreshMinutes: event.target.value
                }))
              }
            >
              <option value="2">هر ۲ دقیقه</option>
              <option value="5">هر ۵ دقیقه</option>
              <option value="10">هر ۱۰ دقیقه</option>
              <option value="manual">فقط دستی</option>
            </select>
          </label>
          <p>
            قیمت، موجودی، سفارش و نسخه از حافظه محلی خوانده نمی‌شوند و همیشه باید
            از سرور تازه شوند.
          </p>
        </article>
      </div>
      <div className="staff-settings-actions">
        <button className="staff-primary-action" onClick={save}>
          ذخیره تنظیمات
        </button>
        {saved && <span role="status">تنظیمات این دستگاه ذخیره شد.</span>}
      </div>
    </section>
  );
}
