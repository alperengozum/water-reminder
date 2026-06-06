export function formatMl(value: number): string {
  if (value >= 1000) {
    const liters = value / 1000;
    return `${Number.isInteger(liters) ? liters : liters.toFixed(1)} L`;
  }
  return `${Math.round(value)} ml`;
}

export function formatGlasses(glasses: number): string {
  const rounded = Math.round(glasses * 10) / 10;
  return `${rounded}`;
}
