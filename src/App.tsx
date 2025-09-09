import { lazy, Suspense } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { PageLoader } from "./components/PageLoader";

// Lazy load pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const BudgetRequestPage = lazy(() => import("./pages/BudgetRequest"));
const AutoPartsPage = lazy(() => import("./pages/AutoParts"));
const ProfilePage = lazy(() => import("./pages/Profile"));
const BudgetResponsesPage = lazy(() => import("./pages/BudgetResponses"));
const AssistantPage = lazy(() => import("./pages/Assistant"));
const CreateOrderPage = lazy(() => import("./pages/CreateOrder"));
const SubmitBudgetResponsePage = lazy(() => import("./pages/SubmitBudgetResponse"));
const NotFound = lazy(() => import("./pages/NotFound"));
const LoginPage = lazy(() => import("./pages/Login"));
const SignUpPage = lazy(() => import("./pages/SignUp"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPassword"));
const UpdatePasswordPage = lazy(() => import("./pages/UpdatePassword"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/update-password" element={<UpdatePasswordPage />} />
              
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
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;