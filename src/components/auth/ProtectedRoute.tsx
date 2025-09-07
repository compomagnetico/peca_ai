"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Outlet } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

export const ProtectedRoute = () => {
  const { session } = useAuth();

  // A sessão ainda está sendo carregada, mostre um loader
  if (session === undefined) {
    return (
      <div className="p-4">
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  // Se não houver sessão, redirecione para o login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Se houver sessão, renderize a rota filha
  return <Outlet />;
};