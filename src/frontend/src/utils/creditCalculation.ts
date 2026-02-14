/**
 * Calculate credits earned based on session duration and feedback rating
 * Formula: duration (minutes) * rating
 * This is a deterministic calculation that returns the same result for the same inputs
 */
export function calculateCredits(durationMinutes: number, rating: number): number {
  if (durationMinutes < 0 || rating < 0 || rating > 5) {
    return 0;
  }
  return Math.floor(durationMinutes * rating);
}
