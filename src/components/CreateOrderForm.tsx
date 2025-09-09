"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const orderFormSchema = z.object({
  parts: z.array(z.object({
    selected: z.boolean().default(false),
    part: z.string(),
    price: z.number(),
    quantity: z.coerce.number().min(0, "A quantidade não pode ser negativa.").optional(), // Alterado para permitir 0
  })).min(1, "Selecione pelo menos uma peça."),
  paymentMethod: z.enum(["pix", "card", "cash"], {
    required_error: "Selecione uma forma de pagamento.",
  }),
  changeFor: z.string().optional(),
  observations: z.string().optional(),
}).refine(data => data.parts.some(p => p.selected), {
  message: "Você deve selecionar pelo menos uma peça para o pedido.",
  path: ["parts"],
}).superRefine((data, ctx) => {
    data.parts.forEach((part, index) => {
        if (part.selected && (!part.quantity || part.quantity < 1)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "A quantidade deve ser pelo menos 1 se a peça estiver selecionada.", // Mensagem ajustada
                path: [`parts`, index, `quantity`],
            });
        }
    });
});

type BudgetResponse = {
  id: string;
  created_at: string;
  shop_name: string;
  shop_whatsapp: string;
  parts_and_prices: { part: string; price: number }[];
  total_price: number;
  request_id: string;
  shop_id: string;
};

const fetchBudgetResponse = async (responseId: string): Promise<BudgetResponse> => {
  const { data, error } = await supabase
    .from("budget_responses")
    .select("*")
    .eq("id", responseId)
    .single();
  if (error) throw new Error(error.message);
  return data;
};

const createOrder = async (orderData: any) => {
    const { data, error } = await supabase.from("orders").insert(orderData).select().single();
    if (error) throw new Error(error.message);
    return data;
}

export function CreateOrderForm() {
  const { responseId } = useParams<{ responseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: budgetResponse, isLoading } = useQuery<BudgetResponse>({
    queryKey: ["budgetResponse", responseId],
    queryFn: () => fetchBudgetResponse(responseId!),
    enabled: !!responseId,
  });

  const form = useForm<z.infer<typeof orderFormSchema>>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      parts: [],
      observations: "",
    },
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "parts",
  });

  useEffect(() => {
    if (budgetResponse) {
      const partsForForm = budgetResponse.parts_and_prices.map(p => ({
        ...p,
        selected: true,
        quantity: 0, // Alterado para 0 como padrão
      }));
      replace(partsForForm);
    }
  }, [budgetResponse, replace]);

  const watchedParts = useWatch({
    control: form.control,
    name: "parts",
  });

  const paymentMethod = useWatch({
    control: form.control,
    name: "paymentMethod",
  });

  const totalPrice = useMemo(() => {
    return watchedParts.reduce((total, part) => {
      if (part.selected) {
        const quantity = Number(part.quantity);
        if (!isNaN(quantity) && quantity > 0) { // Apenas soma se a quantidade for maior que 0
          return total + part.price * quantity;
        }
      }
      return total;
    }, 0);
  }, [watchedParts]);

  const orderMutation = useMutation({
    mutationFn: createOrder,
  });

  async function onSubmit(values: z.infer<typeof orderFormSchema>) {
    if (!budgetResponse || !user) {
      showError("Dados do orçamento ou do usuário não encontrados. Tente novamente.");
      return;
    }

    const toastId = showLoading("Finalizando pedido...");
    setIsSubmitting(true);

    const orderedParts = values.parts
      .filter((p) => p.selected && (p.quantity && p.quantity > 0)) // Filtra apenas peças selecionadas com quantidade > 0
      .map(({ part, price, quantity }) => ({ part, price, quantity }));

    if (orderedParts.length === 0) {
      dismissToast(toastId);
      showError("Selecione pelo menos uma peça com quantidade maior que zero para o pedido.");
      setIsSubmitting(false);
      return;
    }

    const orderData = {
      user_id: user.id,
      budget_response_id: responseId,
      ordered_parts: orderedParts,
      total_price: totalPrice,
      payment_method: values.paymentMethod,
      change_for:
        values.paymentMethod === "cash" && values.changeFor
          ? parseFloat(values.changeFor)
          : null,
      observations: values.observations,
    };

    try {
      // 1. Create order in the database
      const newOrder = await orderMutation.mutateAsync(orderData);

      // 2. Prepare webhook payload
      const webhookPayload = {
        order: {
          id: newOrder.id,
          created_at: newOrder.created_at,
          total_price: newOrder.total_price,
          payment_method: newOrder.payment_method,
          change_for: newOrder.change_for,
          observations: newOrder.observations,
        },
        shop: {
          name: budgetResponse.shop_name,
          whatsapp: budgetResponse.shop_whatsapp,
        },
        parts: newOrder.ordered_parts,
        budget_response_id: responseId,
      };

      // 3. Send data to webhook
      const webhookResponse = await fetch(
        "https://webhook.usoteste.shop/webhook/pedido",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(webhookPayload),
        }
      );

      if (!webhookResponse.ok) {
        // If webhook fails, the order is still created. Show success for order, but error for notification.
        dismissToast(toastId);
        showSuccess("Pedido realizado com sucesso!");
        showError(
          "Houve um problema ao notificar o fornecedor. Por favor, entre em contato diretamente."
        );
        navigate("/budget-responses");
        return;
      }

      // 4. Everything was successful
      dismissToast(toastId);
      showSuccess("Pedido realizado e fornecedor notificado com sucesso!");
      navigate("/budget-responses");
    } catch (error) {
      dismissToast(toastId);
      showError(
        `Erro ao processar pedido: ${
          error instanceof Error ? error.message : "Erro desconhecido"
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <Skeleton className="w-full max-w-2xl h-96" />;
  }

  if (!budgetResponse) {
    return <div className="text-center">Resposta de orçamento não encontrada.</div>;
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
                <CardTitle>Realizar Pedido</CardTitle>
                <CardDescription>
                Pedido para {budgetResponse.shop_name}
                </CardDescription>
            </div>
        </div>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Peças do Orçamento</h3>
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-4 p-3 border rounded-lg">
                    <FormField
                      control={form.control}
                      name={`parts.${index}.selected`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <div className="flex-1 grid grid-cols-3 gap-4 items-center">
                        <span className="font-medium">{field.part}</span>
                        <span>{field.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                        <FormField
                            control={form.control}
                            name={`parts.${index}.quantity`}
                            render={({ field }) => (
                                <FormItem>
                                <FormControl>
                                    <Input
                                      type="number"
                                      min="0" // Alterado para min="0"
                                      placeholder="Qtd."
                                      {...field}
                                      value={field.value ?? ""}
                                      onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.value)}
                                    />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                  </div>
                ))}
              </div>
              {form.formState.errors.parts && <FormMessage>{form.formState.errors.parts.message}</FormMessage>}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Forma de Pagamento</h3>
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="pix" />
                          </FormControl>
                          <FormLabel className="font-normal">PIX</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="card" />
                          </FormControl>
                          <FormLabel className="font-normal">Cartão</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="cash" />
                          </FormControl>
                          <FormLabel className="font-normal">Dinheiro</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {paymentMethod === "cash" && (
                <FormField
                  control={form.control}
                  name="changeFor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Troco para (Opcional)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Ex: 100.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Observações (Opcional)</h3>
              <FormField
                control={form.control}
                name="observations"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Adicione qualquer observação sobre o pedido."
                        className="resize-y min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between items-center border-t pt-4">
            <div className="text-xl font-bold">
                Total: {totalPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
            <Button type="submit" disabled={isSubmitting || orderMutation.isPending}>
              {isSubmitting || orderMutation.isPending ? "Finalizando Pedido..." : "Finalizar Pedido"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}