"use client";

import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Trash2, MinusCircle, PlusCircle } from "lucide-react";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import { Skeleton } from "@/components/ui/skeleton";

const orderFormSchema = z.object({
  shopName: z.string(),
  shopWhatsapp: z.string(),
  parts: z.array(
    z.object({
      part: z.string(),
      price: z.number(),
      quantity: z.number().min(1, "Quantidade deve ser no mínimo 1."),
      selected: z.boolean(),
    })
  ).min(1, "Selecione pelo menos uma peça para o pedido."),
  notes: z.string().optional(),
});

type OrderFormValues = z.infer<typeof orderFormSchema>;

export function CreateOrderForm() {
  const { requestId, responseId } = useParams<{ requestId: string; responseId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { orderDetails } = location.state as { orderDetails: any }; // Dados passados via state

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      shopName: orderDetails?.shopName || "",
      shopWhatsapp: orderDetails?.shopWhatsapp || "",
      parts: orderDetails?.partsAndPrices?.map((p: { part: string; price: number }) => ({
        part: p.part,
        price: p.price,
        quantity: 1, // Default quantity
        selected: true, // Default to selected
      })) || [],
      notes: orderDetails?.responseNotes || "",
    },
  });

  const { fields, remove, update } = useFieldArray({
    control: form.control,
    name: "parts",
  });

  useEffect(() => {
    if (!orderDetails || !requestId || !responseId) {
      showError("Dados do orçamento não encontrados. Retornando...");
      navigate("/budget-responses");
      return;
    }
    setIsLoading(false);
  }, [orderDetails, requestId, responseId, navigate]);

  const calculateTotalPrice = () => {
    return fields.reduce((sum, part) => {
      if (part.selected) {
        return sum + part.price * part.quantity;
      }
      return sum;
    }, 0);
  };

  const onSubmit = async (values: OrderFormValues) => {
    const selectedParts = values.parts.filter(p => p.selected);
    if (selectedParts.length === 0) {
      showError("Selecione pelo menos uma peça para realizar o pedido.");
      return;
    }

    setIsSubmitting(true);
    const toastId = showLoading("Realizando pedido...");

    try {
      // Aqui você enviaria os dados do pedido para a autopeça ou para um novo endpoint no Supabase
      // Por enquanto, vamos apenas logar e mostrar um sucesso.
      console.log("Pedido a ser realizado:", {
        requestId,
        responseId,
        shopName: values.shopName,
        shopWhatsapp: values.shopWhatsapp,
        parts: selectedParts,
        totalPrice: calculateTotalPrice(),
        notes: values.notes,
      });

      // Exemplo de como você poderia enviar para um webhook ou função Edge
      // const webhookResponse = await fetch("https://your-webhook-url.com/submit-order", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     requestId,
      //     responseId,
      //     shopWhatsapp: values.shopWhatsapp,
      //     parts: selectedParts,
      //     totalPrice: calculateTotalPrice(),
      //     notes: values.notes,
      //   }),
      // });
      // if (!webhookResponse.ok) {
      //   throw new Error("Falha ao enviar o pedido para a autopeça.");
      // }

      dismissToast(toastId);
      showSuccess("Pedido realizado com sucesso! A autopeça será notificada.");
      navigate("/budget-responses"); // Voltar para a lista de orçamentos
    } catch (error) {
      dismissToast(toastId);
      showError(`Erro ao realizar pedido: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Realizar Pedido para {form.getValues("shopName")}</CardTitle>
        <CardDescription>
          Confira as peças orçadas, ajuste as quantidades e finalize seu pedido.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Peças do Orçamento</h3>
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center space-x-4 py-3 border-b last:border-b-0">
                  <FormField
                    control={form.control}
                    name={`parts.${index}.selected`}
                    render={({ field: checkboxField }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={checkboxField.value}
                            onCheckedChange={(checked) => {
                              checkboxField.onChange(checked);
                              // Se desmarcar, a quantidade pode ser 0 ou desabilitada
                              if (!checked) {
                                update(index, { ...field, quantity: 0, selected: false });
                              } else {
                                update(index, { ...field, quantity: field.quantity || 1, selected: true });
                              }
                            }}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal sr-only">Incluir</FormLabel>
                      </FormItem>
                    )}
                  />
                  <div className="flex-1 grid grid-cols-2 gap-2 items-center">
                    <div className="col-span-2 sm:col-span-1">
                      <p className="font-medium text-sm">{field.part}</p>
                      <p className="text-xs text-muted-foreground">
                        {field.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} / un.
                      </p>
                    </div>
                    <div className="flex items-center justify-end sm:justify-start col-span-2 sm:col-span-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => update(index, { ...field, quantity: Math.max(0, field.quantity - 1) })}
                        disabled={!field.selected || field.quantity <= 0}
                      >
                        <MinusCircle className="h-4 w-4" />
                      </Button>
                      <FormField
                        control={form.control}
                        name={`parts.${index}.quantity`}
                        render={({ field: quantityField }) => (
                          <FormItem className="w-16 mx-2">
                            <FormControl>
                              <Input
                                type="number"
                                className="text-center"
                                {...quantityField}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value, 10);
                                  quantityField.onChange(isNaN(value) ? 0 : value);
                                  if (value > 0 && !field.selected) {
                                    update(index, { ...field, selected: true });
                                  } else if (value === 0 && field.selected) {
                                    update(index, { ...field, selected: false });
                                  }
                                }}
                                disabled={!field.selected}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => update(index, { ...field, quantity: field.quantity + 1, selected: true })}
                        disabled={!field.selected && field.quantity === 0}
                      >
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Remover Peça</span>
                  </Button>
                </div>
              ))}
            </div>

            <Separator />

            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total do Pedido:</span>
              <span>
                {calculateTotalPrice().toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações para a Autopeça (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: Entregar até amanhã, pagamento à vista."
                      className="resize-y min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full text-lg py-6 bg-green-700 hover:bg-green-800" disabled={isSubmitting}>
              {isSubmitting ? "Confirmando Pedido..." : "Confirmar Pedido"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}