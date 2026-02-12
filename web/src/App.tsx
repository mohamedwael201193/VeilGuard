import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { config } from "@/lib/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { WagmiProvider } from "wagmi";
import Analytics from "./pages/Analytics";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Inbox from "./pages/Inbox";
import InvoiceView from "./pages/InvoiceView";
import Legal from "./pages/Legal";
import NewInvoice from "./pages/NewInvoice";
import NotFound from "./pages/NotFound";
import PayInvoice from "./pages/PayInvoice";
import POS from "./pages/POS";
import POSPay from "./pages/POSPay";
import ProFeatures from "./pages/ProFeatures";
import Receipts from "./pages/Receipts";
import Security from "./pages/Security";
import VerifyReceipt from "./pages/VerifyReceipt";
import EscrowPage from "./pages/EscrowPage";

const queryClient = new QueryClient();

const App = () => (
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/invoice/new" element={<NewInvoice />} />
            <Route path="/invoice/:id" element={<InvoiceView />} />
            <Route path="/pay/pos" element={<POSPay />} />
            <Route path="/pay/:invoiceId" element={<PayInvoice />} />
            <Route path="/receipts" element={<Receipts />} />
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/security" element={<Security />} />
            <Route path="/verify" element={<VerifyReceipt />} />
            <Route path="/features" element={<ProFeatures />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/escrow" element={<EscrowPage />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </WagmiProvider>
);

export default App;
