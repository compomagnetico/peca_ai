"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo, useState } from "react";
import { RefreshCw, MessageSquare, Trash2 } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";

type BudgetRequest = {
  id: string;
  created_at: string;
  car_model: string;
  car_year: string;
  car_engine?: string;
  status: "pending" | "answered" | "completed";
  selected_shops_ids: string[];
  short_id: number;
  parts: { name: string; brand?: string; partCode?: string }[];
  notes?: string; // Adicionado campo de observações
};

type AutoPeca = {
  id: string;
  nome: string;
};

type BudgetResponse = {
  id: string;
  created_at: string;
  shop_name: string;
  shop_whatsapp: string;
  parts_and_prices: { part: string; price: number }[];
  total_price: number;
  notes?: string;
  request_id: string;
  shop_id: string;
};

type FetchedData = {
  requests: BudgetRequest[];
  responses: BudgetResponse[];
  shops: AutoPeca[];
};

const fetchData = async (): Promise<FetchedData> => {
  const [requestsRes, responsesRes, shopsRes] = await Promise.all([
    supabase
      .from("budget_requests")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("budget_responses").select("*"),
    supabase.from("autopecas").select("id, nome"),
  ]);

  if (requestsRes.error) throw requestsRes.error;
  if (responsesRes.error) throw responsesRes.error;
  if (shopsRes.error) throw shopsRes.error;

  return {
    requests: requestsRes.data as BudgetRequest[],
    responses: responsesRes.data as BudgetResponse[],
    shops: shopsRes.data as AutoPeca[],
  };
};

const deleteBudgetRequest = async (requestId: string) => {
  const { error } = await supabase
    .from("budget_requests")
    .delete()
    .eq("id", requestId);
  if (error) throw new Error(error.message);
};

export function BudgetResponsesManager() {
  const queryClient = useQueryClient();
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    id: string | null;
    message: string;
  }>({ isOpen: false, id: null, message: "" });

  const {
    data,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery<FetchedData>({
    queryKey: ["budgetRequestsAndResponses"],
    queryFn: fetchData,
  });

  const deleteRequestMutation = useMutation({
    mutationFn: deleteBudgetRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgetRequestsAndResponses"] });
      showSuccess(
        "Solicitação e suas respostas foram removidas com sucesso!"
      );
      setDialogState({ isOpen: false, id: null, message: "" });
    },
    onError: (error) => {
      showError(`Erro ao remover: ${error.message}`);
    },
  });

  const handleDeleteClick = (id: string) => {
    setDialogState({
      isOpen: true,
      id,
      message:
        "Tem certeza que deseja apagar esta solicitação e todas as suas respostas? Esta ação não pode ser desfeita.",
    });
  };

  const handleConfirmDelete = () => {
    if (!dialogState.id) return;
    deleteRequestMutation.mutate(dialogState.id);
  };

  const shopsMap = useMemo(() => {
    if (!data?.shops) return new Map<string, string>();
    return new Map(data.shops.map((shop) => [shop.id, shop.nome]));
  }, [data?.shops]);

  const responsesByRequestId = useMemo(() => {
    if (!data?.responses) return new Map<string, BudgetResponse[]>();
    return data.responses.reduce((acc, response) => {
      if (!acc.has(response.request_id)) {
        acc.set(response.request_id, []);
      }
      acc.get(response.request_id)!.push(response);
      return acc;
    }, new Map<string, BudgetResponse[]>());
  }, [data?.responses]);

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
        Erro ao carregar os orçamentos: {error.message}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Acompanhamento de Orçamentos</h1>
        <Button onClick={() => refetch()} disabled={isRefetching}>
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
          />
          {isRefetching ? "Recarregando..." : "Recarregar"}
        </Button>
      </div>

      {!data?.requests || data.requests.length === 0 ? (
        <div className="text-center text-gray-500 mt-8">
          Nenhuma solicitação de orçamento encontrada.
        </div>
      ) : (
        <Accordion type="multiple" collapsible className="w-full space-y-4">
          {data.requests.map((request) => {
            const responsesForThisRequest =
              responsesByRequestId.get(request.id) || [];
            const statusBadge = {
              pending: <Badge variant="outline">Pendente</Badge>,
              answered: <Badge variant="default" className="bg-blue-500">Respondido Parcialmente</Badge>,
              completed: <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">Finalizado</Badge>,
            };

            return (
              <AccordionItem
                value={request.id}
                key={request.id}
                className="border rounded-lg"
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-lg">
                        {`#${request.short_id} - ${request.car_model} ${request.car_year}`}
                        {request.car_engine && ` (${request.car_engine})`}
                      </span>
                      {statusBadge[request.status]}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(request.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 space-y-4 bg-muted/20">
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Peças Solicitadas:</h4>
                    <div className="space-y-2">
                      {(request.parts || []).map((part, index) => (
                        <div key={index} className="text-sm p-2 bg-background rounded-md border">
                          <p className="font-medium">{part.name}</p>
                          {(part.brand || part.partCode) && (
                            <p className="text-xs text-muted-foreground">
                              {part.brand && `Marca: ${part.brand}`}
                              {part.brand && part.partCode && " | "}
                              {part.partCode && `Código: ${part.partCode}`}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  {request.notes && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold mb-2">Observações da Solicitação:</h4>
                      <p className="text-sm p-2 bg-background rounded-md border text-muted-foreground">
                        {request.notes}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2 mt-4">
                    <h4 className="text-sm font-semibold">Respostas das Autopeças:</h4>
                    <Accordion type="multiple" className="w-full">
                      {(request.selected_shops_ids || []).map((shopId) => {
                        const shopName =
                          shopsMap.get(shopId) || "Autopeça Desconhecida";
                        const response = responsesForThisRequest.find(
                          (r) => r.shop_id === shopId
                        );

                        if (response) {
                          return (
                            <AccordionItem value={response.id} key={response.id} className="border rounded-lg mb-2">
                              <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/40">
                                <div className="flex items-center justify-between w-full">
                                  <span className="font-semibold text-sm">{response.shop_name}</span>
                                  <Badge className="bg-green-500 text-white">Respondido</Badge>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="p-3 bg-background">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="h-8">Peça</TableHead>
                                      <TableHead className="h-8 text-right">Preço</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {response.parts_and_prices.map((item, index) => (
                                      <TableRow key={index}>
                                        <TableCell className="py-1.5 text-sm">{item.part}</TableCell>
                                        <TableCell className="py-1.5 text-sm text-right">
                                          {item.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                                {response.notes && (
                                  <div className="mt-2">
                                    <h4 className="text-xs font-medium">Observações da Resposta</h4>
                                    <p className="text-xs text-muted-foreground pt-0.5">{response.notes}</p>
                                  </div>
                                )}
                                <CardFooter className="flex justify-between items-center bg-muted/40 p-2.5 mt-3 -mx-3 -mb-3 rounded-b-lg">
                                  <div className="font-semibold text-sm">
                                    Total: {response.total_price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                  </div>
                                  <Button asChild size="sm" variant="outline" className="h-8">
                                    <a href={`https://wa.me/${response.shop_whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-xs">
                                      <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                                      Contatar
                                    </a>
                                  </Button>
                                </CardFooter>
                              </AccordionContent>
                            </AccordionItem>
                          );
                        } else {
                          return (
                            <Card key={shopId} className="bg-white mb-2">
                              <CardHeader className="p-3 flex flex-row items-center justify-between">
                                <CardTitle className="text-sm font-semibold">{shopName}</CardTitle>
                                <Badge variant="outline">Pendente</Badge>
                              </CardHeader>
                            </Card>
                          );
                        }
                      })}
                    </Accordion>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
      <AlertDialog
        open={dialogState.isOpen}
        onOpenChange={(isOpen) => setDialogState((prev) => ({ ...prev, isOpen }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>{dialogState.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDialogState({ isOpen: false, id: null, message: "" })}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteRequestMutation.isPending}
            >
              {deleteRequestMutation.isPending ? "Apagando..." : "Apagar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}