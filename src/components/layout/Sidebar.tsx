import { NavLink } from "react-router-dom";
import { Home, FileText, User, Inbox, BrainCircuit, LogOut, Building, Car as CarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Solicitar Orçamento", href: "/budget-request", icon: FileText },
  { name: "Orçamentos", href: "/budget-responses", icon: Inbox },
  { name: "Auto Peças", href: "/auto-parts", icon: CarIcon },
  { name: "Assistente AI", href: "/assistant", icon: BrainCircuit },
  { name: "Perfil", href: "/profile", icon: User },
];

export function Sidebar() {
  const { settings, signOut } = useAuth();

  return (
    <div className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center gap-4 border-b px-4 lg:h-[60px] lg:px-6">
          <NavLink to="/profile" className="flex items-center gap-3 font-semibold">
            <Avatar className="h-8 w-8">
              <AvatarImage src={settings?.logo_url || undefined} alt="Logo da Oficina" />
              <AvatarFallback>
                <Building className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{settings?.workshop_name || "Oficina"}</span>
          </NavLink>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                    isActive && "bg-muted text-primary"
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-4 border-t">
          <Button variant="ghost" className="w-full justify-start" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>
    </div>
  );
}