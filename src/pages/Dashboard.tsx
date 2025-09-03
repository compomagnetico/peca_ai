import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Car, FileText, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { startOfToday, startOfWeek, startOfMonth } from "date-fns";

const getStats = async () => {
  const today = startOfToday().toISOString();
  const week = startOfWeek(new Date()).toISOString();
  const month = startOfMonth(new Date()).toISOString();

  const [
    autoPartsRes,
    todayRequestsRes,
    weekRequestsRes,
    monthRequestsRes,
    todayCompletedRes,
    weekCompletedRes,
    monthCompletedRes,
  ] = await Promise.all([
    supabase.from("autopecas").select("*", { count: "exact", head: true }),
    supabase.from("budget_requests").select("*", { count: "exact", head: true }).gte("created_at", today),
    supabase.from("budget_requests").select("*", { count: "exact", head: true }).gte("created_at", week),
    supabase.from("budget_requests").select("*", { count: "exact", head: true }).gte("created_at", month),
    supabase.from("budget_requests").select("*", { count: "exact", head: true }).eq("status", "completed").gte("created_at", today),
    supabase.from("budget_requests").select("*", { count: "exact", head: true }).eq("status", "completed").gte("created_at", week),
    supabase.from("budget_requests").select("*", { count: "exact", head: true }).eq("status", "completed").gte("created_at", month),
  ]);

  const checkError = (res: any, name: string) => {
    if (res.error) throw new Error(`Error fetching ${name}: ${res.error.message}`);
    return res.count ?? 0;
  };

  return {
    autoPartsCount: checkError(autoPartsRes, "auto parts"),
    todayCount: checkError(todayRequestsRes, "today requests"),
    weekCount: checkError(weekRequestsRes, "week requests"),
    monthCount: checkError(monthRequestsRes, "month requests"),
    todayCompletedCount: checkError(todayCompletedRes, "today completed"),
    weekCompletedCount: checkError(weekCompletedRes, "week completed"),
    monthCompletedCount: checkError(monthCompletedRes, "month completed"),
  };
};

const Dashboard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: getStats,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Autopeças Cadastradas
            </CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-1/4" />
            ) : (
              <div className="text-2xl font-bold">{data?.autoPartsCount}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Orçamentos Enviados
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="today" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="today">Hoje</TabsTrigger>
                <TabsTrigger value="week">Semana</TabsTrigger>
                <TabsTrigger value="month">Mês</TabsTrigger>
              </TabsList>
              <TabsContent value="today">
                {isLoading ? (
                  <Skeleton className="h-8 w-1/4 mt-2" />
                ) : (
                  <div className="text-2xl font-bold pt-2">{data?.todayCount}</div>
                )}
              </TabsContent>
              <TabsContent value="week">
                {isLoading ? (
                  <Skeleton className="h-8 w-1/4 mt-2" />
                ) : (
                  <div className="text-2xl font-bold pt-2">{data?.weekCount}</div>
                )}
              </TabsContent>
              <TabsContent value="month">
                {isLoading ? (
                  <Skeleton className="h-8 w-1/4 mt-2" />
                ) : (
                  <div className="text-2xl font-bold pt-2">{data?.monthCount}</div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Orçamentos Concluídos
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="today" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="today">Hoje</TabsTrigger>
                <TabsTrigger value="week">Semana</TabsTrigger>
                <TabsTrigger value="month">Mês</TabsTrigger>
              </TabsList>
              <TabsContent value="today">
                {isLoading ? (
                  <Skeleton className="h-8 w-1/4 mt-2" />
                ) : (
                  <div className="text-2xl font-bold pt-2">{data?.todayCompletedCount}</div>
                )}
              </TabsContent>
              <TabsContent value="week">
                {isLoading ? (
                  <Skeleton className="h-8 w-1/4 mt-2" />
                ) : (
                  <div className="text-2xl font-bold pt-2">{data?.weekCompletedCount}</div>
                )}
              </TabsContent>
              <TabsContent value="month">
                {isLoading ? (
                  <Skeleton className="h-8 w-1/4 mt-2" />
                ) : (
                  <div className="text-2xl font-bold pt-2">{data?.monthCompletedCount}</div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;