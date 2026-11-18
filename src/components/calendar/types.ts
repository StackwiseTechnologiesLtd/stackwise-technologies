export type CalendarVisual = "studio" | "scrapbook";
export type CalendarView = "month" | "week";

export type CalendarDayContext = {
  iso: string;
  dayNum: number;
  today: boolean;
  outOfMonth: boolean;
  dropActive: boolean;
};