import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Menu, Car, Home, FileText, User, Inbox, BrainCircuit, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext"; // Importar useAuth

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Solicitar Orçamento", href: "/budget-request", icon: FileText },
  { name: "Orçamentos", href: "/budget-responses", icon: Inbox },
  { name: "Auto Peças", href: "/auto-parts", icon: Car },
  { name: "Assistente AI", href: "/assistant", icon: BrainCircuit },
  { name: "Perfil", href: "/profile", icon: User },
];

export function Header() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { user, profile, signOut } = useAuth(); // Usar useAuth

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col">
          <nav className="grid gap-2 text-lg font-medium">
            <NavLink
              to="/"
              className="flex items-center gap-2 mb-4"
              onClick={() => setIsSheetOpen(false)}
            >
              <Car className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-green-500 bg-clip-text text-transparent">
                Peça AI
              </span>
            </NavLink>
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setIsSheetOpen(false)}
                className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </NavLink>
            ))}
          </nav>
          {user && (
            <div className="mt-auto p-4 border-t flex items-center justify-between text-sm text-muted-foreground">
              <span>Olá, {profile?.username || user.email || user.phone || "Usuário"}</span>
              <Button variant="ghost" size="icon" onClick={signOut} className="h-8 w-8">
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Sair</span>
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
      <div className="w-full flex-1">
        {/* Pode adicionar um campo de busca aqui no futuro */}
      </div>
      {user && (
        <div className="hidden md:flex items-center gap-4">
          <span className="text-sm text-muted-foreground">Olá, {profile?.username || user.email || user.phone || "Usuário"}</span>
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      )}
    </header>
  );
}