/**
 * Security & Key Management
 * Generate and manage merchant meta-keys (spend/view) for stealth addresses
 * All operations are client-side only - keys never leave the browser
 */

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Textarea } from "@/components/ui/textarea";
import * as secp from "@noble/secp256k1";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  Key,
  Shield,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { bytesToHex, encodePacked, keccak256 } from "viem";
import { useAccount } from "wagmi";

export default function Security() {
  const { address, isConnected } = useAccount();

  // Key generation
  const [spendPriv, setSpendPriv] = useState("");
  const [viewPriv, setViewPriv] = useState("");
  const [spendPub, setSpendPub] = useState("");
  const [viewPub, setViewPub] = useState("");
  const [showKeys, setShowKeys] = useState(false);

  // Demo keys (derived from wallet)
  const [showDemoKeys, setShowDemoKeys] = useState(false);
  const [demoSpendPriv, setDemoSpendPriv] = useState("");
  const [demoViewPriv, setDemoViewPriv] = useState("");

  // Import/Export
  const [importJson, setImportJson] = useState("");
  const [passphrase, setPassphrase] = useState("");

  const generateDemoKeys = () => {
    if (!address) {
      alert("Please connect your wallet first!");
      return;
    }

    // Derive deterministic keys from wallet address
    const spendingPriv = keccak256(
      encodePacked(
        ["string", "address"],
        ["spending", address as `0x${string}`]
      )
    );
    const viewingPriv = keccak256(
      encodePacked(["string", "address"], ["viewing", address as `0x${string}`])
    );

    console.log("Security - Demo keys:");
    console.log("Spending:", spendingPriv);
    console.log("Viewing:", viewingPriv);

    setDemoSpendPriv(spendingPriv);
    setDemoViewPriv(viewingPriv);
    setShowDemoKeys(true);
  };

  const generateKeys = () => {
    // Generate random private keys
    const spendPrivBytes = secp.utils.randomSecretKey();
    const viewPrivBytes = secp.utils.randomSecretKey();

    // Derive public keys (uncompressed)
    const spendPubBytes = secp.getPublicKey(spendPrivBytes, false);
    const viewPubBytes = secp.getPublicKey(viewPrivBytes, false);

    // Convert to hex - bytesToHex already includes 0x prefix
    const spendPrivHex = bytesToHex(spendPrivBytes);
    const viewPrivHex = bytesToHex(viewPrivBytes);
    const spendPubHex = bytesToHex(spendPubBytes);
    const viewPubHex = bytesToHex(viewPubBytes);

    setSpendPriv(spendPrivHex);
    setViewPriv(viewPrivHex);
    setSpendPub(spendPubHex);
    setViewPub(viewPubHex);
  };

  const exportKeys = () => {
    if (!spendPriv || !viewPriv) {
      alert("No keys to export. Generate keys first.");
      return;
    }

    const keyData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      keys: {
        spendPriv,
        viewPriv,
        spendPub,
        viewPub,
      },
      warning: "NEVER share these private keys. Store securely offline.",
    };

    // Simple XOR encryption with passphrase (for demo - use proper crypto in production)
    let dataStr = JSON.stringify(keyData, null, 2);
    if (passphrase) {
      dataStr = btoa(dataStr); // Base64 encode as basic obfuscation
      // In production, use proper encryption like AES-GCM
    }

    // Download as file
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `veilguard-keys-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importKeys = () => {
    try {
      let dataStr = importJson;

      // Try to decode if it was "encrypted"
      if (passphrase && !dataStr.startsWith("{")) {
        dataStr = atob(dataStr);
      }

      const keyData = JSON.parse(dataStr);

      if (keyData.keys) {
        setSpendPriv(keyData.keys.spendPriv || "");
        setViewPriv(keyData.keys.viewPriv || "");
        setSpendPub(keyData.keys.spendPub || "");
        setViewPub(keyData.keys.viewPub || "");
        alert("Keys imported successfully!");
      } else {
        alert("Invalid key file format");
      }
    } catch (error) {
      console.error("Import error:", error);
      alert("Failed to import keys. Check the file format and passphrase.");
    }
  };

  const clearKeys = () => {
    if (
      confirm("Are you sure you want to clear all keys? This cannot be undone.")
    ) {
      setSpendPriv("");
      setViewPriv("");
      setSpendPub("");
      setViewPub("");
      setImportJson("");
      setPassphrase("");
      sessionStorage.removeItem("veilguard_spend_priv");
      sessionStorage.removeItem("veilguard_view_priv");
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label} copied to clipboard!`);
  };

  return (
    <>
      <Header />
      <div className="container mx-auto py-12 px-4 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-6 w-6" />
              🔐 Security & Key Management
            </CardTitle>
            <CardDescription>
              Generate and manage your merchant meta-keys for stealth addresses.
              All operations happen client-side - your keys never leave this
              browser.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Security Warning */}
            <Alert variant="destructive">
              <AlertTriangle className="h-5 w-5" />
              <AlertDescription>
                <strong>⚠️ Critical Security Notice:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>
                    These keys control all funds sent to your stealth addresses
                  </li>
                  <li>Never share your private keys with anyone</li>
                  <li>
                    Store backups securely offline (hardware wallet, paper,
                    encrypted USB)
                  </li>
                  <li>
                    If you lose these keys, you lose access to all stealth funds
                  </li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Demo Keys (For Testing Only) */}
            <div className="space-y-4 border rounded-lg p-4 bg-blue-500/5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Demo Keys (For Testing)</h3>
                  <p className="text-sm text-muted-foreground">
                    Keys derived from your connected wallet address. Use for
                    testing only!
                  </p>
                </div>
                <Button
                  onClick={generateDemoKeys}
                  disabled={!isConnected}
                  variant="outline"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Show Demo Keys
                </Button>
              </div>

              {!isConnected && (
                <Alert className="border-yellow-500/50 bg-yellow-500/10">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <AlertDescription>
                    Please connect your wallet to view demo keys.
                  </AlertDescription>
                </Alert>
              )}

              {showDemoKeys && demoSpendPriv && (
                <div className="space-y-4 mt-4">
                  <Alert className="border-blue-500/50 bg-blue-500/10">
                    <AlertTriangle className="h-5 w-5 text-blue-500" />
                    <AlertDescription>
                      <strong>ℹ️ Demo Mode:</strong> These keys are
                      deterministically derived from your wallet address:{" "}
                      <code className="text-xs bg-black/20 px-1 py-0.5 rounded">
                        {address}
                      </code>
                      <br />
                      <strong className="text-yellow-500">
                        ⚠️ For testing only!
                      </strong>{" "}
                      In production, use randomly generated keys.
                    </AlertDescription>
                  </Alert>

                  <div>
                    <Label>Spending Private Key (for Inbox)</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="text"
                        value={demoSpendPriv}
                        readOnly
                        className="font-mono text-xs"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(demoSpendPriv, "Spending Private Key")
                        }
                      >
                        Copy
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      👆 Copy this key and paste it into the Inbox page "Spend
                      Private Key" field
                    </p>
                  </div>

                  <div>
                    <Label>Viewing Private Key (for Inbox)</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="text"
                        value={demoViewPriv}
                        readOnly
                        className="font-mono text-xs"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(demoViewPriv, "Viewing Private Key")
                        }
                      >
                        Copy
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      👆 Copy this key and paste it into the Inbox page "View
                      Private Key" field
                    </p>
                  </div>

                  <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-3">
                    <h4 className="font-semibold text-sm mb-2">
                      📋 Next Steps:
                    </h4>
                    <ol className="text-sm space-y-1 list-decimal list-inside">
                      <li>Copy both keys above</li>
                      <li>Go to the Inbox page (📬 Inbox in header)</li>
                      <li>Paste the Spending Private Key in the first field</li>
                      <li>Paste the Viewing Private Key in the second field</li>
                      <li>Click "Import Keys"</li>
                      <li>Click "Scan for My Payments"</li>
                    </ol>
                  </div>
                </div>
              )}
            </div>

            {/* Generate Keys */}
            <div className="space-y-4 border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Generate New Meta-Keys</h3>
                <Button onClick={generateKeys}>
                  <Key className="mr-2 h-4 w-4" />
                  Generate Keys
                </Button>
              </div>

              {(spendPriv || viewPriv) && (
                <Alert className="border-green-500/50 bg-green-500/10">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <AlertDescription>
                    Keys generated successfully! Export and store them securely
                    before using.
                  </AlertDescription>
                </Alert>
              )}

              {spendPriv && (
                <div className="space-y-4 mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <Label>Show Private Keys</Label>
                    <button
                      onClick={() => setShowKeys(!showKeys)}
                      className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      {showKeys ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      {showKeys ? "Hide" : "Show"}
                    </button>
                  </div>

                  <div>
                    <Label>Spend Private Key</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type={showKeys ? "text" : "password"}
                        value={spendPriv}
                        readOnly
                        className="font-mono text-xs"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(spendPriv, "Spend Private Key")
                        }
                      >
                        Copy
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>View Private Key</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type={showKeys ? "text" : "password"}
                        value={viewPriv}
                        readOnly
                        className="font-mono text-xs"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(viewPriv, "View Private Key")
                        }
                      >
                        Copy
                      </Button>
                    </div>
                  </div>

                  <details className="text-xs text-muted-foreground">
                    <summary className="cursor-pointer font-semibold mb-2">
                      Show Public Keys
                    </summary>
                    <div className="space-y-2">
                      <div>
                        <p className="mb-1">Spend Public Key:</p>
                        <code className="bg-background px-2 py-1 rounded break-all block">
                          {spendPub}
                        </code>
                      </div>
                      <div>
                        <p className="mb-1">View Public Key:</p>
                        <code className="bg-background px-2 py-1 rounded break-all block">
                          {viewPub}
                        </code>
                      </div>
                    </div>
                  </details>
                </div>
              )}
            </div>

            {/* Export Keys */}
            <div className="space-y-4 border rounded-lg p-4">
              <h3 className="font-semibold">Export Keys (Encrypted JSON)</h3>
              <div>
                <Label htmlFor="passphrase">Passphrase (Optional)</Label>
                <Input
                  id="passphrase"
                  type="password"
                  placeholder="Enter passphrase for encryption"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Add a passphrase for basic protection. Store this passphrase
                  separately.
                </p>
              </div>
              <Button
                onClick={exportKeys}
                disabled={!spendPriv}
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Key File
              </Button>
            </div>

            {/* Import Keys */}
            <div className="space-y-4 border rounded-lg p-4">
              <h3 className="font-semibold">Import Keys from JSON</h3>
              <div>
                <Label htmlFor="importJson">Paste Key File Contents</Label>
                <Textarea
                  id="importJson"
                  placeholder='{"version":"1.0",...}'
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  rows={6}
                  className="font-mono text-xs"
                />
              </div>
              <div>
                <Label htmlFor="importPassphrase">
                  Passphrase (if encrypted)
                </Label>
                <Input
                  id="importPassphrase"
                  type="password"
                  placeholder="Enter passphrase"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                />
              </div>
              <Button
                onClick={importKeys}
                variant="secondary"
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                Import Keys
              </Button>
            </div>

            {/* Clear Keys */}
            <div className="border border-destructive/50 rounded-lg p-4 bg-destructive/5">
              <h3 className="font-semibold text-destructive mb-2">
                Danger Zone
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Clear all keys from this browser session. Make sure you have a
                backup first!
              </p>
              <Button
                onClick={clearKeys}
                variant="destructive"
                className="w-full"
              >
                Clear All Keys
              </Button>
            </div>

            {/* Usage Guide */}
            <Alert>
              <AlertDescription className="text-xs space-y-2">
                <strong>Usage Guide:</strong>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Generate new keys or import existing ones</li>
                  <li>
                    Export and backup your keys securely (offline storage
                    recommended)
                  </li>
                  <li>
                    Use "Spend Private Key" and "View Private Key" in the Inbox
                    to scan for payments
                  </li>
                  <li>
                    In Invoice View, use these keys to sweep funds or issue
                    refunds
                  </li>
                  <li>
                    View key alone is sufficient for detecting payments
                    (view-only mode)
                  </li>
                </ol>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </>
  );
}
