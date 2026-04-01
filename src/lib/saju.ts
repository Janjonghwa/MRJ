import { calculateFourPillars, fourPillarsToString } from 'manseryeok';

export type SajuInput = {
  year: number;
  month: number;
  day: number;
  hour?: number; // Optional if unknown
  minute?: number;
  isLunar?: boolean;
};

export type SajuResult = {
  koreanText: string;
  hanjaText: string;
  yearHanja: string;
  monthHanja: string;
  dayHanja: string;
  hourHanja?: string;
};

export function extractSaju(input: SajuInput): SajuResult {
  // If time is unknown, we default to 12:00 but ideally we only use the 6 characters.
  // The manseryeok library expects hour and minute.
  const saju = calculateFourPillars({
    year: input.year,
    month: input.month,
    day: input.day,
    hour: input.hour ?? 12,
    minute: input.minute ?? 0,
    isLunar: input.isLunar ?? false,
  });

  // Example expected object outputs from the library
  // @ts-ignore - The types in the lib might be missing these specific keys, but we saw them in the output
  const { yearHanja, monthHanja, dayHanja, hourHanja } = saju;

  return {
    koreanText: fourPillarsToString(saju),
    hanjaText: `${yearHanja} ${monthHanja} ${dayHanja} ${input.hour !== undefined ? hourHanja : ''}`.trim(),
    yearHanja,
    monthHanja,
    dayHanja,
    hourHanja: input.hour !== undefined ? hourHanja : undefined
  };
}
