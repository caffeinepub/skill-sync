/**
 * Utility functions for scheduled session time handling
 */

/**
 * Converts a bigint nanosecond timestamp to a JavaScript Date
 */
export function nanosToDate(nanos: bigint): Date {
  return new Date(Number(nanos / 1_000_000n));
}

/**
 * Converts a JavaScript Date to a bigint nanosecond timestamp
 */
export function dateToNanos(date: Date): bigint {
  return BigInt(date.getTime()) * 1_000_000n;
}

/**
 * Formats a scheduled session start time in the user's locale
 */
export function formatScheduledTime(scheduledTime: bigint): string {
  const date = nanosToDate(scheduledTime);
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/**
 * Formats just the date portion
 */
export function formatScheduledDate(scheduledTime: bigint): string {
  const date = nanosToDate(scheduledTime);
  return date.toLocaleDateString(undefined, {
    dateStyle: 'medium',
  });
}

/**
 * Formats just the time portion
 */
export function formatScheduledTimeOnly(scheduledTime: bigint): string {
  const date = nanosToDate(scheduledTime);
  return date.toLocaleTimeString(undefined, {
    timeStyle: 'short',
  });
}

/**
 * Determines if a scheduled session can be joined based on the scheduled time
 * Allow joining 5 minutes before the scheduled time
 */
export function canJoinSession(scheduledTime: bigint): boolean {
  const now = Date.now();
  const scheduledMs = Number(scheduledTime / 1_000_000n);
  const fiveMinutesInMs = 5 * 60 * 1000;
  
  return now >= (scheduledMs - fiveMinutesInMs);
}

/**
 * Gets a human-readable message about when a session can be joined
 */
export function getJoinAvailabilityMessage(scheduledTime: bigint): string {
  const now = Date.now();
  const scheduledMs = Number(scheduledTime / 1_000_000n);
  const fiveMinutesInMs = 5 * 60 * 1000;
  const joinTime = scheduledMs - fiveMinutesInMs;
  
  if (now >= joinTime) {
    return 'Available now';
  }
  
  const minutesUntilJoin = Math.ceil((joinTime - now) / 60000);
  
  if (minutesUntilJoin < 60) {
    return `Available in ${minutesUntilJoin} minute${minutesUntilJoin === 1 ? '' : 's'}`;
  }
  
  const hoursUntilJoin = Math.floor(minutesUntilJoin / 60);
  return `Available in ${hoursUntilJoin} hour${hoursUntilJoin === 1 ? '' : 's'}`;
}

/**
 * Validates that a date is not in the past
 */
export function isValidFutureDate(date: Date): boolean {
  return date.getTime() > Date.now();
}
