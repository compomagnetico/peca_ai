import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Car, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { startOfToday, startOfWeek, startOfMonth } from "date-fns";

const getStats = async () => {
  const today = startOfToday();
  const week = startOfWeek(new Date());
  const month = startOfMonth(new Date());

  const [
    autoPartsRes,
    todayRequestsRes,
    weekRequestsRes,
    monthRequestsRes,
  ] = await Promise.all([
    supabase
      .from("autopecas")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("budget_requests")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today.toISOString()),
    supabase
      .from("budget_requests")
      .select("*", { count: "exact", head: true })
      .gte("created_at", week.toISOString()),
    supabase
      .from("budget_requests")
      .select("*", { count: "exact", head: true })
      .gte("created_at", month.toISOString()),
  ]);

  if (autoPartsRes.error) throw new Error(autoPartsRes.error.message);
  if (todayRequestsRes.error) throw new Error(todayRequestsRes.error.message);
  if (weekRequestsRes.error) throw new Error(weekRequestsRes.error.message);
  if (monthRequestsRes.error) throw new Error(monthRequestsRes.error.message);

  return {
    autoPartsCount: autoPartsRes.count ?? 0,
    todayCount: todayRequestsRes.count ?? 0,
    weekCount: weekRequestsRes.count ?? 0,
    monthCount: monthRequestsRes.count ?? 0,
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
      </div>
    </div>
  );
};

export default Dashboard;