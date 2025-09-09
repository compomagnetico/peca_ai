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
import { showError, showLoading, dismissToast, showSuccess } from "@/utils/toast";
import { Car } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const signUpSchema = z.object({
  username: z.string().min(3, "Nome de usuário deve ter pelo menos 3 caracteres.").max(20, "Nome de usuário não pode exceder 20 caracteres.").regex(/^[a-zA-Z0-9_]+$/, "Nome de usuário pode conter apenas letras, números e sublinhados.").toLowerCase(),
  email: z.string().email("E-mail inválido.").optional().or(z.literal('')),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Número de telefone inválido (ex: +5511988887777).").optional().or(z.literal('')),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
  city: z.enum(["Barra Mansa", "Volta Redonda"], {
    required_error: "Selecione a cidade da oficina.",
  }),
}).refine(data => data.email || data.phone, {
  message: "Pelo menos um e-mail ou número de telefone é obrigatório.",
  path: ["email"], // Can point to either, or a custom path
});

export default function SignUpPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      username: "",
      email: "",
      phone: "",
      password: "",
      city: undefined,
    },
  });

  const onSubmit = async (values: z.infer<typeof signUpSchema>) => {
    setIsSubmitting(true);
    const toastId = showLoading("Cadastrando...");

    try {
      // Check if username already exists
      const { data: existingProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", values.username)
        .single();

      if (existingProfile) {
        throw new Error("Nome de usuário já está em uso.");
      }
      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means no rows found, which is fine
        throw profileError;
      }

      let signUpResult;
      if (values.email) {
        signUpResult = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            data: {
              username: values.username,
              city: values.city,
            },
          },
        });
      } else if (values.phone) {
        signUpResult = await supabase.auth.signUp({
          phone: values.phone,
          password: values.password,
          options: {
            data: {
              username: values.username,
              city: values.city,
            },
          },
        });
      } else {
        throw new Error("E-mail ou telefone é obrigatório.");
      }

      if (signUpResult.error) {
        throw signUpResult.error;
      }

      dismissToast(toastId);
      showSuccess("Cadastro realizado com sucesso! Verifique seu e-mail/telefone para confirmar sua conta.");
      navigate("/login");
    } catch (error) {
      dismissToast(toastId);
      showError(`Erro no cadastro: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6">
        <div className="flex items-center gap-2 justify-center">
            <Car className="h-8 w-8 text-primary" />
            <span className="font-bold text-2xl bg-gradient-to-r from-blue-600 to-green-500 bg-clip-text text-transparent">
              Peça AI
            </span>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Cadastre-se</CardTitle>
            <CardDescription>Crie sua conta para começar a usar o Peça AI.</CardDescription>
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail (Opcional)</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="seu@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone (Opcional)</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="Ex: +5511988887777" {...field} />
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
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade da Oficina</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione sua cidade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Barra Mansa">Barra Mansa</SelectItem>
                          <SelectItem value="Volta Redonda">Volta Redonda</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Cadastrando..." : "Cadastrar"}
                </Button>
              </form>
            </Form>
            <div className="mt-4 text-center text-sm">
              Já tem uma conta?{" "}
              <Link to="/login" className="underline">
                Entrar
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}