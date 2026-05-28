const TERM_RE = /(^|\. )([A-ZÄÖÜ][A-Za-zÄÖÜäöüß0-9\s\-]{1,34}):\s/g;

export function addBoldedTerms(text: string): string {
  if (text.includes("**")) return text;
  return text.replace(TERM_RE, "$1**$2:** ");
}
