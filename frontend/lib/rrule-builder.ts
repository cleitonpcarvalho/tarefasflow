import { RRule, type Weekday } from "rrule";
import type { RecurrenceOptions } from "@/types";

const rruleWeekdays = [
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

const ptLanguage = {
  dayNames: weekdayLabels,
  monthNames: [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro"
  ],
  tokens: {}
};

const translations: Record<string, string> = {
  every: "a cada",
  day: "dia",
  days: "dias",
  week: "semana",
  weeks: "semanas",
  month: "mês",
  months: "meses",
  "on the": "no",
  on: "em",
  and: "e",
  until: "até",
  for: "por",
  time: "vez",
  times: "vezes",
  st: "º",
  nd: "º",
  rd: "º",
  th: "º"
};

export function buildRRule(options: RecurrenceOptions) {
  const ruleOptions: ConstructorParameters<typeof RRule>[0] = {
    freq: toRRuleFrequency(options.frequency),
    interval: Math.max(1, options.interval ?? 1)
  };

  if (options.frequency === "weekly") {
    const selectedDays = options.weekdays
      ?.map((day) => rruleWeekdays[day])
      .filter((day): day is Weekday => Boolean(day));

    if (!selectedDays?.length) {
      throw new Error("Selecione ao menos um dia da semana.");
    }

    ruleOptions.byweekday = selectedDays;
  }

  if (options.frequency === "monthly") {
    if (
      options.monthlyMode === "monthWeekday" &&
      options.monthWeekday
    ) {
      const weekday = rruleWeekdays[options.monthWeekday.day];

      if (!weekday) {
        throw new Error("Selecione um dia da semana válido.");
      }

      ruleOptions.byweekday = weekday.nth(options.monthWeekday.week);
    } else {
      ruleOptions.bymonthday = clamp(options.monthDay ?? 1, 1, 31);
    }
  }

  if (options.until) {
    ruleOptions.until = options.until;
  } else if (options.count) {
    ruleOptions.count = Math.max(1, options.count);
  }

  return new RRule(ruleOptions).toString().replace(/^RRULE:/, "");
}

export function parseRRule(
  value: string,
  recurrenceEnd?: string | null
): RecurrenceOptions {
  const rule = RRule.fromString(value);
  const options = rule.origOptions;
  const frequency = fromRRuleFrequency(options.freq);
  const normalizedWeekdays = normalizeWeekdays(options.byweekday);
  const monthWeekday = normalizedWeekdays.find((day) => day.n !== 0);
  const monthDay = firstNumber(options.bymonthday);

  return {
    frequency,
    interval: options.interval ?? 1,
    weekdays:
      frequency === "weekly"
        ? normalizedWeekdays.map((day) => day.weekday)
        : undefined,
    monthlyMode:
      frequency === "monthly" && monthWeekday
        ? "monthWeekday"
        : "monthDay",
    monthDay: frequency === "monthly" ? monthDay ?? 1 : undefined,
    monthWeekday:
      frequency === "monthly" && monthWeekday
        ? {
            week: normalizeWeek(monthWeekday.n),
            day: monthWeekday.weekday
          }
        : undefined,
    until: recurrenceEnd
      ? parseDateInput(recurrenceEnd)
      : options.until ?? undefined,
    count: options.count ?? undefined
  };
}

export function describeRRule(value: string) {
  const rule = RRule.fromString(value);
  const options = rule.origOptions;
  const frequency = fromRRuleFrequency(options.freq);
  let description: string;

  if (frequency === "daily") {
    description =
      options.interval && options.interval > 1
        ? `Repete a cada ${options.interval} dias`
        : "Repete todo dia";
  } else if (frequency === "weekly") {
    const days = normalizeWeekdays(options.byweekday)
      .map((day) => weekdayLabels[day.weekday])
      .filter(Boolean);
    description = days.length
      ? `Repete toda ${joinLabels(days)}`
      : "Repete toda semana";
  } else {
    const monthDay = firstNumber(options.bymonthday);
    const monthWeekday = normalizeWeekdays(options.byweekday)[0];

    if (monthDay) {
      description = `Repete todo dia ${monthDay} do mês`;
    } else if (monthWeekday) {
      description = `Repete todo ${formatWeek(monthWeekday.n)} ${weekdayLabels[monthWeekday.weekday]} do mês`;
    } else {
      description = "Repete todo mês";
    }
  }

  const until = options.until;

  if (until) {
    description += ` até ${until.toLocaleDateString("pt-BR", {
      timeZone: "UTC"
    })}`;
  } else if (options.count) {
    description += ` por ${options.count} ocorrências`;
  }

  return description;
}

export function describeRecurrence(options: RecurrenceOptions) {
  try {
    const rule = RRule.fromString(buildRRule(options));

    // Mantém o toText como fallback para regras futuras ainda não cobertas
    // pela descrição curta em português usada pela interface.
    rule.toText(
      (id) => translations[String(id)] ?? String(id),
      ptLanguage,
      (year, month, day) => `${day} de ${month} de ${year}`
    );

    return describeRRule(rule.toString());
  } catch {
    return "Configure a recorrência para ver o resumo.";
  }
}

export function dateToInputValue(date?: Date) {
  return date ? date.toISOString().slice(0, 10) : "";
}

export function parseDateInput(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 23, 59, 59));
}

function toRRuleFrequency(frequency: RecurrenceOptions["frequency"]) {
  return {
    daily: RRule.DAILY,
    weekly: RRule.WEEKLY,
    monthly: RRule.MONTHLY
  }[frequency];
}

function fromRRuleFrequency(frequency: number | undefined) {
  if (frequency === RRule.DAILY) {
    return "daily";
  }

  if (frequency === RRule.MONTHLY) {
    return "monthly";
  }

  return "weekly";
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
      return [
        {
          weekday: day.weekday,
          n: "n" in day && typeof day.n === "number" ? day.n : 0
        }
      ];
    }

    if (typeof day === "number") {
      return [{ weekday: day, n: 0 }];
    }

    return [];
  });
}

function firstNumber(value: number | number[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value ?? undefined;
}

function normalizeWeek(value: number): 1 | 2 | 3 | 4 | -1 {
  return value === -1 || value === 2 || value === 3 || value === 4
    ? value
    : 1;
}

function formatWeek(week: number) {
  const labels: Record<number, string> = {
    [-1]: "último",
    1: "primeiro",
    2: "segundo",
    3: "terceiro",
    4: "quarto"
  };

  return labels[week] ?? "primeiro";
}

function joinLabels(labels: string[]) {
  if (labels.length <= 1) {
    return labels[0] ?? "semana";
  }

  return `${labels.slice(0, -1).join(", ")} e ${labels.at(-1)}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
