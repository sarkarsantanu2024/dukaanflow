/**
 * Bengali (০-৯) and Devanagari (०-९) digits, as ASCII.
 *
 * An owner whose phone keyboard is set to Bangla or Hindi types "৫০" for a
 * price, "৫" for a stock count and "৯৮৭৬৫৪৩২১০" for a phone number, and every
 * parser in the product used to refuse all of them: `\d` in a JavaScript regex
 * matches ASCII digits only. So every place that reads a typed number runs the
 * text through this first, and the owner can type in whatever script their
 * keyboard is in.
 */
export function toAsciiDigits(text: string): string {
  return text.replace(/[०-९০-৯]/g, (char) => {
    const code = char.codePointAt(0)!;
    const base = code >= 0x09e6 ? 0x09e6 : 0x0966;
    return String(code - base);
  });
}
