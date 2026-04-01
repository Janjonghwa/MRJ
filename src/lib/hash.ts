import crypto from 'crypto';

export function generateSajuHash(
  year: number,
  month: number,
  day: number,
  hour: number | undefined,
  isLunar: boolean,
  mbti: string,
  category: string
): string {
  const timeCode = hour === undefined ? 'unknown' : hour.toString();
  const rawString = `${year}-${month}-${day}-${timeCode}-${isLunar}-${mbti}-${category}`;
  
  return crypto.createHash('sha256').update(rawString).digest('hex');
}
