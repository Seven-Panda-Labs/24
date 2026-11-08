/** Lower case, no accents, single spaces: "Pai Natal de Choco " and "pai natal de choco" match. */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}
