/**
 * Generate EIP-681 payment URI for invoice
 * Format: ethereum:<address>@<chainId>/transfer?uint256=<amount>&address=<recipient>
 */

export function generatePaymentURI(
  tokenAddress: string,
  recipientAddress: string,
  amount: string,
  chainId: number,
  decimals: number = 6
): string {
  // Convert amount to wei/smallest unit
  const amountWei = BigInt(parseFloat(amount) * 10 ** decimals).toString();

  // EIP-681 format for ERC20 transfer
  return `ethereum:${tokenAddress}@${chainId}/transfer?address=${recipientAddress}&uint256=${amountWei}`;
}

export function generateInvoiceLink(invoiceId: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/invoice/${invoiceId}`;
}

/**
 * Generate a clickable web URL for POS payments.
 * Unlike the ethereum: URI (for wallet QR scanning), this is a normal
 * https:// link that opens the app's /pay page with payment details.
 */
export function generatePOSWebLink(opts: {
  recipientAddress: string;
  amount: string;
  tokenAddress: string;
  tokenSymbol: string;
  chainId: number;
}): string {
  const baseUrl = window.location.origin;
  const params = new URLSearchParams({
    to: opts.recipientAddress,
    amount: opts.amount,
    token: opts.tokenAddress,
    symbol: opts.tokenSymbol,
    chainId: opts.chainId.toString(),
  });
  return `${baseUrl}/pay/pos?${params.toString()}`;
}

/**
 * Generate payment link for customers to pay invoice
 * This creates a user-friendly payment page with stealth address announcement
 */
export function generatePaymentLink(
  invoiceId: string,
  stealthAddress: string,
  amount: string,
  tokenAddress: string,
  ephemeralPubKey: string,
  chainId: number,
  merchantName?: string,
  description?: string
): string {
  const baseUrl = window.location.origin;
  const params = new URLSearchParams({
    to: stealthAddress,
    amount: amount,
    token: tokenAddress,
    ephemeralPubKey: ephemeralPubKey,
    chainId: chainId.toString(),
  });

  if (merchantName) params.append("merchant", merchantName);
  if (description) params.append("description", description);

  return `${baseUrl}/pay/${invoiceId}?${params.toString()}`;
}
