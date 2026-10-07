/** Days a deleted plan stays in the trash before it's purged (keep in sync with supabase/plans-trash.sql). */
export const TRASH_DAYS = 30;

const DAY = 24 * 60 * 60 * 1000;

export function purgeDate(deletedAt: string) {
  return new Date(new Date(deletedAt).getTime() + TRASH_DAYS * DAY);
}

export function daysLeft(deletedAt: string, now = Date.now()) {
  return Math.max(0, Math.ceil((purgeDate(deletedAt).getTime() - now) / DAY));
}
