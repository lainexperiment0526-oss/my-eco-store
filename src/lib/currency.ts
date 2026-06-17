export const PRIMARY_CURRENCY = 'Pi';

export function formatPiAmount(amount: number | string | null | undefined, options: { maximumFractionDigits?: number } = {}) {
  const value = Number(amount ?? 0);
  const maximumFractionDigits = options.maximumFractionDigits ?? 2;
  return `${Number.isFinite(value) ? value.toLocaleString(undefined, { maximumFractionDigits }) : '0'} ${PRIMARY_CURRENCY}`;
}

export function replaceFiatCurrencyText(text: string) {
  return text
    .replace(/\b(?:USD|PHP|EUR|GBP|JPY|CNY|KRW|INR|RUB|BRL)\b/gi, PRIMARY_CURRENCY)
    .replace(/[₱$€£¥₹₽]/g, PRIMARY_CURRENCY);
}
