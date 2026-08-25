import { CalendarPlus } from "lucide-react";
import { buildActivityCalendarLink, buildDayCalendarLink, type Activity, type CalendarDayInput } from "@/lib/calendarLinks";

export function AddActivityToCalendarButton({ activity }: { activity: Activity }) {
  const handleClick = () => {
    const url = buildActivityCalendarLink(activity, activity.date);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/5 px-3 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand hover:text-white"
    >
      <CalendarPlus className="h-3.5 w-3.5" />
      Add
    </button>
  );
}

export function AddDayToCalendarButton({ day }: { day: CalendarDayInput }) {
  const handleClick = () => {
    const url = buildDayCalendarLink(day);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-brand hover:text-brand"
    >
      <CalendarPlus className="h-3.5 w-3.5" />
      Add Day to Calendar
    </button>
  );
}
