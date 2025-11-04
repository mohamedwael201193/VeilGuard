/**
 * Generate EIP-681 payment URI for invoice
 * Format: ethereum:<address>@<chainId>/transfer?uint256=<amount>&address=<recipient>
 */

import type { TokenConfig } from '@/types';

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
