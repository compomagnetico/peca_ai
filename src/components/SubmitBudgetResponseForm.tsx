"use client";

import { useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import { Car } from "lucide-react";

const responseFormSchema = z.object({
  shop_whatsapp: z.string().min(10, "Por favor, insira um WhatsApp válido."),
  parts_and_prices: z.array(z.object({
    part: z.string(),
    price: z.coerce.number().min(0, "O preço não pode ser negativo."),
  })),
  notes: z.string().optional(),
});

type BudgetRequest = {
  id: string;
  short_id: number;
  car_model: string;
  car_year: string;
  car_engine?: string;
  parts: { name: string; brand?: string; partCode?: string }[];
  notes?: string;
};

const fetchBudgetRequest = async (shortId: string): Promise<BudgetRequest> => {
  const { data, error } = await supabase
    .from("budget_requests")
    .select("short_id, car_model, car_year, car_engine, parts, notes")
    .eq("short_id", shortId)
    .single();
  if (error) throw new Error("Solicitação de orçamento não encontrada ou inválida.");
  return data;
};

export function SubmitBudgetResponseForm() {
  const { shortId } = useParams<{ shortId: string }>();
  const navigate = useNavigate();

  const { data: request, isLoading } = useQuery<BudgetRequest>({
    queryKey: ["budgetRequestForResponse", shortId],
    queryFn: () => fetchBudgetRequest(shortId!),
    enabled: !!shortId,
    retry: false,
  });

  const form = useForm<z.infer<typeof responseFormSchema>>({
    resolver: zodResolver(responseFormSchema),
    defaultValues: {
      shop_whatsapp: "",
      parts_and_prices: [],
      notes: "",
    },
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "parts_and_prices",
  });

  useEffect(() => {
    if (request) {
      const partsForForm = request.parts.map(p => ({
        part: p.name,
        price: 0,
      }));
      replace(partsForForm);
    }
  }, [request, replace]);

  const watchedParts = useWatch({
    control: form.control,
    name: "parts_and_prices",
  });

  const totalPrice = useMemo(() => {
    return watchedParts.reduce((total, part) => total + (part.price || 0), 0);
  }, [watchedParts]);

  async function onSubmit(values: z.infer<typeof responseFormSchema>) {
    const toastId = showLoading("Enviando orçamento...");
    try {
      const payload = {
        ...values,
        short_id: parseInt(shortId!, 10),
        total_price: totalPrice,
      };

      const response = await fetch("https://gjztnnhsfkbqxkwkbxof.supabase.co/functions/v1/submit-budget-response", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Falha ao enviar o orçamento.");
      }

      dismissToast(toastId);
      showSuccess("Orçamento enviado com sucesso! Obrigado.");
      form.reset();
      // Redirect to a thank you page or disable the form
      setTimeout(() => navigate("/"), 2000);

    } catch (error) {
      dismissToast(toastId);
      showError(`Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    }
  }

  if (isLoading) {
    return <Skeleton className="w-full max-w-2xl h-[600px]" />;
  }

  if (!request) {
    return (
      <Card className="w-full max-w-2xl text-center">
        <CardHeader>
          <CardTitle>Erro</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Solicitação de orçamento não encontrada. Verifique o link e tente novamente.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
        <div className="flex items-center gap-2 justify-center mb-6">
            <Car className="h-8 w-8 text-primary" />
            <span className="font-bold text-2xl bg-gradient-to-r from-blue-600 to-green-500 bg-clip-text text-transparent">
              Peça AI
            </span>
        </div>
        <Card>
        <CardHeader>
            <CardTitle>Responder Orçamento #{request.short_id}</CardTitle>
            <CardDescription>
            Preencha os valores para as peças solicitadas para o veículo: 
            <span className="font-semibold"> {request.car_model} {request.car_year} {request.car_engine && `(${request.car_engine})`}</span>.
            </CardDescription>
        </CardHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-8">
                <FormField
                    control={form.control}
                    name="shop_whatsapp"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Seu WhatsApp (para identificação)</FormLabel>
                        <FormControl>
                        <Input placeholder="(XX) XXXXX-XXXX" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />

                <div className="space-y-4">
                <h3 className="text-md font-semibold">Preços das Peças</h3>
                <div className="space-y-2">
                    {fields.map((field, index) => (
                    <FormField
                        key={field.id}
                        control={form.control}
                        name={`parts_and_prices.${index}.price`}
                        render={({ field: priceField }) => (
                        <FormItem className="flex items-center gap-4 p-3 border rounded-lg">
                            <FormLabel className="flex-1 min-w-0 break-words">{field.part}</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                                    <Input type="number" step="0.01" className="pl-8 w-32" {...priceField} />
                                </div>
                            </FormControl>
                        </FormItem>
                        )}
                    />
                    ))}
                </div>
                </div>

                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Observações (Opcional)</FormLabel>
                        <FormControl>
                        <Textarea
                            placeholder="Ex: Peças originais, prazo de entrega, etc."
                            className="resize-y min-h-[80px]"
                            {...field}
                        />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </CardContent>
            <CardFooter className="flex justify-between items-center border-t pt-4">
                <div className="text-xl font-bold">
                    Total: {totalPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </div>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Enviando..." : "Enviar Orçamento"}
                </Button>
            </CardFooter>
            </form>
        </Form>
        </Card>
    </div>
  );
}