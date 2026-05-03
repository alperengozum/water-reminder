export function formatMl(value: number): string {
  return `${Math.round(value)} ml`;
}

export function formatGlasses(glasses: number): string {
  const rounded = Math.round(glasses * 10) / 10;
  return `${rounded}`;
}
