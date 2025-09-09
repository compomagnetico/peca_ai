import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle, Wrench } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { startOfMonth } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

const getStats = async (userId: string) => {
  const month = startOfMonth(new Date()).toISOString();

  const [
    autoPartsRes,
    monthRequestsRes,
    monthCompletedRes,
  ] = await Promise.all([
    supabase.from("autopecas").select("*", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("budget_requests").select("*", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", month),
    supabase.from("budget_requests").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("status", "completed").gte("created_at", month),
  ]);

  const checkError = (res: any, name: string) => {
    if (res.error) throw new Error(`Error fetching ${name}: ${res.error.message}`);
    return res.count ?? 0;
  };

  return {
    autoPartsCount: checkError(autoPartsRes, "auto parts"),
    monthCount: checkError(monthRequestsRes, "month requests"),
    monthCompletedCount: checkError(monthCompletedRes, "month completed"),
  };
};

const StatCard = ({ title, value, icon: Icon, isLoading }: { title: string, value: number | string, icon: React.ElementType, isLoading: boolean }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <Skeleton className="h-8 w-1/4" />
      ) : (
        <div className="text-2xl font-bold">{value}</div>
      )}
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { user, settings } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboardStats", user?.id],
    queryFn: () => getStats(user!.id),
    enabled: !!user,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bem-vindo, {settings?.workshop_name || "Mecânico"}!</h1>
        <p className="text-muted-foreground">Aqui está um resumo da sua atividade recente.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard 
          title="Fornecedores Cadastrados" 
          value={data?.autoPartsCount ?? 0} 
          icon={Wrench} 
          isLoading={isLoading} 
        />
        <StatCard 
          title="Orçamentos Enviados (Mês)" 
          value={data?.monthCount ?? 0} 
          icon={FileText} 
          isLoading={isLoading} 
        />
        <StatCard 
          title="Orçamentos Concluídos (Mês)" 
          value={data?.monthCompletedCount ?? 0} 
          icon={CheckCircle} 
          isLoading={isLoading} 
        />
      </div>
    </div>
  );
};

export default Dashboard;