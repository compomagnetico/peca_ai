import { NavLink } from "react-router-dom";
import { Car, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Sidebar() {
  return (
    <div className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col items-center gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <NavLink to="/" className="flex items-center gap-2">
            <Car className="h-6 w-6 text-primary" />
            <span className="sr-only">Peça AI</span>
          </NavLink>
        </div>
        <TooltipProvider>
          <nav className="flex flex-col items-center gap-4 px-2 py-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <NavLink
                  to="/assistant"
                  className={({ isActive }) =>
                    cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                      isActive && "bg-accent text-accent-foreground"
                    )
                  }
                >
                  <BrainCircuit className="h-5 w-5" />
                  <span className="sr-only">Assistente AI</span>
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side="right">Assistente AI</TooltipContent>
            </Tooltip>
          </nav>
        </TooltipProvider>
      </div>
    </div>
  );
}