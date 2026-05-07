import { formatInTimeZone, toDate } from 'date-fns-tz';
import { startOfDay, endOfDay } from 'date-fns';

const TIMEZONE = 'America/Argentina/Buenos_Aires';

/**
 * Returns the current date/time in Argentina
 */
export function getNowInArgentina() {
  return toDate(new Date(), { timeZone: TIMEZONE });
}

/**
 * Returns the start and end of a given date (or today) in Argentina timezone,
 * but as UTC Date objects that can be used in Prisma queries.
 */
export function getArgentinaDayRange(dateStr?: string) {
  const date = dateStr ? toDate(dateStr, { timeZone: TIMEZONE }) : getNowInArgentina();
  
  const start = startOfDay(date);
  const end = endOfDay(date);

  return {
    start,
    end
  };
}

/**
 * Formats a date to a string in Argentina timezone
 */
export function formatInArgentina(date: Date, formatStr: string) {
  return formatInTimeZone(date, TIMEZONE, formatStr);
}

/**
 * Parses a date string and ensures it's treated as Argentina time
 */
export function parseArgentinaDate(dateStr: string) {
  return toDate(dateStr, { timeZone: TIMEZONE });
}
