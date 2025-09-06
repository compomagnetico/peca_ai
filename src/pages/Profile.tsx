"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { showError, showSuccess } from "@/utils/toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useEffect } from "react";

const settingsSchema = z.object({
  workshop_name: z.string().min(1, "O nome da oficina é obrigatório."),
  workshop_address: z.string().min(1, "O endereço é obrigatório."),
  workshop_whatsapp: z.string().min(1, "O WhatsApp é obrigatório."),
});

type Settings = z.infer<typeof settingsSchema>;

const fetchSettings = async () => {
  const { data, error } = await supabase
    .from("settings")
    .select("workshop_name, workshop_address, workshop_whatsapp")
    .eq("id", 1)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
    throw new Error(error.message);
  }
  return data;
};

const updateSettings = async (settings: Settings) => {
  const { data, error } = await supabase
    .from("settings")
    .upsert({ id: 1, ...settings }, { onConflict: 'id' })
    .select()
    .single();
  
  if (error) throw new Error(error.message);
  return data;
};

const ProfilePage = () => {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
  });

  const mutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      showSuccess("Perfil atualizado com sucesso!");
    },
    onError: (error) => {
      showError(`Erro ao atualizar: ${error.message}`);
    },
  });

  const form = useForm<Settings>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      workshop_name: "",
      workshop_address: "",
      workshop_whatsapp: "",
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset(settings);
    }
  }, [settings, form]);

  const onSubmit = (values: Settings) => {
    mutation.mutate(values);
  };

  return (
    <div className="flex justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Perfil da Oficina</CardTitle>
          <CardDescription>
            Atualize as informações da sua oficina aqui.
          </CardDescription>
        </CardHeader>
        {isLoading ? (
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="workshop_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Oficina</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Auto Mecânica do Zé" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="workshop_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço da Oficina</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Rua das Peças, 123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="workshop_whatsapp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WhatsApp do Responsável</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: (11) 98888-7777" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        )}
      </Card>
    </div>
  );
};

export default ProfilePage;