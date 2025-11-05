export type WaveStatus = "Done" | "In Progress" | "Planned";

export type Deliverable = {
  label: string;
  done?: boolean;
};

export type Wave = {
  id: string; // "wave-2"
  number: number; // 2
  title: string; // "Mainnet Private Invoices"
  dateRange: string; // "Nov 4–18, 2025"
  status: WaveStatus;
  objectives: string[];
  deliverables: Deliverable[];
  acceptanceCriteria: string[];
  dependencies?: string[];
  risks?: string[];
  demoPlan?: string[];
  kpis?: string[];
  notes?: string[];
};
