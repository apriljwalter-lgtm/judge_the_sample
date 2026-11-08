const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const dollars = (x) => usd.format(x);
export const percent = (x) => `${(x * 100).toFixed(1)}%`;
export const count = (x) => x.toLocaleString("en-US");
export const fixed = (x, d) => x.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
