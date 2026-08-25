export interface Activity {
  id?: string;
  date: string;
  time?: string;
  title: string;
  description?: string;
  location?: string;
  durationMinutes?: number;
  cost?: number;
}

export interface CalendarDayInput {
  date: string;
  title: string;
  description?: string;
  location?: string;
  activities?: Activity[];
  durationMinutes?: number;
}

function formatGoogleDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

function parseTimeToDate(dateISO: string, time?: string): Date {
  const safeDateString = `${dateISO}T00:00:00`;
  const fallbackDate = new Date(safeDateString);

  if (!time) {
    return fallbackDate;
  }

  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) {
    return fallbackDate;
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3].toUpperCase();

  if (meridiem === "AM" && hours === 12) {
    hours = 0;
  }

  if (meridiem === "PM" && hours !== 12) {
    hours += 12;
  }

  return new Date(`${dateISO}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`);
}

function normalizeActivity(activity: Activity, fallbackDate: string): Activity {
  return {
    ...activity,
    date: activity.date || fallbackDate,
    title: activity.title || "Travel activity",
    description: activity.description || activity.title || "Travel activity",
    durationMinutes: activity.durationMinutes ?? 60,
  };
}

export function buildActivityCalendarLink(activity: Activity, dateISO = activity.date): string {
  const event = normalizeActivity(activity, dateISO);
  const startDate = parseTimeToDate(event.date, event.time);
  const endDate = new Date(startDate.getTime() + (event.durationMinutes ?? 60) * 60 * 1000);

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    details: event.description || "",
    location: event.location || "",
    dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildDayCalendarLink(day: CalendarDayInput): string {
  const safeActivities = day.activities && day.activities.length > 0 ? day.activities : [{
    title: day.title,
    date: day.date,
    description: day.description || day.title,
    location: day.location,
    durationMinutes: day.durationMinutes ?? 120,
  }];

  const startActivity = safeActivities[0];
  const endActivity = safeActivities[safeActivities.length - 1] ?? startActivity;

  const startDate = parseTimeToDate(day.date, startActivity.time || "09:00 AM");
  const endDate = new Date(startDate.getTime() + ((endActivity.durationMinutes ?? day.durationMinutes ?? 180) * 60 * 1000));

  const activitySummary = safeActivities
    .map((activity) => {
      const label = activity.time ? `${activity.time} — ${activity.title}` : activity.title;
      return `- ${label}${activity.cost ? ` (${activity.cost ? `₹${activity.cost}` : ""})` : ""}`;
    })
    .join("\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: day.title || "Travel day",
    details: `${day.description || "Travel itinerary"}\n\n${activitySummary}`,
    location: day.location || safeActivities.find((activity) => activity.location)?.location || "",
    dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
