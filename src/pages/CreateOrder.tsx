"use client";

import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

const updateRequestStatus = async (requestId: string) => {
  const { error } = await supabase
    .from("budget_requests")
    .update({ status: "completed" })
    .eq("id", requestId);

  if (error) {
    throw new Error(error.message);
  }
};

const CreateOrder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { requestId } = useParams();
  const queryClient = useQueryClient();

  const { orderDetails } = location.state || {};

  useEffect(() => {
    if (!orderDetails) {
      showError("Detalhes do pedido não encontrados. Redirecionando...");
      navigate("/");
    }
  }, [orderDetails, navigate]);

  const mutation = useMutation({
    mutationFn: () => updateRequestStatus(requestId!),
    onSuccess: () => {
      showSuccess("Pedido realizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["budgetRequestsAndResponses"] });
      navigate("/");
    },
    onError: (error) => {
      showError(`Erro ao realizar o pedido: ${error.message}`);
    },
  });

  if (!orderDetails) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Carregando detalhes do pedido...</p>
      </div>
    );
  }

  const {
    shopName,
    partsAndPrices,
    totalPrice,
    responseNotes,
  } = orderDetails;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Confirmar Pedido</CardTitle>
          <CardDescription>
            Revise os detalhes do seu pedido para a autopeça{" "}
            <span className="font-semibold">{shopName}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Itens do Pedido</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Peça</TableHead>
                    <TableHead className="text-right">Preço</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partsAndPrices.map((item: any, index: number) => (
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
            </div>
            {responseNotes && (
              <div>
                <h3 className="font-semibold">Observações da Autopeça</h3>
                <p className="text-sm text-muted-foreground p-2 bg-muted/50 rounded-md mt-1">
                  {responseNotes}
                </p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-4">
          <div className="flex justify-between items-center font-bold text-lg border-t pt-4">
            <span>Total</span>
            <span>
              {totalPrice.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </span>
          </div>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            {mutation.isPending ? "Confirmando..." : "Confirmar Pedido"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CreateOrder;