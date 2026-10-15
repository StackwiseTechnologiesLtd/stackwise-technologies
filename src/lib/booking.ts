/** Default Cal.com event URL (override with NEXT_PUBLIC_CAL_COM_BOOKING_URL). */
const CAL_COM_BOOKING_BASE =
  process.env.NEXT_PUBLIC_CAL_COM_BOOKING_URL ??
  "https://cal.com/stackwisetechnologies-info/30min";

/** Always included as a guest on discovery bookings. */
export const MEETING_ALWAYS_INVITEE = "tshikombadaniel@gmail.com";

/**
 * Cal.com booking link with required guest prefilled.
 * @see https://cal.com/help/bookings/prefill-fields
 */
export function bookingUrl(extraGuests: string[] = []): string {
  const url = new URL(CAL_COM_BOOKING_BASE);
  const guests = [MEETING_ALWAYS_INVITEE, ...extraGuests].filter(Boolean);
  for (const email of guests) {
    url.searchParams.append("guests", email);
  }
  return url.toString();
}
