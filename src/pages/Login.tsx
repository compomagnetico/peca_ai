"use client";

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Car } from "lucide-react";
import { UsernameLoginForm } from "@/components/auth/UsernameLoginForm"; // Importar o novo componente

const LoginPage = () => {
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) {
      navigate("/");
    }
  }, [session, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6">
        <div className="flex items-center gap-2 justify-center">
            <Car className="h-8 w-8 text-primary" />
            <span className="font-bold text-2xl bg-gradient-to-r from-blue-600 to-green-500 bg-clip-text text-transparent">
              Peça AI
            </span>
        </div>
        
        <UsernameLoginForm /> {/* Usar o novo formulário de login */}
      </div>
    </div>
  );
};

export default LoginPage;