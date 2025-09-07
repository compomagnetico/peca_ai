import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import BudgetRequestPage from "./pages/BudgetRequest";
import AutoPartsPage from "./pages/AutoParts";
import ProfilePage from "./pages/Profile";
import BudgetResponsesPage from "./pages/BudgetResponses";
import AssistantPage from "./pages/Assistant";
import CreateOrderPage from "./pages/CreateOrder";
import SubmitBudgetResponsePage from "./pages/SubmitBudgetResponse";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/Login";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/budget-request" element={<BudgetRequestPage />} />
                <Route path="/budget-responses" element={<BudgetResponsesPage />} />
                <Route path="/auto-parts" element={<AutoPartsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/assistant" element={<AssistantPage />} />
                <Route path="/create-order/:responseId" element={<CreateOrderPage />} />
              </Route>
            </Route>

            <Route path="/submit-response/:shortId/:shopId" element={<SubmitBudgetResponsePage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;