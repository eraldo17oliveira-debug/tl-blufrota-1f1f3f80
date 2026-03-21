// Brazilian plate mask: supports AAA-0000 and AAA0A00 (Mercosul)
export function applyPlacaMask(raw: string): string {
  const clean = raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 7);
  if (clean.length <= 3) return clean;
  // After 3 letters, insert dash
  const letters = clean.slice(0, 3);
  const rest = clean.slice(3);
  return `${letters}-${rest}`;
}

export function isPlacaValid(placa: string): boolean {
  const clean = placa.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  if (clean.length !== 7) return false;
  // AAA0000 or AAA0A00
  const oldFormat = /^[A-Z]{3}[0-9]{4}$/;
  const mercosul = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;
  return oldFormat.test(clean) || mercosul.test(clean);
}
