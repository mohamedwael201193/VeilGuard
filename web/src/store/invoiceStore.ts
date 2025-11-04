import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Invoice, InvoiceStats } from '@/types';

interface InvoiceStore {
  invoices: Invoice[];
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  getInvoice: (id: string) => Invoice | undefined;
  getStats: () => InvoiceStats;
}

export const useInvoiceStore = create<InvoiceStore>()(
  persist(
    (set, get) => ({
      invoices: [],
      
      addInvoice: (invoice) => {
        set((state) => ({
          invoices: [invoice, ...state.invoices],
        }));
      },
      
      updateInvoice: (id, updates) => {
        set((state) => ({
          invoices: state.invoices.map((inv) =>
            inv.id === id ? { ...inv, ...updates } : inv
          ),
        }));
      },
      
      getInvoice: (id) => {
        return get().invoices.find((inv) => inv.id === id);
      },
      
      getStats: () => {
        const invoices = get().invoices;
        const paidInvoices = invoices.filter((inv) => inv.status === 'paid');
        
        const totalGMV = paidInvoices.reduce((sum, inv) => {
          return sum + parseFloat(inv.amount);
        }, 0);
        
        const successRate = invoices.length > 0
          ? (paidInvoices.length / invoices.length) * 100
          : 0;
        
        const timeToPay = paidInvoices
          .filter((inv) => inv.paidAt)
          .map((inv) => (inv.paidAt! - inv.createdAt) / 60000); // Convert to minutes
        
        const medianTimeToPayMinutes = timeToPay.length > 0
          ? timeToPay.sort((a, b) => a - b)[Math.floor(timeToPay.length / 2)]
          : 0;
        
        return {
          totalInvoices: invoices.length,
          totalGMV: totalGMV.toFixed(2),
          successRate: Math.round(successRate),
          medianTimeToPayMinutes: Math.round(medianTimeToPayMinutes),
        };
      },
    }),
    {
      name: 'veilguard-invoices',
    }
  )
);
