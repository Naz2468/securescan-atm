export const formatNGN = (amount: number | string | null | undefined) => {
  const n = typeof amount === "string" ? parseFloat(amount) : amount ?? 0;
  return "₦" + n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const maskAccount = (acc: string) => {
  if (!acc) return "";
  if (acc.length <= 4) return acc;
  return "*".repeat(acc.length - 4) + acc.slice(-4);
};

export const newReference = () => "TXN" + Date.now().toString(36).toUpperCase();
