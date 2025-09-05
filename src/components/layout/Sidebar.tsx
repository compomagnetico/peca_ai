import { NavLink } from "react-router-dom";
import { Home, Car, FileText, User, Inbox, BrainCircuit } from "lucide-react"; // Importar BrainCircuit
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Solicitar Orçamento", href: "/budget-request", icon: FileText },
  { name: "Orçamentos", href: "/budget-responses", icon: Inbox },
  { name: "Auto Peças", href: "/auto-parts", icon: Car },
  { name: "Assistente AI", href: "/assistant", icon: BrainCircuit }, // Novo item de navegação
  { name: "Perfil", href: "/profile", icon: User },
];

export function Sidebar() {
  return (
    <div className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <NavLink to="/" className="flex items-center gap-2">
            <Car className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-green-500 bg-clip-text text-transparent">
              Peça AI
            </span>
          </NavLink>
        </div>
        <div className="flex-1">
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
      </div>
    </div>
  );
}