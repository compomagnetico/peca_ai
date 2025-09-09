import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Menu, Home, FileText, User, Inbox, BrainCircuit, LogOut, Building, Car as CarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Solicitar Orçamento", href: "/budget-request", icon: FileText },
  { name: "Orçamentos", href: "/budget-responses", icon: Inbox },
  { name: "Auto Peças", href: "/auto-parts", icon: CarIcon },
  { name: "Assistente AI", href: "/assistant", icon: BrainCircuit },
  { name: "Perfil", href: "/profile", icon: User },
];

export function Header() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { settings, signOut } = useAuth();

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir menu de navegação</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col bg-sidebar text-sidebar-foreground border-sidebar-border">
          <nav className="grid gap-2 text-lg font-medium">
            <NavLink
              to="/profile"
              className="flex items-center gap-4 mb-4"
              onClick={() => setIsSheetOpen(false)}
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={settings?.logo_url || undefined} alt="Logo da Oficina" />
                <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
                  <Building className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <span className="font-bold text-xl truncate">
                {settings?.workshop_name || "Oficina"}
              </span>
            </NavLink>
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setIsSheetOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto">
            <Button variant="secondary" className="w-full bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/80" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      
      <div className="w-full flex-1">
        {/* Conteúdo do cabeçalho, como uma barra de busca, pode ser adicionado aqui no futuro. */}
      </div>
    </header>
  );
}