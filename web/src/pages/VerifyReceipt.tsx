/**
 * Verify Receipt Page
 * Verify selective-disclosure receipts by checking on-chain commitments
 */

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CHAINS } from "@/lib/contracts";
import { parseReceiptLink, verifyCommitmentOnChain } from "@/lib/receipts";
import { CheckCircle2, ExternalLink, Shield, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useChainId } from "wagmi";

export default function VerifyReceipt() {
  const [searchParams] = useSearchParams();
  const chainId = useChainId();
  const chain = CHAINS[chainId];

  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<{
    valid: boolean;
    storedCommitment: string;
    computedCommitment: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { invoiceId, txHash } = parseReceiptLink(searchParams);

  useEffect(() => {
    if (invoiceId && txHash && chain?.receiptStore) {
      verifyReceipt();
    }
  }, [invoiceId, txHash, chainId]);

  const verifyReceipt = async () => {
    if (!invoiceId || !txHash) {
      setError("Missing invoice ID or transaction hash");
      return;
    }

    if (!chain?.receiptStore) {
      setError("ReceiptStore contract not configured for this chain");
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      const verification = await verifyCommitmentOnChain(
        chainId,
        chain.receiptStore as `0x${string}`,
        invoiceId,
        txHash
      );

      setResult(verification);
    } catch (err: any) {
      console.error("Verification error:", err);
      setError(err.message || "Failed to verify receipt");
    } finally {
      setVerifying(false);
    }
  };

  if (!invoiceId || !txHash) {
    return (
      <div className="container mx-auto py-12 px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Verify Receipt
            </CardTitle>
            <CardDescription>
              Invalid or missing verification parameters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>
                This link is missing required parameters (invoiceId and txHash).
                Please check the link and try again.
              </AlertDescription>
            </Alert>
            <Link to="/">
              <Button className="mt-4">Return Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Receipt Verification
          </CardTitle>
          <CardDescription>
            Cryptographic proof of invoice payment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Receipt Details */}
          <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
            <h3 className="font-semibold text-sm">Receipt Details</h3>

            <div>
              <p className="text-xs text-muted-foreground mb-1">Invoice ID</p>
              <code className="text-xs bg-background px-2 py-1 rounded break-all">
                {invoiceId}
              </code>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Payment Transaction
              </p>
              <a
                href={`${chain?.explorer}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline"
              >
                {txHash.slice(0, 10)}...{txHash.slice(-8)}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Verification Status */}
          {verifying && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-2">
                <div className="animate-spin text-4xl">⏳</div>
                <p className="text-sm text-muted-foreground">
                  Verifying on-chain commitment...
                </p>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && !verifying && (
            <>
              {result.valid ? (
                <Alert className="border-green-500/50 bg-green-500/10">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <AlertDescription className="ml-2">
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      ✅ Receipt Verified Successfully
                    </span>
                    <p className="text-sm text-muted-foreground mt-1">
                      This invoice payment has been cryptographically proven and
                      recorded on-chain. The commitment hash matches the stored
                      value in the ReceiptStore contract.
                    </p>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <XCircle className="h-5 w-5" />
                  <AlertDescription className="ml-2">
                    <span className="font-semibold">
                      ❌ Receipt Verification Failed
                    </span>
                    <p className="text-sm mt-1">
                      The commitment hash does not match the on-chain record, or
                      no receipt has been created for this invoice yet.
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              {/* Technical Details */}
              <details className="border rounded-lg p-4 bg-muted/30">
                <summary className="cursor-pointer text-sm font-semibold">
                  Technical Details
                </summary>
                <div className="mt-3 space-y-2 text-xs">
                  <div>
                    <p className="text-muted-foreground mb-1">
                      Computed Commitment
                    </p>
                    <code className="bg-background px-2 py-1 rounded break-all block">
                      {result.computedCommitment}
                    </code>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">
                      Stored Commitment (On-Chain)
                    </p>
                    <code className="bg-background px-2 py-1 rounded break-all block">
                      {result.storedCommitment}
                    </code>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">
                      Verification Method
                    </p>
                    <p>
                      keccak256(invoiceId || txHash) == receiptOf[invoiceId]
                    </p>
                  </div>
                </div>
              </details>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Link to="/dashboard" className="flex-1">
              <Button variant="outline" className="w-full">
                View Dashboard
              </Button>
            </Link>
            {chain?.receiptStore && (
              <a
                href={`${chain.explorer}/address/${chain.receiptStore}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button variant="outline" className="w-full">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  ReceiptStore Contract
                </Button>
              </a>
            )}
          </div>

          {/* Explainer */}
          <Alert>
            <AlertDescription className="text-xs">
              <strong>How it works:</strong> When a merchant creates a receipt,
              a commitment hash (keccak256 of invoice ID + payment transaction)
              is stored on-chain. Anyone with the invoice ID and transaction
              hash can verify the payment occurred without revealing the stealth
              address or payer identity.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
