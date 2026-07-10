import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { eachDayOfInterval, isWeekend, isBefore, isAfter } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function differenceInBusinessDays(
  endDate: Date,
  startDate: Date
): number {
  let count = 0
  let current = new Date(startDate)

  if (isBefore(endDate, startDate)) {
    return 0
  }

  while (isBefore(current, endDate) || current.getTime() === endDate.getTime()) {
    if (!isWeekend(current)) {
      count++
    }
    current = new Date(current.getTime() + 24 * 60 * 60 * 1000)
  }

  return count - 1
}
