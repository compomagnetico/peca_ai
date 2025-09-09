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
import { useMemo, useState } from "react";
import { RefreshCw, ShoppingBag, Trash2 } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

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
  notes?: string;
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

const fetchData = async (userId: string): Promise<FetchedData> => {
  const { data: requests, error: requestsError } = await supabase
    .from("budget_requests")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (requestsError) throw requestsError;

  const requestIds = requests.map(r => r.id);

  const [responsesRes, shopsRes] = await Promise.all([
    supabase.from("budget_responses").select("*").in("request_id", requestIds),
    supabase.from("autopecas").select("id, nome").eq("user_id", userId),
  ]);

  if (responsesRes.error) throw responsesRes.error;
  if (shopsRes.error) throw shopsRes.error;

  return {
    requests: requests as BudgetRequest[],
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
  const { user } = useAuth();
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
    queryKey: ["budgetRequestsAndResponses", user?.id],
    queryFn: () => fetchData(user!.id),
    enabled: !!user,
  });

  const deleteRequestMutation = useMutation({
    mutationFn: deleteBudgetRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgetRequestsAndResponses", user?.id] });
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
              pending: <Badge variant="outline" className="border-yellow-500 text-yellow-600 bg-yellow-50">Pendente</Badge>,
              answered: <Badge variant="outline" className="border-blue-500 text-blue-600 bg-blue-50">Respondido Parcialmente</Badge>,
              completed: <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50">Finalizado</Badge>,
            };

            return (
              <AccordionItem
                value={request.id}
                key={request.id}
                className="border rounded-lg bg-card"
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
                <AccordionContent className="p-4 space-y-4 border-t">
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Peças Solicitadas:</h4>
                    <div className="space-y-2">
                      {(request.parts || []).map((part, index) => (
                        <div key={index} className="text-sm p-2 bg-secondary rounded-md border">
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
                      <p className="text-sm p-2 bg-secondary rounded-md border text-muted-foreground">
                        {request.notes}
                      </p>
                    </div>
                  )}

                  <div className="space-y-4 mt-4">
                    <h4 className="text-sm font-semibold">Respostas dos Fornecedores:</h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {(request.selected_shops_ids || []).map((shopId) => {
                        const shopName =
                          shopsMap.get(shopId) || "Fornecedor Desconhecido";
                        const response = responsesForThisRequest.find(
                          (r) => r.shop_id === shopId
                        );

                        if (response) {
                          return (
                            <Card key={response.id} className="bg-background">
                              <CardHeader className="p-4">
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-base">{response.shop_name}</CardTitle>
                                  <Badge className="bg-green-500 text-white">Respondido</Badge>
                                </div>
                              </CardHeader>
                              <CardContent className="p-4 pt-0">
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
                              </CardContent>
                              <CardFooter className="p-4 pt-0">
                                <Button asChild size="sm" className="w-full">
                                  <Link to={`/create-order/${response.id}`}>
                                    <ShoppingBag className="h-4 w-4 mr-2" />
                                    Realizar Pedido
                                  </Link>
                                </Button>
                              </CardFooter>
                            </Card>
                          );
                        } else {
                          return (
                            <Card key={shopId} className="bg-background">
                              <CardHeader className="p-4 flex flex-row items-center justify-between">
                                <CardTitle className="text-base">{shopName}</CardTitle>
                                <Badge variant="outline">Pendente</Badge>
                              </CardHeader>
                            </Card>
                          );
                        }
                      })}
                    </div>
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