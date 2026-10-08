import { formatDistanceToNow } from "date-fns";

export function timeAgo(iso: string) {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return "";
  }
}

export function errStatus(e: unknown): number | undefined {
  return (e as { status?: number } | null)?.status;
}

export function shareUrl(handle: string) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${window.location.origin}${base}/u/${handle}`;
}
