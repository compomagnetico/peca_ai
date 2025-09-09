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

const forgotPasswordSchema = z.object({
  email: z.string().email("E-mail inválido."),
});

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof forgotPasswordSchema>) => {
    setIsSubmitting(true);
    const toastId = showLoading("Enviando instruções...");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/update-password`, // Redirect to a page where user can set new password
      });

      if (error) {
        throw error;
      }

      dismissToast(toastId);
      showSuccess("Instruções de recuperação de senha enviadas para seu e-mail!");
      form.reset();
    } catch (error) {
      dismissToast(toastId);
      showError(`Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <div className="w-full max-w-md p-8 space-y-6">
        <div className="flex items-center gap-3 justify-center">
          <div className="bg-primary text-primary-foreground p-2 rounded-lg">
            <Car className="h-8 w-8" />
          </div>
          <span className="font-bold text-2xl">
            Peça <span className="text-primary">AI</span>
          </span>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Esqueceu sua Senha?</CardTitle>
            <CardDescription>
              Insira seu e-mail para receber instruções de recuperação de senha.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="seu@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Enviando..." : "Enviar Instruções"}
                </Button>
              </form>
            </Form>
            <div className="mt-4 text-center text-sm">
              <Link to="/login" className="underline">
                Voltar para o Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}