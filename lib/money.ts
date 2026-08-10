/** Money is integer rupees end to end. These helpers only format for display. */

export function formatRupees(amount: number): string {
  return `₹${new Intl.NumberFormat('en-IN').format(Math.round(amount))}`;
}

/** Plain "₹216" without grouping — used inside the WhatsApp message. */
export function plainRupees(amount: number): string {
  return `₹${Math.round(amount)}`;
}
