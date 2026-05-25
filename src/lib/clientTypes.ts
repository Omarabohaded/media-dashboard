export type WebsitePlatform =
  | "shopify"
  | "wordpress"
  | "salla"
  | "wix"
  | "custom";

export type ClientCurrencyCode = "USD" | "AED" | "SAR" | "EGP";

export type ClientRecord = {
  id: string;
  name: string;
  websitePlatform: WebsitePlatform;
  currencyCode: ClientCurrencyCode;
  notes: string | null;
  createdAt: string;
};

export const SUPPORTED_CLIENT_CURRENCIES: Array<{
  code: ClientCurrencyCode;
  label: string;
  locale: string;
}> = [
  { code: "USD", label: "Dollar (USD)", locale: "en-US" },
  { code: "AED", label: "Dirham (AED)", locale: "en-AE" },
  { code: "SAR", label: "Saudi Riyal (SAR)", locale: "en-SA" },
  { code: "EGP", label: "Egyptian Pound (EGP)", locale: "en-EG" },
];

export function getCurrencyMeta(currencyCode: ClientCurrencyCode) {
  return (
    SUPPORTED_CLIENT_CURRENCIES.find((item) => item.code === currencyCode) ??
    SUPPORTED_CLIENT_CURRENCIES[0]
  );
}
