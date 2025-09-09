import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Menu, Car, Home, FileText, User, Inbox, BrainCircuit, LogOut, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";

const mainNavigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Solicitar Orçamento", href: "/budget-request", icon: FileText },
  { name: "Orçamentos", href: "/budget-responses", icon: Inbox },
  { name: "Auto Peças", href: "/auto-parts", icon: Car },
  { name: "Perfil", href: "/profile", icon: User },
];

const secondaryNavigation = [
  { name: "Assistente AI", href: "/assistant", icon: BrainCircuit },
];

export function Header() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { settings, signOut } = useAuth();

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir menu de navegação</span>
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
            {[...mainNavigation, ...secondaryNavigation].map((item) => (
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
          <div className="mt-auto">
            <Button variant="secondary" className="w-full" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      
      <div className="w-full flex-1">
        {/* Espaço para busca ou título da página no futuro */}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full">
            <Avatar>
              <AvatarImage src={settings?.logo_url || undefined} alt="Logo da Oficina" />
              <AvatarFallback>
                <Building className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <span className="sr-only">Abrir menu do usuário</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            <p>Minha Conta</p>
            <p className="text-xs font-normal text-muted-foreground">
              Olá, {settings?.workshop_name || "Oficina"}
            </p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {mainNavigation.map((item) => (
            <NavLink to={item.href} key={item.name}>
              <DropdownMenuItem className="cursor-pointer">
                <item.icon className="mr-2 h-4 w-4" />
                <span>{item.name}</span>
              </DropdownMenuItem>
            </NavLink>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut} className="cursor-pointer text-red-600 focus:text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}