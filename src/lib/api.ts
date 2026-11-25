export const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002";

export type Media = { id: number; url: string; original_name: string; title: string; alt_text: string; caption: string; description: string; mime_type: string; size: number; created_at: string };
export type Term = { id: number; taxonomy: string; name: string; slug: string; description: string; parent_id: number | null; parent_name: string | null; image_id: number | null; image_url: string | null; count: number; custom_uri: string };
export type Post = { id: number; title: string; slug: string; content: string; excerpt: string; status: "draft" | "publish"; featured_media_id: number | null; featured_image_url?: string | null; seo?: Record<string, string>; created_at: string; updated_at: string };

export const TAXONOMIES: { slug: string; label: string; singular: string; parentTax?: string; addTitle?: string; parentLabel?: string; searchLabel?: string; hideDescriptionColumn?: boolean; customUri?: boolean; infoBox?: string; countLabel?: string; hideIdColumn?: boolean; hidePermalinkColumn?: boolean; hideParentColumn?: boolean; boxTitle?: string; filterLabel?: string; filterKey?: string }[] = [
  { slug: "listing-category", boxTitle: "Categories", filterLabel: "All Categories", filterKey: "category", label: "Listing Categories", singular: "Category", parentTax: "listing-category" },
  { slug: "listing-type", boxTitle: "What do you rent ?", filterLabel: "All Actions", filterKey: "type", label: "Listing Types", singular: "Type", parentTax: "listing-type", addTitle: 'Add new option for "What do you rent"', parentLabel: "Parent Category", searchLabel: "Search Categories" },
  { slug: "listing-city", boxTitle: "City", filterLabel: "All Cities", filterKey: "city", label: "Listing Cities", singular: "City", parentTax: "listing-city", parentLabel: "Parent Category", searchLabel: "Search Categories", hideDescriptionColumn: true, customUri: true, infoBox: "For extra details like media, documents, maps, custom info, etc - you need to click edit after the term was added." },
  { slug: "listing-area", boxTitle: "Neighborhood / Area", filterLabel: "All Areas", filterKey: "area", label: "Listing Areas", singular: "Neighborhood / Area", parentTax: "listing-city", parentLabel: "City", searchLabel: "Search Categories", hideDescriptionColumn: true, customUri: true, countLabel: "Posts", infoBox: "For extra details like media, documents, maps, custom info, etc - you need to click edit after the term was added." },
  { slug: "listing-features", boxTitle: "Features & Amenities", label: "Listing Features", singular: "Feature", parentTax: "listing-features", parentLabel: "Parent Category", searchLabel: "Search Categories", customUri: true, hideIdColumn: true, hidePermalinkColumn: true, hideParentColumn: true, infoBox: "For extra details like media, documents, maps, custom info, etc - you need to click edit after the term was added." },
  { slug: "listing-status", boxTitle: "Property Status", label: "Listing Status", singular: "Status", parentTax: "listing-status", parentLabel: "Parent Category", searchLabel: "Search Categories", customUri: true, hideIdColumn: true, hidePermalinkColumn: true, hideParentColumn: true, infoBox: "For extra details like media, documents, maps, custom info, etc - you need to click edit after the term was added." },
];

const TOKEN_KEY = "pajasa_token";
export const getToken = () => (typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY));
export const setToken = (t: string | null) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

export async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
  const isForm = init?.body instanceof FormData;
  const token = getToken();
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });
  if (res.status === 401 && !path.startsWith("/api/auth/login")) {
    // Session missing or expired: back to the login page
    setToken(null);
    if (typeof window !== "undefined" && window.location.pathname !== "/login") window.location.href = "/login";
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export type Paged<T> = { items: T[]; total: number; page: number; per_page: number; pages: number };

export type ListingRow = {
  id: number; title: string; slug: string; status: "draft" | "pending" | "publish"; featured: boolean;
  price: string | null; price_label: string; created_at: string; updated_at: string; image_url: string | null;
  terms: { id: number; name: string; taxonomy: string }[];
};
export type Listing = Omit<ListingRow, "terms" | "image_url"> & {
  content: string; excerpt: string; featured_media_id: number | null; featured_image_url: string | null;
  details: Record<string, any>; seo: Record<string, string>; appearance: Record<string, string>;
  term_ids: number[]; gallery_media: { id: number; url: string; alt_text: string }[];
};
export const STATUS_LABEL = { publish: "Published", pending: "Pending", draft: "Draft" } as const;
export function formatPrice(price: string | number | null, label?: string) {
  if (price == null || price === "") return "—";
  const n = Number(price);
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}${label ? ` / ${label}` : ""}`;
}
