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
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type BudgetResponse = {
  id: string;
  created_at: string;
  shop_name: string;
  shop_whatsapp: string;
  car_model: string;
  car_year: string;
  parts_and_prices: { part: string; price: number }[];
  total_price: number;
  notes?: string;
};

const fetchBudgetResponses = async (): Promise<BudgetResponse[]> => {
  const { data, error } = await supabase
    .from("budget_responses")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
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
      <div className="text-center text-gray-500">
        Nenhuma resposta de orçamento recebida ainda.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {responses.map((response) => (
        <Card key={response.id}>
          <CardHeader>
            <CardTitle>
              Orçamento de: {response.shop_name}
            </CardTitle>
            <CardDescription>
              Recebido em:{" "}
              {format(new Date(response.created_at), "dd/MM/yyyy 'às' HH:mm", {
                locale: ptBR,
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <h4 className="font-semibold">Veículo</h4>
              <p>{response.car_model} - {response.car_year}</p>
            </div>
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
    </div>
  );
}