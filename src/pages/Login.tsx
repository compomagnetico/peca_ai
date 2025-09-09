"use client";

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Car } from "lucide-react";

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
        
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={["email", "phone"]}
          showLinks={true}
          theme="light"
          localization={{
            variables: {
              sign_in: {
                email_label: "Endereço de e-mail",
                password_label: "Sua senha",
                button_label: "Entrar",
                phone_label: "Número de Telefone",
                phone_input_placeholder: "Ex: +5511988887777",
              },
              sign_up: {
                email_label: "Endereço de e-mail",
                password_label: "Crie sua senha",
                button_label: "Cadastrar",
                phone_label: "Número de Telefone",
                phone_input_placeholder: "Ex: +5511988887777",
                link_text: "Não tem uma conta? Cadastre-se",
              },
              forgotten_password: {
                email_label: "Endereço de e-mail",
                button_label: "Enviar instruções de recuperação",
                link_text: "Esqueceu sua senha?",
              },
            },
          }}
          form_fields={{
            sign_up: {
              city: {
                label: 'Cidade da Oficina',
                type: 'select',
                options: [
                  { value: 'Barra Mansa', label: 'Barra Mansa' },
                  { value: 'Volta Redonda', label: 'Volta Redonda' },
                ],
                // O Supabase Auth UI automaticamente salva este campo em user_metadata
              },
            },
          }}
        />
      </div>
    </div>
  );
};

export default LoginPage;