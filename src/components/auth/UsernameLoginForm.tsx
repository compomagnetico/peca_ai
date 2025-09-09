"use client";

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { showError, showLoading, dismissToast } from "@/utils/toast";
import { useAuth } from "@/contexts/AuthContext";

const loginSchema = z.object({
  username: z.string().min(1, "Nome de usuário é obrigatório."),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
});

export function UsernameLoginForm() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    setIsSubmitting(true);
    const toastId = showLoading("Fazendo login...");

    try {
      // 1. Find the user's email or phone based on the username
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", values.username)
        .single();

      if (profileError || !profileData) {
        throw new Error("Nome de usuário ou senha inválidos.");
      }

      // 2. Get the user's email from auth.users using the profile ID
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(profileData.id);

      if (userError || !userData?.user) {
        throw new Error("Nome de usuário ou senha inválidos.");
      }

      const userEmail = userData.user.email;
      const userPhone = userData.user.phone;

      if (!userEmail && !userPhone) {
        throw new Error("Não foi possível encontrar um método de login para este usuário.");
      }

      // 3. Sign in with email/password or phone/password
      let signInResult;
      if (userEmail) {
        signInResult = await supabase.auth.signInWithPassword({
          email: userEmail,
          password: values.password,
        });
      } else if (userPhone) {
        // Supabase signInWithPassword doesn't directly support phone,
        // it's usually signInWithOtp for phone.
        // For simplicity, we'll assume email is the primary method for password login.
        // If phone-password login is strictly required, a different flow (e.g., OTP) would be needed.
        throw new Error("Login com telefone e senha não é suportado diretamente. Use e-mail ou OTP.");
      } else {
        throw new Error("Nome de usuário ou senha inválidos.");
      }

      if (signInResult.error) {
        throw signInResult.error;
      }

      dismissToast(toastId);
      showSuccess("Login realizado com sucesso!");
      navigate("/");
    } catch (error) {
      dismissToast(toastId);
      showError(`Erro no login: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If already logged in, redirect
  if (session) {
    navigate("/");
    return null;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Entrar</CardTitle>
        <CardDescription>
          Use seu nome de usuário e senha para acessar sua conta.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome de Usuário</FormLabel>
                  <FormControl>
                    <Input placeholder="seu_usuario" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="********" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </Form>
        <div className="mt-4 text-center text-sm">
          Não tem uma conta?{" "}
          <Link to="/signup" className="underline">
            Cadastre-se
          </Link>
        </div>
        <div className="mt-2 text-center text-sm">
          <Link to="/forgot-password" className="underline">
            Esqueceu sua senha?
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}