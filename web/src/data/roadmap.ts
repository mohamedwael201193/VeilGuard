import { Wave } from "@/types/roadmap";

export const waves: Wave[] = [
  {
    id: "wave-2",
    number: 2,
    title: "Mainnet Private Invoices (Testnet complete, mainnet gating)",
    dateRange: "Nov 4–18, 2025",
    status: "In Progress",
    objectives: [
      "Deliver private invoicing via ERC-5564 stealth addresses with smooth UX.",
      "Prove end-to-end flow: create → pay → detect → sweep → receipt → verify.",
    ],
    deliverables: [
      {
        label: "ERC-5564 stealth address generation (viem-only derivation)",
        done: true,
      },
      { label: "Ephemeral key generation & storage hygiene", done: true },
      {
        label: "Inbox scanning via Announcement events (initiator indexed)",
        done: true,
      },
      {
        label: "Customer Payment Page with automatic announce + payment",
        done: true,
      },
      { label: "Auto gas pre-fund (0.1 POL) to stealth address", done: true },
      { label: "USDC/tUSDC payment support on Amoy", done: true },
      {
        label: "Self-custodial sweeper (stealthAddress balance check fix)",
        done: true,
      },
      {
        label: "Cryptographic receipts v1 (keccak(invoiceId||txHash))",
        done: true,
      },
      { label: "Receipt verification page", done: true },
      {
        label: "Mark-as-paid with auto TX-hash fill from localStorage",
        done: true,
      },
      { label: "Payment links (EIP-681 style) and QR codes", done: true },
      { label: "Security / key management page", done: true },
      { label: "Public stats (MVP) & dashboard polish", done: true },
      {
        label:
          "Contract verification pipeline (Amoy first), mainnet-ready checklists",
        done: false,
      },
    ],
    acceptanceCriteria: [
      "End-to-end happy path validated on Polygon Amoy with tUSDC.",
      "Inbox detects announcements and transfers for provided view key only.",
      "Sweeper moves funds from stealth to merchant safe address without manual gas.",
      "Receipt v1 verifies on the verification page against on-chain value.",
      "Contracts verified on Amoy; mainnet deploy plan documented with owner keys and pausable controls.",
    ],
    dependencies: [
      "Polygon Amoy RPC & Polygonscan verification.",
      "Viem v2 and wagmi v2 integration completed.",
    ],
    risks: [
      "Key handling mistakes: mitigated by using viem privateKeyToAccount consistently.",
      "Scanner fragility: mitigated by exact event signature with initiator indexed.",
    ],
    demoPlan: [
      "Create invoice → open payment page → announce + (conditional) gas + pay.",
      "Scan inbox with viewing key only; show detection.",
      "Sweep to safe; show transaction link.",
      "Create on-chain receipt and verify.",
    ],
    kpis: [
      "Time-to-pay < 90s from link open.",
      "Inbox detection < 1 block from announcement.",
      "Sweep success rate 100% on test runs.",
    ],
    notes: [
      "Amoy contract addresses documented in COMPLETE_PROJECT_DOCUMENTATION.md.",
      "Mainnet launch is gated on verification, owner controls, and incident procedures.",
    ],
  },

  {
    id: "wave-3",
    number: 3,
    title:
      "Differentiation Pack: Audit-grade Receipts + Smart Gas + Refunds + Memos",
    dateRange: "Nov 19–Dec 3, 2025",
    status: "Planned",
    objectives: [
      "Eliminate replay risk and tighten auth around receipts.",
      "Reduce gas waste and add merchant-friendly refund mechanics.",
      "Enable selective disclosure memos and partial/over-payment handling.",
    ],
    deliverables: [
      {
        label:
          "Commitment v2: keccak(invoiceId, txHash, chainId, token, amount, stealth, version)",
      },
      {
        label:
          "Merchant-only writes: ReceiptStore writable via InvoiceRegistry",
      },
      { label: "Verify page: prefer v2, fallback to v1" },
      {
        label:
          "Smart POL top-up: send only if stealth balance < sweep threshold",
      },
      { label: "Invoice expiry + optimistic refunds (request/execute events)" },
      {
        label:
          "Encrypted memos: ECDH(viewKey ↔ payerEphemeral) + AES-GCM; on-chain hash+URI",
      },
      { label: "Partial/over-payment aware dashboard totals" },
      {
        label:
          "Security polish: 65-byte eph pubkey checks, chainId pinning, invariants test",
      },
      {
        label: "Docs: Why-not-POL-Stealth, JUDGING_NOTES.md, SECURITY_MODEL.md",
      },
    ],
    acceptanceCriteria: [
      "storeReceipt via InvoiceRegistry only; direct writes to ReceiptStore rejected.",
      "VerifyReceipt shows v2 match and passes regression for v1 receipts.",
      "maybeTopUpGas only funds stealth address when needed (gasPrice-aware).",
      "Refunds allowed post-expiry; events emitted and sweep helper supports payout.",
      "Memo decrypt demo with one-time disclosure link.",
    ],
    dependencies: ["Current contracts + minor upgrades (if needed)."],
    risks: [
      "Backwards-compatibility for v1 receipts: mitigated by fallback path.",
    ],
    demoPlan: [
      "Mark-as-paid → store v2 receipt → verify page shows v2 success.",
      "Payment with stealth pre-funded: top-up skipped; with low balance: top-up executed.",
      "Expired invoice → refund request → refund execution via sweeper.",
      "Reveal memo on verification page via auditor link.",
    ],
    kpis: [
      "Gas saved on top-up path vs fixed 0.1 POL baseline.",
      "Receipt forgery attempts blocked (no external storeCommitment).",
    ],
  },

  {
    id: "wave-4",
    number: 4,
    title: "zk-Receipt V1",
    dateRange: "Dec 4–18, 2025",
    status: "Planned",
    objectives: [
      "Zero-knowledge proof of payment without revealing payer/stealth linkage.",
      "Provide a hosted verification API and client SDK.",
    ],
    deliverables: [
      {
        label:
          "Noir circuit: prove paidAmount ≥ invoiceAmount with commitment binding",
      },
      { label: "Verifier contract + integration on Amoy" },
      { label: "REST/Edge verify API + SDK (ts)" },
      { label: "Privacy-aware refunds wired to zk proof (optional path)" },
    ],
    acceptanceCriteria: [
      "Proof verifies on-chain and via API",
      "Client can generate proof in-browser or via worker in < 10s on laptop hardware",
    ],
    dependencies: ["Noir toolchain, prover benchmarks, ABI generation."],
    risks: ["Proof size/time variability; provide server proving fallback."],
    demoPlan: [
      "Generate proof → on-chain verify → UI green check + API response.",
    ],
    kpis: ["Proof success rate > 95%; median verify < 200ms (API)."],
  },

  {
    id: "wave-5",
    number: 5,
    title: "RWA Attestations",
    dateRange: "Dec 19, 2025–Jan 2, 2026",
    status: "Planned",
    objectives: [
      "Link off-chain merchant facts to invoices via attestations.",
      "Add verifier staking to elevate trust in receipts.",
    ],
    deliverables: [
      {
        label: "EAS/AttestationStation integration for merchant/invoice facts",
      },
      {
        label:
          "Verifier staking + slashing conditions (off-chain policy, on-chain markers)",
      },
      { label: "Cross-chain verification hooks" },
    ],
    acceptanceCriteria: [
      "Attestations retrievable from verify page and API",
      "Staked verifiers visible with risk badges",
    ],
    dependencies: ["EAS/AS, indexers."],
    risks: ["Attestation UX complexity; provide clear trust labels."],
    demoPlan: ["Show verified merchant attestation next to receipt."],
    kpis: ["% invoices with attestations; verifier participation."],
  },

  {
    id: "wave-6",
    number: 6,
    title: "AggLayer & AgentPay",
    dateRange: "Jan 3–17, 2026",
    status: "Planned",
    objectives: [
      "Route payments across chains with minimal friction.",
      "Expose an AgentPay SDK for scheduled/agentic payments.",
    ],
    deliverables: [
      { label: "AggLayer routing integration" },
      { label: "AgentPay SDK (TypeScript) with examples" },
      { label: "Multi-chain payment flows + docs" },
    ],
    acceptanceCriteria: ["Cross-chain invoice settlement demo end-to-end."],
    dependencies: ["Bridging/routing providers."],
    risks: ["Cross-chain finality variance; add warnings & holds."],
    demoPlan: ["Invoice on chain A settled from chain B via AggLayer."],
    kpis: ["Cross-chain success rate; additional latency vs same-chain."],
  },

  {
    id: "wave-7",
    number: 7,
    title: "Fraud Shield V2",
    dateRange: "Jan 18–Feb 1, 2026",
    status: "Planned",
    objectives: ["Proactive fraud/risk detection for merchants."],
    deliverables: [
      { label: "Risk scoring + patterns (announce/transfer heuristics)" },
      { label: "Risk dashboard + protection rules" },
      { label: "Automated dispute flows (evidence bundle export)" },
    ],
    acceptanceCriteria: ["Risk tags appear in Inbox and Invoice pages."],
    dependencies: ["Event indexing & heuristics module."],
    risks: ["False positives; provide overrides and audit logs."],
    demoPlan: ["Flag risky invoice and show merchant action flow."],
    kpis: ["Dispute rate, false positive rate."],
  },

  {
    id: "wave-8",
    number: 8,
    title: "Treasury Agent V2",
    dateRange: "Feb 2–16, 2026",
    status: "Planned",
    objectives: [
      "Optimize merchant treasury sweeps and yields with guardrails.",
    ],
    deliverables: [
      { label: "Strategy marketplace (policies as code)" },
      { label: "AI‑assisted rebalancing with risk caps" },
      { label: "Performance & risk reporting" },
    ],
    acceptanceCriteria: [
      "Outperform naive sweep by target basis points over test period.",
    ],
    dependencies: ["Safe integrations, yield venues."],
    risks: ["Market risk; include sandbox + dry-run modes."],
    demoPlan: ["Compare returns vs baseline over 14 days (simulated)."],
    kpis: ["Net APY uplift, drawdown limits respected."],
  },

  {
    id: "wave-9",
    number: 9,
    title: "Multi‑Merchant Pilots",
    dateRange: "Feb 17–Mar 3, 2026",
    status: "Planned",
    objectives: ["Validate with enterprise merchants; add compliance memoing."],
    deliverables: [
      { label: "Org onboarding + roles" },
      { label: "Compliance memos (signed, reveal-once)" },
      { label: "Multi-sig support (Safe)" },
      { label: "Advanced analytics exports" },
    ],
    acceptanceCriteria: [
      "2–3 pilot merchants live on testnet or gated mainnet.",
    ],
    dependencies: ["Safe, attestation infra."],
    risks: ["Onboarding friction; add guided setup."],
    demoPlan: ["Org demo with roles, memos, and receipts."],
    kpis: ["Pilot retention, setup time."],
  },

  {
    id: "wave-10",
    number: 10,
    title: "CDK Validium Scale",
    dateRange: "Mar 4–18, 2026",
    status: "Planned",
    objectives: ["Scale costs/throughput with a Validium roadmap."],
    deliverables: [
      { label: "CDK Validium design + milestones" },
      { label: "Load/perf testing harness" },
      { label: "Production readiness assessment" },
    ],
    acceptanceCriteria: [
      "Throughput target met in soak tests; cost per invoice reduced.",
    ],
    dependencies: ["CDK components, sequencer access."],
    risks: ["Data availability assumptions; clear tradeoff doc."],
    demoPlan: ["High‑volume invoice simulation with metrics."],
    kpis: ["TPS, $ per invoice, failure rate under load."],
  },
];
