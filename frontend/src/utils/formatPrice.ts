export function formatPrice(value: string | number): string {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "—";
  }

  const absoluteValue = Math.abs(numericValue);

  if (absoluteValue > 0 && absoluteValue < 0.00001) {
    return numericValue
      .toExponential(5)
      .replace(/\.0+e/, "e")
      .replace(/(\.\d*?[1-9])0+e/, "$1e");
  }

  return numericValue.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 5
  });
}
