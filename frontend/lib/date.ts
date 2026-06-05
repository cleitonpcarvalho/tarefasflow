export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function todayKey() {
  return toDateKey(new Date());
}

export function parseDateKey(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatMonthYear(month: number, year: number) {
  const monthName = new Date(year, month - 1, 1).toLocaleDateString("pt-BR", {
    month: "long"
  });

  return `${monthName} ${year}`;
}

export function formatDayTitle(date: string) {
  return parseDateKey(date).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });
}

export function formatCompactDate(date: string) {
  const parsedDate = parseDateKey(date);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  if (toDateKey(now) === date) {
    return "Hoje";
  }

  if (toDateKey(tomorrow) === date) {
    return "Amanhã";
  }

  return parsedDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit"
  });
}

export function combineDateTime(date: string, time: string | null) {
  if (!time) {
    return null;
  }

  return new Date(`${date}T${time}:00`);
}

export function humanizeFutureDistance(target: Date) {
  const diffMs = target.getTime() - Date.now();
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000));

  if (diffMinutes < 60) {
    return `em ${diffMinutes}min`;
  }

  const diffHours = Math.round(diffMinutes / 60);

  if (diffHours < 24) {
    return `em ${diffHours}h`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `em ${diffDays}d`;
}
