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
import { LogoUploader } from "@/components/LogoUploader";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";

const settingsSchema = z.object({
  username: z.string().min(3, "Nome de usuário deve ter pelo menos 3 caracteres.").max(20, "Nome de usuário não pode exceder 20 caracteres.").regex(/^[a-zA-Z0-9_]+$/, "Nome de usuário pode conter apenas letras, números e sublinhados.").toLowerCase(),
  workshop_name: z.string().min(1, "O nome da oficina é obrigatório."),
  workshop_address: z.string().min(1, "O endereço é obrigatório."),
  workshop_whatsapp: z.string().min(1, "O WhatsApp é obrigatório."),
  logo_url: z.string().url().optional().nullable(),
  favorite_suppliers: z.array(z.string()).optional(),
  notify_on_response: z.boolean().optional(),
});

type Settings = z.infer<typeof settingsSchema>;

type AutoPart = {
  id: string;
  nome: string;
};

const fetchData = async (userId: string) => {
  const { data: settings, error: settingsError } = await supabase
    .from("settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (settingsError && settingsError.code !== 'PGRST116') { // PGRST116 means no rows found, which is fine on first load
    throw new Error(settingsError.message);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .single();

  if (profileError && profileError.code !== 'PGRST116') {
    throw new Error(profileError.message);
  }

  const { data: autoParts, error: autoPartsError } = await supabase
    .from("autopecas")
    .select("id, nome")
    .eq("user_id", userId);

  if (autoPartsError) throw new Error(autoPartsError.message);

  return { settings, profile, autoParts };
};

const updateSettingsAndProfile = async (values: Partial<Settings> & { user_id: string }) => {
  const { user_id, username, ...settingsToUpdate } = values;

  // Update settings table
  const { data: settingsData, error: settingsError } = await supabase
    .from("settings")
    .upsert({ ...settingsToUpdate, user_id }, { onConflict: 'user_id' })
    .select()
    .single();
  
  if (settingsError) throw new Error(settingsError.message);

  // Update profiles table for username
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .update({ username })
    .eq("id", user_id)
    .select()
    .single();

  if (profileError) throw new Error(profileError.message);

  return { settingsData, profileData };
};

const ProfilePage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["profileData", user?.id],
    queryFn: () => fetchData(user!.id),
    enabled: !!user,
  });

  const mutation = useMutation({
    mutationFn: updateSettingsAndProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profileData", user?.id] });
      showSuccess("Perfil atualizado com sucesso!");
    },
    onError: (error) => {
      showError(`Erro ao atualizar: ${error.message}`);
    },
  });

  const form = useForm<Settings>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      username: "",
      workshop_name: "",
      workshop_address: "",
      workshop_whatsapp: "",
      logo_url: null,
      favorite_suppliers: [],
      notify_on_response: true,
    },
  });

  useEffect(() => {
    if (data) {
      form.reset({
        ...data.settings,
        username: data.profile?.username || "",
      });
    }
  }, [data, form]);

  const onSubmit = (values: Settings) => {
    if (!user) return;
    mutation.mutate({ ...values, user_id: user.id });
  };

  return (
    <div className="flex justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Perfil e Configurações</CardTitle>
          <CardDescription>
            Gerencie as informações e preferências da sua oficina.
          </CardDescription>
        </CardHeader>
        {isLoading || !user ? (
          <CardContent className="space-y-6">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Informações da Conta</h3>
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome de Usuário</FormLabel>
                        <FormControl>
                          <Input placeholder="seu_usuario" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Informações da Oficina</h3>
                  <FormField
                    control={form.control}
                    name="logo_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logo</FormLabel>
                        <FormControl>
                          <LogoUploader
                            currentLogoUrl={field.value}
                            onUploadSuccess={(url) => form.setValue("logo_url", url, { shouldDirty: true })}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                        <FormLabel>Endereço</FormLabel>
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
                        <FormLabel>WhatsApp</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: (11) 98888-7777" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Fornecedores Favoritos</h3>
                  <p className="text-sm text-muted-foreground">
                    Selecione os fornecedores que devem ser pré-selecionados ao criar um novo orçamento.
                  </p>
                  <FormField
                    control={form.control}
                    name="favorite_suppliers"
                    render={() => (
                      <FormItem>
                        <ScrollArea className="h-40 w-full rounded-md border">
                          <div className="p-4">
                            {data?.autoParts?.map((supplier) => (
                              <FormField
                                key={supplier.id}
                                control={form.control}
                                name="favorite_suppliers"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 mb-4">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(supplier.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...(field.value || []), supplier.id])
                                            : field.onChange(field.value?.filter((id) => id !== supplier.id));
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">{supplier.nome}</FormLabel>
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>
                        </ScrollArea>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Notificações</h3>
                  <FormField
                    control={form.control}
                    name="notify_on_response"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Notificar sobre respostas</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Receber uma notificação quando um fornecedor responder a um orçamento.
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={mutation.isPending || !form.formState.isDirty}>
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