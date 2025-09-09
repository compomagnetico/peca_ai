"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { showError, showSuccess } from "@/utils/toast";
import { Pencil, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";

const formSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório."),
  whatsapp: z.string().min(1, "WhatsApp é obrigatório."),
});

type AutoPart = {
  id: string;
  nome: string;
  whatsapp: string;
  user_id: string;
};

const fetchAutoParts = async (userId: string) => {
  const { data, error } = await supabase
    .from("autopecas")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
};

const addAutoPart = async (part: z.infer<typeof formSchema> & { user_id: string }) => {
  const { data, error } = await supabase
    .from("autopecas")
    .insert(part)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
};

const updateAutoPart = async (part: Pick<AutoPart, 'id' | 'nome' | 'whatsapp'>) => {
  const { data, error } = await supabase
    .from("autopecas")
    .update({ nome: part.nome, whatsapp: part.whatsapp })
    .eq("id", part.id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
};

const deleteAutoPart = async (id: string) => {
  const { error } = await supabase.from("autopecas").delete().eq("id", id);
  if (error) throw new Error(error.message);
};

export function AutoPartsManager() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<AutoPart | null>(null);

  const { data: autoParts, isLoading } = useQuery<AutoPart[]>({
    queryKey: ["autoParts", user?.id],
    queryFn: () => fetchAutoParts(user!.id),
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: addAutoPart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["autoParts", user?.id] });
      showSuccess("Autopeça adicionada com sucesso!");
      addForm.reset();
    },
    onError: (error) => {
      showError(`Erro ao adicionar: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateAutoPart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["autoParts", user?.id] });
      showSuccess("Autopeça atualizada com sucesso!");
      setIsEditDialogOpen(false);
      setSelectedPart(null);
    },
    onError: (error) => {
      showError(`Erro ao atualizar: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAutoPart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["autoParts", user?.id] });
      showSuccess("Autopeça removida com sucesso!");
    },
    onError: (error) => {
      showError(`Erro ao remover: ${error.message}`);
    },
  });

  const addForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { nome: "", whatsapp: "" },
  });

  const editForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const handleAddSubmit = (values: z.infer<typeof formSchema>) => {
    if (!user) return;
    addMutation.mutate({ ...values, user_id: user.id });
  };

  const handleEditSubmit = (values: z.infer<typeof formSchema>) => {
    if (selectedPart) {
      updateMutation.mutate({ ...selectedPart, ...values });
    }
  };

  const openEditDialog = (part: AutoPart) => {
    setSelectedPart(part);
    editForm.reset({ nome: part.nome, whatsapp: part.whatsapp });
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-8 w-full max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Cadastrar Autopeça</CardTitle>
          <CardDescription>Adicione um novo fornecedor.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...addForm}>
            <form
              onSubmit={addForm.handleSubmit(handleAddSubmit)}
              className="space-y-4"
            >
              <FormField
                control={addForm.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Loja de Peças ABC" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="whatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: (11) 98888-8888" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={addMutation.isPending}>
                {addMutation.isPending ? "Adicionando..." : "Adicionar"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Autopeças</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {autoParts?.map((part) => (
                  <TableRow key={part.id}>
                    <TableCell className="font-medium">{part.nome}</TableCell>
                    <TableCell>{part.whatsapp}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openEditDialog(part)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => deleteMutation.mutate(part.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Autopeça</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(handleEditSubmit)}
              className="space-y-4"
            >
              <FormField
                control={editForm.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="whatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending
                  ? "Salvando..."
                  : "Salvar Alterações"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}