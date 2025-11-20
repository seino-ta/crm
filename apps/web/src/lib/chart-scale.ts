export function getCurrencyScale(maxValue: number) {
  if (maxValue >= 1e8) {
    return { divisor: 1e8, label: '億円' };
  }
  if (maxValue >= 1e6) {
    return { divisor: 1e6, label: '百万円' };
  }
  if (maxValue >= 1e4) {
    return { divisor: 1e4, label: '万円' };
  }
  return { divisor: 1, label: '円' };
}
