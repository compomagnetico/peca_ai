"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Car } from "lucide-react";
import { SignUpForm } from "@/components/SignUpForm";
import { Button } from "@/components/ui/button";

const LoginPage = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<"login" | "signup">("login");

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
        
        {view === "login" ? (
          <div>
            <Auth
              supabaseClient={supabase}
              appearance={{ theme: ThemeSupa }}
              providers={[]}
              showLinks={false}
              theme="light"
              localization={{
                variables: {
                  sign_in: {
                    email_label: "Endereço de e-mail",
                    password_label: "Sua senha",
                    button_label: "Entrar",
                  },
                  forgotten_password: {
                    email_label: "Endereço de e-mail",
                    button_label: "Enviar instruções de recuperação",
                    link_text: "Esqueceu sua senha?",
                  },
                },
              }}
            />
             <div className="mt-4 text-center text-sm">
              Não tem uma conta?{" "}
              <Button variant="link" className="p-0 h-auto" onClick={() => setView("signup")}>
                Cadastre-se
              </Button>
            </div>
          </div>
        ) : (
          <SignUpForm onSwitchToLogin={() => setView("login")} />
        )}
      </div>
    </div>
  );
};

export default LoginPage;