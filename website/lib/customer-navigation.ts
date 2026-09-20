// Presentation only: these sections select active links, never destinations.
const within = (path: string, root: string) =>
  path === root || path.startsWith(`${root}/`);

export function isCustomerRoute(path: string) {
  return !["/staff", "/admin", "/api"].some(root => within(path, root));
}

const desktopSections = [
  ["/shop", ["/shop", "/medicines"]],
  ["/categories", ["/categories"]],
  ["/manufacturers", ["/manufacturers"]],
  ["/prescriptions/upload", ["/prescriptions"]],
  ["/health", ["/health", "/health-articles"]],
  ["/app", ["/app"]]
] as const;

const mobileSections = [
  ["/shop", ["/shop", "/medicines", "/categories", "/manufacturers"]],
  ["/cart", ["/cart", "/checkout"]],
  ["/account", ["/account", "/orders", "/notifications"]],
  // Account prescription history/detail stay in Account; standalone upload,
  // combined prescriptions and upload success stay in the Rx section.
  ["/prescriptions/upload", ["/prescriptions"]]
] as const;

type SectionMap = readonly (readonly [string, readonly string[]])[];

function activeSection(path: string, sections: SectionMap) {
  if (!isCustomerRoute(path)) return undefined;
  if (path === "/") return "/";
  return sections.find(([, roots]) => roots.some(root => within(path, root)))?.[0];
}

export const desktopCustomerSection = (path: string) => activeSection(path, desktopSections);
export const mobileCustomerSection = (path: string) => activeSection(path, mobileSections);
