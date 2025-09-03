"use client";

import { useQuery } from "@tanstack/react-query";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo } from "react";

type BudgetResponse = {
  id: string;
  created_at: string;
  shop_name: string;
  shop_whatsapp: string;
  parts_and_prices: { part: string; price: number }[];
  total_price: number;
  notes?: string;
  budget_requests: {
    car_model: string;
    car_year: string;
  } | null;
};

const fetchBudgetResponses = async (): Promise<BudgetResponse[]> => {
  const { data, error } = await supabase
    .from("budget_responses")
    .select(`
      *,
      budget_requests (
        car_model,
        car_year
      )
    `)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as BudgetResponse[];
};

export function BudgetResponsesManager() {
  const {
    data: responses,
    isLoading,
    error,
  } = useQuery<BudgetResponse[]>({
    queryKey: ["budgetResponses"],
    queryFn: fetchBudgetResponses,
  });

  const groupedResponses = useMemo(() => {
    if (!responses) return {};
    return responses.reduce((acc, response) => {
      const carModel = response.budget_requests?.car_model ?? "Desconhecido";
      const carYear = response.budget_requests?.car_year ?? "";
      const key = `${carModel} - ${carYear}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(response);
      return acc;
    }, {} as Record<string, BudgetResponse[]>);
  }, [responses]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500">
        Erro ao carregar as respostas: {error.message}
      </div>
    );
  }

  if (!responses || responses.length === 0) {
    return (
      <div className="text-center text-gray-500 mt-8">
        Nenhuma resposta de orçamento recebida ainda.
      </div>
    );
  }

  return (
    <Accordion type="multiple" collapsible className="w-full space-y-4">
      {Object.entries(groupedResponses).map(([carKey, carResponses]) => (
        <AccordionItem value={carKey} key={carKey} className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-4">
              <span className="font-semibold text-lg">{carKey}</span>
              <Badge variant="secondary">{carResponses.length} {carResponses.length > 1 ? 'respostas' : 'resposta'}</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-4 space-y-4 bg-muted/20">
            {carResponses.map((response) => (
              <Card key={response.id}>
                <CardHeader>
                  <CardTitle>Orçamento de: {response.shop_name}</CardTitle>
                  <CardDescription>
                    Recebido em:{" "}
                    {format(new Date(response.created_at), "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <h4 className="font-semibold mb-2">Peças e Preços</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Peça</TableHead>
                        <TableHead className="text-right">Preço</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {response.parts_and_prices.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.part}</TableCell>
                          <TableCell className="text-right">
                            {item.price.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {response.notes && (
                    <div className="mt-4">
                      <h4 className="font-semibold">Observações</h4>
                      <p className="text-sm text-muted-foreground">{response.notes}</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between items-center bg-muted/40 p-4">
                  <div className="font-bold text-lg">
                    Total:{" "}
                    {response.total_price.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </div>
                  <a
                    href={`https://wa.me/${response.shop_whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-green-600 hover:underline"
                  >
                    Contatar via WhatsApp
                  </a>
                </CardFooter>
              </Card>
            ))}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}