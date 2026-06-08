import { RRule } from "rrule";
import type { Task } from "../types/task";

export type RecurrenceFrequency = "daily" | "weekly" | "monthly";

export interface RecurrenceOptions {
  frequency: RecurrenceFrequency;
  interval?: number;
  weekdays?: number[];
  monthDay?: number;
  monthWeekday?: {
    week: 1 | 2 | 3 | 4 | -1;
    day: number;
  };
  until?: Date;
  count?: number;
}

const weekdays = [
  RRule.MO,
  RRule.TU,
  RRule.WE,
  RRule.TH,
  RRule.FR,
  RRule.SA,
  RRule.SU
];

const weekdayLabels = [
  "segunda",
  "terça",
  "quarta",
  "quinta",
  "sexta",
  "sábado",
  "domingo"
];

export function expandRecurringTask(
  task: Task,
  rangeStart: Date,
  rangeEnd: Date
): Task[] {
  if (!task.is_recurring || !task.rrule) {
    return [task];
  }

  const parsedRule = RRule.fromString(task.rrule);
  const recurrenceEnd = task.recurrence_end
    ? parseDateAtEndOfDay(task.recurrence_end)
    : null;
  const effectiveEnd =
    recurrenceEnd && recurrenceEnd < rangeEnd ? recurrenceEnd : rangeEnd;

  if (effectiveEnd < rangeStart) {
    return [];
  }

  const rule = new RRule({
    ...parsedRule.origOptions,
    dtstart: parseTaskDateTime(task.task_date, task.task_time),
    until: recurrenceEnd ?? parsedRule.origOptions.until ?? null
  });
  const excludedDates = new Set(task.excluded_dates);
  const doneDates = new Set(task.done_dates ?? []);

  return rule
    .between(rangeStart, effectiveEnd, true)
    .map((date) => formatUtcDate(date))
    .filter((date) => !excludedDates.has(date))
    .map((date) => ({
      ...task,
      id: `${task.id}_${date}`,
      task_date: date,
      parent_id: task.id,
      is_virtual: true,
      done: doneDates.has(date)
    }));
}

export function buildRRule(options: RecurrenceOptions) {
  const interval = Math.max(1, options.interval ?? 1);
  const ruleOptions: ConstructorParameters<typeof RRule>[0] = {
    freq: toRRuleFrequency(options.frequency),
    interval
  };

  if (options.frequency === "weekly") {
    const selectedDays = (options.weekdays?.length
      ? options.weekdays
      : [0, 1, 2, 3, 4]
    ).map((day) => weekdays[day]);

    if (!selectedDays?.length || selectedDays.some((day) => !day)) {
      throw new Error("Selecione ao menos um dia para a recorrência semanal.");
    }

    ruleOptions.byweekday = selectedDays;
  }

  if (options.frequency === "monthly" && options.monthDay) {
    ruleOptions.bymonthday = options.monthDay;
  }

  if (options.frequency === "monthly" && options.monthWeekday) {
    const day = weekdays[options.monthWeekday.day];

    if (!day) {
      throw new Error("Dia da semana mensal inválido.");
    }

    ruleOptions.byweekday = day.nth(options.monthWeekday.week);
  }

  if (options.until) {
    ruleOptions.until = options.until;
  }

  if (!options.until && options.count) {
    ruleOptions.count = options.count;
  }

  return new RRule(ruleOptions).toString().replace(/^RRULE:/, "");
}

export function describeRRule(rrule: string) {
  const rule = RRule.fromString(rrule);
  const options = rule.origOptions;
  let description = "Repete";

  if (options.freq === RRule.DAILY) {
    description +=
      options.interval && options.interval > 1
        ? ` a cada ${options.interval} dias`
        : " todo dia";
  } else if (options.freq === RRule.WEEKLY) {
    const selectedDays = normalizeWeekdays(options.byweekday)
      .map((day) => weekdayLabels[day.weekday])
      .filter(Boolean);
    description += selectedDays.length
      ? ` toda ${joinLabels(selectedDays)}`
      : " toda semana";
  } else if (options.freq === RRule.MONTHLY) {
    const monthDay = Array.isArray(options.bymonthday)
      ? options.bymonthday[0]
      : options.bymonthday;
    const selectedWeekday = normalizeWeekdays(options.byweekday)[0];

    if (monthDay) {
      description += ` todo dia ${monthDay} do mês`;
    } else if (selectedWeekday) {
      description += ` todo ${formatWeek(selectedWeekday.n)} ${weekdayLabels[selectedWeekday.weekday]} do mês`;
    } else {
      description += " todo mês";
    }
  }

  if (options.until) {
    description += ` até ${options.until.toLocaleDateString("pt-BR", {
      timeZone: "UTC"
    })}`;
  } else if (options.count) {
    description += ` por ${options.count} ocorrências`;
  }

  return description;
}

export function parseTaskDateTime(date: string, time: string | null) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = (time ?? "00:00").split(":").map(Number);

  return new Date(Date.UTC(year, month - 1, day, hour, minute));
}

export function parseDateAtStartOfDay(date: string) {
  return parseTaskDateTime(date, "00:00");
}

export function parseDateAtEndOfDay(date: string) {
  const parsed = parseTaskDateTime(date, "23:59");
  parsed.setUTCSeconds(59, 999);
  return parsed;
}

function toRRuleFrequency(frequency: RecurrenceFrequency) {
  const frequencies = {
    daily: RRule.DAILY,
    weekly: RRule.WEEKLY,
    monthly: RRule.MONTHLY
  };

  return frequencies[frequency];
}

function normalizeWeekdays(value: unknown) {
  if (!value) {
    return [];
  }

  const values = Array.isArray(value) ? value : [value];

  return values.flatMap((day) => {
    if (
      typeof day === "object" &&
      day !== null &&
      "weekday" in day &&
      typeof day.weekday === "number"
    ) {
      return [{ weekday: day.weekday, n: "n" in day ? Number(day.n) : 0 }];
    }

    if (typeof day === "number") {
      return [{ weekday: day, n: 0 }];
    }

    return [];
  });
}

function joinLabels(labels: string[]) {
  if (labels.length <= 1) {
    return labels[0] ?? "semana";
  }

  return `${labels.slice(0, -1).join(", ")} e ${labels.at(-1)}`;
}

function formatWeek(week: number | undefined) {
  if (week === -1) {
    return "último";
  }

  const labels: Record<number, string> = {
    1: "primeiro",
    2: "segundo",
    3: "terceiro",
    4: "quarto"
  };

  return labels[week ?? 1] ?? "primeiro";
}

function formatUtcDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
