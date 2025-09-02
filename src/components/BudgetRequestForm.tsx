"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { PlusCircle, Trash2 } from "lucide-react";

const formSchema = z.object({
  parts: z.array(z.object({
    name: z.string().min(1, "Nome da peça é obrigatório."),
  })).min(1, "Adicione pelo menos uma peça."),
  carModel: z.string().min(1, "Modelo do carro é obrigatório."),
  carYear: z.string().min(1, "Ano do carro é obrigatório."),
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
      parts: [{ name: "" }],
      carModel: "",
      carYear: "",
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

    const toastId = showLoading("Enviando orçamento...");
    setIsSubmitting(true);

    const selectedShopsDetails = autoParts?.filter((part) =>
      selectedShops.includes(part.id)
    );

    const payload = {
      partDetails: {
        parts: values.parts.map(p => p.name),
        carModel: values.carModel,
        carYear: values.carYear,
      },
      selectedShops: selectedShopsDetails,
    };

    try {
      const response = await fetch("https://webhook.usoteste.shop/webhook/teste", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Falha ao enviar a requisição para o webhook.");
      }

      dismissToast(toastId);
      showSuccess("Orçamento solicitado com sucesso!");
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
            </div>

            <div className="space-y-4">
              <FormLabel>Peças Necessárias</FormLabel>
              {fields.map((field, index) => (
                <FormField
                  key={field.id}
                  control={form.control}
                  name={`parts.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <Input placeholder={`Peça ${index + 1}`} {...field} />
                        </FormControl>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => append({ name: "" })}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Peça
              </Button>
            </div>

            <div>
              <FormLabel>Enviar para Autopeças</FormLabel>
              {isLoading ? (
                 <div className="space-y-2 mt-2">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                 </div>
              ) : (
                <ScrollArea className="h-40 w-full rounded-md border p-4 mt-2">
                  <div className="flex items-center space-x-2 mb-4">
                    <Checkbox
                      id="select-all"
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                    />
                    <label
                      htmlFor="select-all"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Marcar/Desmarcar Todos
                    </label>
                  </div>
                  {autoParts?.map((part) => (
                    <div key={part.id} className="flex items-center space-x-2 mb-2">
                      <Checkbox
                        id={part.id}
                        checked={selectedShops.includes(part.id)}
                        onCheckedChange={(checked) => handleShopSelect(part.id, !!checked)}
                      />
                      <label
                        htmlFor={part.id}
                        className="text-sm font-medium leading-none"
                      >
                        {part.nome}
                      </label>
                    </div>
                  ))}
                </ScrollArea>
              )}
            </div>

            <Button type="submit" className="w-full text-lg py-6" disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : "Realizar Orçamento"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}