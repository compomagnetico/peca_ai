"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Trash2, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

const formSchema = z.object({
  parts: z.array(z.object({
    name: z.string().min(1, "Nome da peça é obrigatório."),
    brand: z.string().optional(),
    partCode: z.string().optional(),
  })).min(1, "Adicione pelo menos uma peça."),
  carModel: z.string().min(1, "Modelo do carro é obrigatório."),
  carYear: z.string().min(1, "Ano do carro é obrigatório."),
  carEngine: z.string().optional(),
  notes: z.string().optional(),
});

type AutoPart = {
  id: string;
  nome: string;
  whatsapp: string;
};

const fetchAutoParts = async (): Promise<AutoPart[]> => {
  const { data, error } = await supabase
    .from("autopecas")
    .select("id, nome, whatsapp")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
};

export function BudgetRequestForm() {
  const [selectedShops, setSelectedShops] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: autoParts, isLoading } = useQuery<AutoPart[]>({
    queryKey: ["autoParts"],
    queryFn: fetchAutoParts,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      parts: [{ name: "", brand: "", partCode: "" }],
      carModel: "",
      carYear: "",
      carEngine: "",
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "parts",
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked && autoParts) {
      setSelectedShops(autoParts.map((part) => part.id));
    } else {
      setSelectedShops([]);
    }
  };

  const handleShopSelect = (shopId: string, checked: boolean) => {
    if (checked) {
      setSelectedShops((prev) => [...prev, shopId]);
    } else {
      setSelectedShops((prev) => prev.filter((id) => id !== shopId));
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (selectedShops.length === 0) {
      showError("Selecione pelo menos uma autopeça para enviar o orçamento.");
      return;
    }

    const toastId = showLoading("Registrando e enviando solicitação...");
    setIsSubmitting(true);

    try {
      const { data: requestData, error: requestError } = await supabase
        .from("budget_requests")
        .insert({
          car_model: values.carModel,
          car_year: values.carYear,
          car_engine: values.carEngine,
          parts: values.parts,
          selected_shops_ids: selectedShops,
          notes: values.notes,
        })
        .select("short_id")
        .single();

      if (requestError) throw requestError;
      const shortId = requestData.short_id;

      const selectedShopsDetails = autoParts?.filter((part) =>
        selectedShops.includes(part.id)
      );
      
      const responseUrl = `${window.location.origin}/submit-response/${shortId}`;

      const payload = {
        short_id: shortId,
        responseUrl: responseUrl,
        carDetails: {
          carModel: values.carModel,
          carYear: values.carYear,
          carEngine: values.carEngine,
        },
        selectedShops: selectedShopsDetails,
      };

      const response = await fetch("https://webhook.usoteste.shop/webhook/teste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Falha ao enviar a requisição para o webhook.");
      }

      dismissToast(toastId);
      showSuccess(`Orçamento #${shortId} solicitado com sucesso!`);
      form.reset();
      setSelectedShops([]);
    } catch (error) {
      dismissToast(toastId);
      showError(`Erro ao solicitar orçamento: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  const allSelected = autoParts ? selectedShops.length === autoParts.length : false;

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Solicitar Orçamento de Peça</CardTitle>
        <CardDescription>
          Preencha os detalhes do carro, adicione as peças e selecione para quais autopeças enviar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Detalhes do Carro</h3>
              <FormField
                control={form.control}
                name="carModel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo do Carro</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Fiat Palio" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="carYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ano do Carro</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 2014" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="carEngine"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motorização do Carro (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 1.0 Fire, 2.0 Turbo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Peças Necessárias</h3>
              {fields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-lg relative space-y-4">
                  <div className="flex justify-between items-center">
                    <FormLabel className="font-semibold">Peça {index + 1}</FormLabel>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remover Peça</span>
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name={`parts.${index}.name`}
                      render={({ field }) => (
                        <FormItem className="md:col-span-3">
                          <FormLabel className="text-xs">Nome</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Amortecedor dianteiro" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`parts.${index}.brand`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Marca (Opcional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Cofap" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`parts.${index}.partCode`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Código (Opcional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: GP30114" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => append({ name: "", brand: "", partCode: "" })}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Peça
              </Button>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Observações Gerais (Opcional)</h3>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-1">
                      <FormLabel>Observações</FormLabel>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>Adicione qualquer informação adicional relevante para o orçamento, como urgência, detalhes específicos do problema, etc.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <FormControl>
                      <Textarea
                        placeholder="Ex: Peça com urgência, carro parado na oficina. Preferência por peças originais."
                        className="resize-y min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Enviar para Autopeças</h3>
              <FormLabel>Selecione as autopeças para enviar o orçamento:</FormLabel>
              {isLoading ? (
                 <div className="space-y-2 mt-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                 </div>
              ) : (
                <ScrollArea className="h-40 w-full rounded-md border p-2 mt-2">
                  <label
                    htmlFor="select-all"
                    className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                  >
                    <Checkbox
                      id="select-all"
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                    />
                    <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Marcar/Desmarcar Todos
                    </span>
                  </label>
                  {autoParts?.map((part) => (
                    <label
                      key={part.id}
                      htmlFor={part.id}
                      className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                    >
                      <Checkbox
                        id={part.id}
                        checked={selectedShops.includes(part.id)}
                        onCheckedChange={(checked) => handleShopSelect(part.id, !!checked)}
                      />
                      <span className="text-sm font-medium leading-none">
                        {part.nome}
                      </span>
                    </label>
                  ))}
                </ScrollArea>
              )}
            </div>

            <Button type="submit" className="w-full text-lg py-6 bg-green-700 hover:bg-green-800" disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : "Realizar Orçamento"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}