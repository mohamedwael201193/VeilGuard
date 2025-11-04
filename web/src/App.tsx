import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { config } from "@/lib/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as HotToaster } from "react-hot-toast";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { WagmiProvider } from "wagmi";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Inbox from "./pages/Inbox";
import InvoiceView from "./pages/InvoiceView";
import Legal from "./pages/Legal";
import NewInvoice from "./pages/NewInvoice";
import NotFound from "./pages/NotFound";
import Receipts from "./pages/Receipts";
import Roadmap from "./pages/Roadmap";
import Security from "./pages/Security";
import VerifyReceipt from "./pages/VerifyReceipt";

const queryClient = new QueryClient();

const App = () => (
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HotToaster position="bottom-right" />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/invoice/new" element={<NewInvoice />} />
            <Route path="/invoice/:id" element={<InvoiceView />} />
            <Route path="/receipts" element={<Receipts />} />
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/security" element={<Security />} />
            <Route path="/verify" element={<VerifyReceipt />} />
            <Route path="/roadmap" element={<Roadmap />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </WagmiProvider>
);

export default App;
