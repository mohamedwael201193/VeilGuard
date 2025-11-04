/**
 * Inbox - View-Key Only Mode
 * Scan and display incoming stealth payments without exposing spend keys
 */

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CHAINS } from "@/lib/contracts";
import {
  filterMine,
  getAnnouncements,
  getIncomingTransfers,
  matchTransfersToAnnouncements,
  type AnnouncementLog,
  type TransferLog,
} from "@/lib/scanner";
import { ExternalLink, Eye, EyeOff, Scan, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { formatUnits } from "viem";
import { useAccount, useChainId } from "wagmi";

export default function Inbox() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const chain = CHAINS[chainId];

  // View-only keys (session storage only, never persisted)
  const [spendPriv, setSpendPriv] = useState("");
  const [viewPriv, setViewPriv] = useState("");
  const [showKeys, setShowKeys] = useState(false);
  const [keysImported, setKeysImported] = useState(false);

  // Scanning state
  const [scanning, setScanning] = useState(false);
  const [announcements, setAnnouncements] = useState<
    Array<AnnouncementLog & { transfer?: TransferLog }>
  >([]);
  const [error, setError] = useState<string | null>(null);

  // Try to load keys from sessionStorage on mount
  useEffect(() => {
    const savedSpend = sessionStorage.getItem("veilguard_spend_priv");
    const savedView = sessionStorage.getItem("veilguard_view_priv");
    if (savedSpend && savedView) {
      setSpendPriv(savedSpend);
      setViewPriv(savedView);
      setKeysImported(true);
    }
  }, []);

  const handleImportKeys = () => {
    if (!spendPriv || !viewPriv) {
      setError("Please enter both spend and view private keys");
      return;
    }

    // Validate hex format
    if (
      !/^0x[0-9a-fA-F]{64}$/.test(spendPriv) ||
      !/^0x[0-9a-fA-F]{64}$/.test(viewPriv)
    ) {
      setError(
        "Invalid key format. Keys must be 0x-prefixed 64-character hex strings"
      );
      return;
    }

    // Store in session storage (cleared on browser close)
    sessionStorage.setItem("veilguard_spend_priv", spendPriv);
    sessionStorage.setItem("veilguard_view_priv", viewPriv);
    setKeysImported(true);
    setError(null);
  };

  const handleClearKeys = () => {
    sessionStorage.removeItem("veilguard_spend_priv");
    sessionStorage.removeItem("veilguard_view_priv");
    setSpendPriv("");
    setViewPriv("");
    setKeysImported(false);
    setAnnouncements([]);
  };

  const handleScan = async () => {
    if (!keysImported) {
      setError("Please import your keys first");
      return;
    }

    if (!chain?.stealthHelper) {
      setError("StealthHelper contract not configured for this chain");
      return;
    }

    setScanning(true);
    setError(null);

    try {
      // Get all announcements
      const allAnnouncements = await getAnnouncements(
        chainId,
        chain.stealthHelper as `0x${string}`,
        0n,
        "latest"
      );

      console.log(`Found ${allAnnouncements.length} total announcements`);

      // Filter mine using view key
      const myAnnouncements = filterMine(allAnnouncements, {
        spendPriv: spendPriv as `0x${string}`,
        viewPriv: viewPriv as `0x${string}`,
      });

      console.log(`Found ${myAnnouncements.length} announcements for my keys`);

      // Get transfers for each stealth address
      const transfers: TransferLog[] = [];
      for (const ann of myAnnouncements) {
        const token = chain.tokens[0]?.address as `0x${string}`;
        if (token) {
          const incomingTransfers = await getIncomingTransfers(
            chainId,
            token,
            ann.stealthAddress,
            ann.blockNumber,
            "latest"
          );
          transfers.push(...incomingTransfers);
        }
      }

      console.log(`Found ${transfers.length} incoming transfers`);

      // Match transfers to announcements
      const matched = matchTransfersToAnnouncements(myAnnouncements, transfers);
      setAnnouncements(matched);
    } catch (err: any) {
      console.error("Scan error:", err);
      setError(err.message || "Failed to scan for announcements");
    } finally {
      setScanning(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Card>
          <CardHeader>
            <CardTitle>📬 Inbox (View-Key Mode)</CardTitle>
            <CardDescription>
              Connect your wallet to access the inbox
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="container mx-auto py-12 px-4 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-6 w-6" />
              📬 Inbox (View-Key Mode)
            </CardTitle>
            <CardDescription>
              Scan for incoming stealth payments using only your view key. Your
              spend key stays safe.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Key Import Section */}
            {!keysImported ? (
              <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                <h3 className="font-semibold text-sm">
                  Import Merchant Keys (Session Only)
                </h3>
                <Alert>
                  <AlertDescription className="text-xs">
                    🔒 Keys are stored in session storage only and cleared when
                    you close the browser. Never share your private keys. Go to
                    /security to generate new keys.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="spendPriv">Spend Private Key</Label>
                  <div className="relative">
                    <Input
                      id="spendPriv"
                      type={showKeys ? "text" : "password"}
                      placeholder="0x..."
                      value={spendPriv}
                      onChange={(e) => setSpendPriv(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKeys(!showKeys)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showKeys ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="viewPriv">View Private Key</Label>
                  <Input
                    id="viewPriv"
                    type={showKeys ? "text" : "password"}
                    placeholder="0x..."
                    value={viewPriv}
                    onChange={(e) => setViewPriv(e.target.value)}
                  />
                </div>

                <Button onClick={handleImportKeys} className="w-full">
                  Import Keys
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between border rounded-lg p-4 bg-green-500/10 border-green-500/20">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">
                    Keys imported (session only)
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={handleClearKeys}>
                  Clear Keys
                </Button>
              </div>
            )}

            {/* Scan Button */}
            <div className="flex gap-2">
              <Button
                onClick={handleScan}
                disabled={!keysImported || scanning}
                className="flex-1"
              >
                {scanning ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Scanning...
                  </>
                ) : (
                  <>
                    <Scan className="mr-2 h-4 w-4" />
                    Scan for My Payments
                  </>
                )}
              </Button>
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Results */}
            {announcements.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold">
                  Found {announcements.length} Incoming Payment(s)
                </h3>
                {announcements.map((ann, idx) => (
                  <Card key={idx} className="border-green-500/20">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-sm">
                            Stealth Address: {ann.stealthAddress.slice(0, 10)}
                            ...
                            {ann.stealthAddress.slice(-8)}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            Block: {ann.blockNumber.toString()}
                          </CardDescription>
                        </div>
                        {ann.transfer && (
                          <Badge variant="default" className="bg-green-500">
                            Paid
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {ann.transfer ? (
                        <>
                          <div className="text-2xl font-bold text-green-500">
                            {formatUnits(ann.transfer.value, 6)}{" "}
                            {chain.tokens[0]?.symbol || "USDC"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            From: {ann.transfer.from.slice(0, 10)}...
                            {ann.transfer.from.slice(-8)}
                          </div>
                          <a
                            href={`${chain.explorer}/tx/${ann.transfer.transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline"
                          >
                            View Transaction{" "}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </>
                      ) : (
                        <Badge variant="secondary">
                          Announced, awaiting payment
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {announcements.length === 0 && keysImported && !scanning && (
              <Alert>
                <AlertDescription>
                  No payments found. Click "Scan for My Payments" to search the
                  blockchain.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
      <Footer />
    </>
  );
}
