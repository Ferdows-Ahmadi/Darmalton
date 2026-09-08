import type { Locale } from "./locale";
import type { Category, Manufacturer, Medicine } from "./types";

export const shopperCategories = [
  {
    slug: "medicines",
    image: "/categories/WEB-025_Category_Medicines.webp",
    labels: ["Medicines", "داروها", "درمل"]
  },
  {
    slug: "vitamins-supplements",
    image: "/categories/WEB-026_Category_Vitamins-and-Supplements.webp",
    labels: ["Vitamins & supplements", "ویتامین‌ها و مکمل‌ها", "ویټامینونه او بشپړوونکي"]
  },
  {
    slug: "personal-care",
    image: "/categories/WEB-027_Category_Personal-Care.webp",
    labels: ["Personal care", "مراقبت شخصی", "شخصي پاملرنه"]
  },
  {
    slug: "baby-care",
    image: "/categories/WEB-028_Category_Baby-Care.webp",
    labels: ["Baby care", "مراقبت کودک", "د ماشوم پاملرنه"]
  },
  {
    slug: "medical-devices",
    image: "/categories/WEB-029_Category_Medical-Devices.webp",
    labels: ["Medical devices", "تجهیزات طبی", "طبي وسایل"]
  },
  {
    slug: "skin-care",
    image: "/categories/WEB-030_Category_Skin-Care.webp",
    labels: ["Skin care", "مراقبت پوست", "د پوستکي پاملرنه"]
  }
] as const;

export type ShopperCategorySlug = (typeof shopperCategories)[number]["slug"];

function localeIndex(locale: Locale) {
  return locale === "en" ? 0 : locale === "fa-AF" ? 1 : 2;
}

export function shopperCategoryLabel(
  category: (typeof shopperCategories)[number],
  locale: Locale
) {
  return category.labels[localeIndex(locale)];
}

export function categoryName(category: Category, locale: Locale) {
  if (locale === "en") return category.name;
  if (locale === "ps-AF") return category.name_pashto || category.name_dari || category.name;
  return category.name_dari || category.name;
}

export function manufacturerName(manufacturer: Manufacturer, locale: Locale) {
  if (locale === "en") return manufacturer.name;
  if (locale === "ps-AF") {
    return manufacturer.name_pashto || manufacturer.name_dari || manufacturer.name;
  }
  return manufacturer.name_dari || manufacturer.name;
}

const dosageTranslations: Record<string, [string, string]> = {
  tablet: ["قرص", "ګولۍ"],
  tablets: ["قرص", "ګولۍ"],
  capsule: ["کپسول", "کپسول"],
  capsules: ["کپسول", "کپسول"],
  syrup: ["شربت", "شربت"],
  suspension: ["سوسپانسیون", "تعلیق"],
  vial: ["ویال", "ویال"],
  injection: ["تزریق", "ستنه"],
  cream: ["کریم", "کریم"],
  ointment: ["مرهم", "مرهم"],
  gel: ["ژل", "جیل"],
  drops: ["قطره", "څاڅکي"],
  inhaler: ["دستگاه تنفسی", "تنفسي اله"],
  infusion: ["انفیوژن", "انفیوژن"],
  "chewable tablet": ["قرص جویدنی", "ژوول کېدونکې ګولۍ"]
};

export function dosageFormName(medicine: Medicine, locale: Locale) {
  if (locale === "en") return medicine.dosage_form.name;
  const supplied = locale === "ps-AF"
    ? medicine.dosage_form.name_pashto || medicine.dosage_form.name_dari
    : medicine.dosage_form.name_dari;
  if (supplied) return supplied;
  const translated = dosageTranslations[medicine.dosage_form.name.trim().toLowerCase()];
  return translated?.[locale === "fa-AF" ? 0 : 1] || medicine.dosage_form.name;
}

export function localizedPackSize(value: string, locale: Locale) {
  if (locale === "en") return value;
  const spacedValue = value.replace(
    /(\d)(?=(?:suspensions?|tablets?|capsules?|vials?|bottles?|packs?|drops?|infusions?)\b)/gi,
    "$1 "
  );
  const replacements: [RegExp, string][] = locale === "fa-AF"
    ? [
        [/\bretail packs?\b/gi, "بسته فروش"],
        [/\btablets?\b/gi, "قرص"],
        [/\bcapsules?\b/gi, "کپسول"],
        [/\bvials?\b/gi, "ویال"],
        [/\bbottles?\b/gi, "بوتل"],
        [/\bpacks?\b/gi, "بسته"],
        [/\bsuspensions?\b/gi, "سوسپانسیون"],
        [/\bdrops?\b/gi, "قطره"],
        [/\binfusions?\b/gi, "انفیوژن"]
      ]
    : [
        [/\bretail packs?\b/gi, "پرچون بسته"],
        [/\btablets?\b/gi, "ګولۍ"],
        [/\bcapsules?\b/gi, "کپسول"],
        [/\bvials?\b/gi, "ویال"],
        [/\bbottles?\b/gi, "بوتل"],
        [/\bpacks?\b/gi, "بسته"],
        [/\bsuspensions?\b/gi, "تعلیق"],
        [/\bdrops?\b/gi, "څاڅکي"],
        [/\binfusions?\b/gi, "انفیوژن"]
      ];
  return replacements.reduce(
    (result, [pattern, replacement]) => result.replace(pattern, replacement),
    spacedValue
  );
}

export function localizedGenericName(medicine: Medicine, locale: Locale) {
  if (locale === "en") return medicine.generic_name;
  if (locale === "ps-AF") {
    return medicine.generic_name_pashto || medicine.generic_name_dari || medicine.generic_name;
  }
  return medicine.generic_name_dari || medicine.generic_name;
}

export function categoryImage(name: string) {
  const normalized = name.toLowerCase();
  const file = /supplement|nutrition|vitamin/.test(normalized)
    ? "WEB-026_Category_Vitamins-and-Supplements"
    : /skin/.test(normalized)
      ? "WEB-030_Category_Skin-Care"
      : /baby/.test(normalized)
        ? "WEB-028_Category_Baby-Care"
        : /device/.test(normalized)
          ? "WEB-029_Category_Medical-Devices"
          : "WEB-025_Category_Medicines";
  return `/categories/${file}.webp`;
}

export type MedicineFamily = {
  code: string;
  medicine: Medicine;
  variants: Medicine[];
};

export function groupMedicineFamilies(medicines: Medicine[]): MedicineFamily[] {
  const groups = new Map<string, Medicine[]>();
  for (const medicine of medicines) {
    const code = medicine.family_code || `sku-${medicine.sku}`;
    const supplied = medicine.family_variants?.length
      ? medicine.family_variants
      : [medicine];
    const known = new Map((groups.get(code) || []).map((variant) => [variant.id, variant]));
    supplied.forEach((variant) => known.set(variant.id, variant));
    groups.set(code, [...known.values()]);
  }
  return [...groups.entries()].map(([code, variants]) => ({
    code,
    medicine: variants[0],
    variants: [...variants].sort((left, right) =>
      left.strength.localeCompare(right.strength)
    )
  }));
}

type HealthNeedPresentation = {
  key: string;
  label: string;
  image: string;
  category: Category;
  href: string;
  filterCategory?: string;
};

const healthNeedRules: {
  key: string;
  pattern: RegExp;
  label: [string, string, string];
  image: string;
  hidden?: boolean;
}[] = [
  { key: "antibiotics", pattern: /^antibiotic$/i, label: ["Antibiotics", "آنتی‌بیوتیک‌ها", "انټي‌بیوټیکونه"], image: "/categories/WEB-025_Category_Medicines.webp" },
  { key: "pain-relief", pattern: /pain relief/i, label: ["Pain relief", "تسکین درد", "د درد ارامول"], image: "/campaigns/WEB-023_Pharmacy-Essentials_Campaign-Banner.webp" },
  { key: "kidney-urinary", pattern: /kidney stones/i, label: ["Kidney & urinary health", "سلامت کلیه و مجاری ادرار", "د پښتورګو او ادرار روغتیا"], image: "/categories/WEB-029_Category_Medical-Devices.webp" },
  { key: "digestive", pattern: /proton pump/i, label: ["Digestive health", "سلامت دستگاه گوارش", "د هاضمې روغتیا"], image: "/categories/WEB-027_Category_Personal-Care.webp" },
  { key: "heart", pattern: /calcium channel blockers/i, label: ["Heart & blood pressure", "قلب و فشار خون", "زړه او د وینې فشار"], image: "/campaigns/WEB-021_Daily-Wellness_Campaign-Banner.webp" },
  { key: "supplements", pattern: /dietary supplement|iron supplement|nutrition|netritional|nutracatical/i, label: ["Nutrition & supplements", "تغذیه و مکمل‌ها", "تغذیه او بشپړوونکي"], image: "/categories/WEB-026_Category_Vitamins-and-Supplements.webp" },
  { key: "internal-only", pattern: /antibacterial|anaerobic bacteria|brain improve|appiteite/i, label: ["", "", ""], image: "", hidden: true }
];

export function shopperHealthNeeds(
  categories: Category[],
  locale: Locale
): HealthNeedPresentation[] {
  const visible = new Map<string, HealthNeedPresentation>();
  for (const category of categories) {
    const rule = healthNeedRules.find((candidate) => candidate.pattern.test(category.name));
    if (!rule || rule.hidden || visible.has(rule.key)) continue;
    visible.set(rule.key, {
      key: rule.key,
      label: rule.label[localeIndex(locale)],
      image: category.image_url || rule.image,
      category,
      href: rule.key === "supplements"
        ? "/shop?shopper_category=vitamins-supplements"
        : `/categories/${category.slug}`,
      filterCategory: rule.key === "supplements" ? undefined : category.slug
    });
  }
  return [...visible.values()];
}
