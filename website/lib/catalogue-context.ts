export type CatalogueContext = {
  kind: "category" | "manufacturer";
  value: string;
  label: string;
};

type Query = { get: (key: string) => string | null };
const filterKeys = ["search", "category", "shopper_category", "manufacturer", "page", "ordering", "in_stock", "prescription_required", "min_price", "max_price"];

// Resolve against real names rather than decoding an arbitrary name twice.
export function matchesManufacturerRoute(name: string, slug: string) {
  return name.toLowerCase() === slug.toLowerCase() ||
    encodeURIComponent(name).toLowerCase() === slug.toLowerCase();
}

export function cataloguePath(context?: CatalogueContext) {
  if (!context) return "/shop";
  const root = context.kind === "category" ? "/categories" : "/manufacturers";
  return `${root}/${encodeURIComponent(context.value)}`;
}

// Path-derived constraints always win over conflicting query parameters.
export function catalogueQuery(query: Query, context?: CatalogueContext) {
  const result = new URLSearchParams();
  for (const key of filterKeys) {
    const value = query.get(key);
    if (value) result.set(key, value);
  }
  if (context) result.set(context.kind, context.value);
  return result;
}

export function catalogueUrl(query: Query, key: string, value: string, context?: CatalogueContext) {
  const result = catalogueQuery(query, context);
  if (value) result.set(key, value);
  else result.delete(key);
  if (key !== "page") result.delete("page");
  if (context) result.delete(context.kind); // The canonical path carries this constraint.
  const suffix = result.toString();
  return cataloguePath(context) + (suffix ? `?${suffix}` : "");
}

export function catalogueApiQuery(query: Query, context: CatalogueContext) {
  const result = catalogueQuery(query, context);
  result.set("family_listing", "true");
  if (!result.has("ordering")) result.set("ordering", "name");
  return result;
}
