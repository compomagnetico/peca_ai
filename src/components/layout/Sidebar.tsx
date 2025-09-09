import { NavLink } from "react-router-dom";
import { Home, FileText, User, Inbox, BrainCircuit, Building, Car as CarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
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
  const { settings } = useAuth();

  return (
    <div className="hidden border-r bg-sidebar text-sidebar-foreground md:block">
      <div className="flex h-full max-h-screen flex-col">
        <div className="flex h-14 flex-shrink-0 items-center gap-4 border-b border-sidebar-border px-4 lg:h-[60px] lg:px-6">
          <NavLink to="/profile" className="flex items-center gap-3 font-semibold">
            <Avatar className="h-8 w-8">
              <AvatarImage src={settings?.logo_url || undefined} alt="Logo da Oficina" />
              <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
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
                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}