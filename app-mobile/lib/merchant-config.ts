/**
 * Configuração de serviços/estabelecimentos (99, iFood, Uber, etc.)
 * Usado para exibir ícones e cores nas transações e na home
 */
export interface MerchantConfig {
  name: string;
  letter: string;
  color: string;
}

const MERCHANTS: Record<string, MerchantConfig> = {
  "99": { name: "99", letter: "99", color: "#FF6B00" },
  "99 pop": { name: "99", letter: "99", color: "#FF6B00" },
  "99 taxi": { name: "99", letter: "99", color: "#FF6B00" },
  ifood: { name: "iFood", letter: "i", color: "#EA1D2C" },
  "i food": { name: "iFood", letter: "i", color: "#EA1D2C" },
  uber: { name: "Uber", letter: "U", color: "#000000" },
  rappi: { name: "Rappi", letter: "R", color: "#FF4F00" },
  netflix: { name: "Netflix", letter: "N", color: "#E50914" },
  spotify: { name: "Spotify", letter: "S", color: "#1DB954" },
  amazon: { name: "Amazon", letter: "A", color: "#FF9900" },
  "amazon prime": { name: "Prime", letter: "P", color: "#00A8E1" },
  "disney+": { name: "Disney+", letter: "D", color: "#113CCF" },
  disney: { name: "Disney+", letter: "D", color: "#113CCF" },
  "hbo max": { name: "HBO Max", letter: "H", color: "#B535F6" },
  hbo: { name: "HBO Max", letter: "H", color: "#B535F6" },
  "apple tv": { name: "Apple TV+", letter: "A", color: "#000000" },
  "apple music": { name: "Apple Music", letter: "A", color: "#FC3C44" },
  "youtube premium": { name: "YouTube", letter: "Y", color: "#FF0000" },
  youtube: { name: "YouTube", letter: "Y", color: "#FF0000" },
  "picpay": { name: "PicPay", letter: "P", color: "#21C25E" },
  "nubank": { name: "Nubank", letter: "N", color: "#820AD1" },
  "mercado livre": { name: "Mercado Livre", letter: "M", color: "#FFE600" },
  "mercado pago": { name: "Mercado Pago", letter: "M", color: "#009EE3" },
  "magazine luiza": { name: "Magalu", letter: "M", color: "#FF0050" },
  magalu: { name: "Magalu", letter: "M", color: "#FF0050" },
  "americanas": { name: "Americanas", letter: "A", color: "#FE0000" },
  extra: { name: "Extra", letter: "E", color: "#0066B3" },
  "carrefour": { name: "Carrefour", letter: "C", color: "#004E9A" },
  "pao de acucar": { name: "Pão de Açúcar", letter: "P", color: "#00A651" },
  "udemy": { name: "Udemy", letter: "U", color: "#A435F0" },
  "curso udemy": { name: "Udemy", letter: "U", color: "#A435F0" },
  "open food": { name: "Open Food", letter: "O", color: "#00C853" },
};

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function getMerchantConfig(description: string): MerchantConfig | null {
  if (!description?.trim()) return null;
  const d = normalize(description);

  for (const [key, config] of Object.entries(MERCHANTS)) {
    if (d.includes(key)) return config;
  }
  return null;
}

export function getMerchantOrCategoryFallback(
  description: string,
  categoryColor: string,
  categoryName: string
): MerchantConfig {
  const merchant = getMerchantConfig(description);
  if (merchant) return merchant;
  const initials = categoryName.slice(0, 2).toUpperCase() || "?";
  return {
    name: description.split(/[-–]/)[0]?.trim() || categoryName,
    letter: initials,
    color: categoryColor,
  };
}
