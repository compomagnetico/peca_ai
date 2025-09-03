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
import { RefreshCw, MessageSquare, Trash2, CheckCircle } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";

type BudgetResponse = {
  id: string;
  created_at: string;
  shop_name: string;
  shop_whatsapp: string;
  parts_and_prices: { part: string; price: number }[];
  total_price: number;
  notes?: string;
  request_id: string;
  budget_requests: {
    car_model: string;
    car_year: string;
    status: string;
  } | null;
};

const fetchBudgetResponses = async (): Promise<BudgetResponse[]> => {
  const { data, error } = await supabase
    .from("budget_responses")
    .select(
      `
      *,
      budget_requests (
        car_model,
        car_year,
        status
      )
    `
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as BudgetResponse[];
};

const deleteBudgetResponse = async (responseId: string) => {
  const { error } = await supabase
    .from("budget_responses")
    .delete()
    .eq("id", responseId);
  if (error) throw new Error(error.message);
};

const deleteBudgetRequest = async (requestId: string) => {
  const { error } = await supabase
    .from("budget_requests")
    .delete()
    .eq("id", requestId);
  if (error) throw new Error(error.message);
};

const updateBudgetRequestStatus = async ({
  requestId,
  status,
}: {
  requestId: string;
  status: string;
}) => {
  const { error } = await supabase
    .from("budget_requests")
    .update({ status })
    .eq("id", requestId);
  if (error) throw new Error(error.message);
};

export function BudgetResponsesManager() {
  const queryClient = useQueryClient();
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    type: "response" | "request" | null;
    id: string | null;
    message: string;
  }>({ isOpen: false, type: null, id: null, message: "" });

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

  const deleteResponseMutation = useMutation({
    mutationFn: deleteBudgetResponse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgetResponses"] });
      showSuccess("Resposta de orçamento removida com sucesso!");
      setDialogState({ isOpen: false, type: null, id: null, message: "" });
    },
    onError: (error) => {
      showError(`Erro ao remover: ${error.message}`);
    },
  });

  const deleteRequestMutation = useMutation({
    mutationFn: deleteBudgetRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgetResponses"] });
      showSuccess(
        "Solicitação e suas respostas foram removidas com sucesso!"
      );
      setDialogState({ isOpen: false, type: null, id: null, message: "" });
    },
    onError: (error) => {
      showError(`Erro ao remover: ${error.message}`);
    },
  });

  const updateRequestStatusMutation = useMutation({
    mutationFn: updateBudgetRequestStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgetResponses"] });
      showSuccess("Orçamento marcado como finalizado!");
    },
    onError: (error) => {
      showError(`Erro ao atualizar status: ${error.message}`);
    },
  });

  const handleDeleteClick = (type: "response" | "request", id: string) => {
    const message =
      type === "response"
        ? "Tem certeza que deseja apagar esta resposta de orçamento? Esta ação não pode ser desfeita."
        : "Tem certeza que deseja apagar esta solicitação e todas as suas respostas? Esta ação não pode ser desfeita.";
    setDialogState({ isOpen: true, type, id, message });
  };

  const handleConfirmDelete = () => {
    if (!dialogState.type || !dialogState.id) return;
    if (dialogState.type === "response") {
      deleteResponseMutation.mutate(dialogState.id);
    } else {
      deleteRequestMutation.mutate(dialogState.id);
    }
  };

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
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-lg">{carKey}</span>
                    <Badge variant="secondary">
                      {carResponses.length}{" "}
                      {carResponses.length > 1 ? "respostas" : "resposta"}
                    </Badge>
                    {carResponses[0]?.budget_requests?.status ===
                      "completed" && (
                      <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
                        Finalizado
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {carResponses[0]?.budget_requests?.status !==
                      "completed" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full hover:bg-green-100 text-muted-foreground hover:text-green-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateRequestStatusMutation.mutate({
                            requestId: carResponses[0].request_id,
                            status: "completed",
                          });
                        }}
                        disabled={updateRequestStatusMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick("request", carResponses[0].request_id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-4 space-y-2 bg-muted/20">
                {carResponses.map((response) => (
                  <Card key={response.id} className="overflow-hidden">
                    <CardHeader className="p-3 pb-2 bg-muted/40">
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
                      <h4 className="text-xs font-medium mb-1.5">
                        Peças e Preços
                      </h4>
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
                              <TableCell className="py-1.5 text-sm">
                                {item.part}
                              </TableCell>
                              <TableCell className="py-1.5 text-sm text-right">
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
                    <CardFooter className="flex justify-between items-center bg-muted/40 p-2.5">
                      <div className="font-semibold text-sm">
                        Total:{" "}
                        {response.total_price.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="h-8"
                        >
                          <a
                            href={`https://wa.me/${response.shop_whatsapp.replace(
                              /\D/g,
                              ""
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs"
                          >
                            <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                            Contatar
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() =>
                            handleDeleteClick("response", response.id)
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
      <AlertDialog
        open={dialogState.isOpen}
        onOpenChange={(isOpen) => setDialogState((prev) => ({ ...prev, isOpen }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              {dialogState.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() =>
                setDialogState({ isOpen: false, type: null, id: null, message: "" })
              }
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={
                deleteResponseMutation.isPending ||
                deleteRequestMutation.isPending
              }
            >
              {deleteResponseMutation.isPending ||
              deleteRequestMutation.isPending
                ? "Apagando..."
                : "Apagar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}