export type Theme = 'light' | 'dark' | 'system';

export function themeFromCookie(value: string | undefined): Theme {
  return value === 'light' || value === 'dark' ? value : 'system';
}
