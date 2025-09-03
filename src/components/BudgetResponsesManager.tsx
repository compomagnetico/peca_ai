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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo } from "react";
import { RefreshCw, MessageSquare } from "lucide-react";

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
    refetch,
    isRefetching,
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

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Respostas de Orçamentos</h1>
        <Button onClick={() => refetch()} disabled={isRefetching}>
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
          />
          {isRefetching ? "Recarregando..." : "Recarregar"}
        </Button>
      </div>

      {!responses || responses.length === 0 ? (
        <div className="text-center text-gray-500 mt-8">
          Nenhuma resposta de orçamento recebida ainda.
        </div>
      ) : (
        <Accordion type="multiple" collapsible className="w-full space-y-4">
          {Object.entries(groupedResponses).map(([carKey, carResponses]) => (
            <AccordionItem
              value={carKey}
              key={carKey}
              className="border rounded-lg"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-lg">{carKey}</span>
                  <Badge variant="secondary">
                    {carResponses.length}{" "}
                    {carResponses.length > 1 ? "respostas" : "resposta"}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-4 space-y-2 bg-muted/20">
                {carResponses.map((response) => (
                  <Card key={response.id} className="overflow-hidden">
                    <CardHeader className="p-3 pb-1 bg-muted/40">
                      <CardTitle className="text-sm font-semibold">
                        Orçamento de: {response.shop_name}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Recebido em:{" "}
                        {format(
                          new Date(response.created_at),
                          "dd/MM/yyyy 'às' HH:mm",
                          {
                            locale: ptBR,
                          }
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-3">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="h-8">Peça</TableHead>
                            <TableHead className="h-8 text-right">
                              Preço
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {response.parts_and_prices.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell className="py-1.5">{item.part}</TableCell>
                              <TableCell className="py-1.5 text-right">
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
                        <div className="mt-2">
                          <h4 className="text-xs font-medium">Observações</h4>
                          <p className="text-xs text-muted-foreground pt-0.5">
                            {response.notes}
                          </p>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex justify-between items-center bg-muted/40 p-2">
                      <div className="font-semibold text-sm">
                        Total:{" "}
                        {response.total_price.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <a
                          href={`https://wa.me/${response.shop_whatsapp.replace(
                            /\D/g,
                            ""
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Contatar
                        </a>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}