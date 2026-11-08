export function normalizar(s: string) {
  return s.trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/\s+/g, ' ');
}
