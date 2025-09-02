import { WorkshopRegistrationForm } from "@/components/WorkshopRegistrationForm";
import { AutoPartsManager } from "@/components/AutoPartsManager";
import { BudgetRequestForm } from "@/components/BudgetRequestForm";
import { Separator } from "@/components/ui/separator";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-4xl">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Gerencie suas oficinas e autopeças aqui.
          </p>
        </header>
        <main className="flex flex-col items-center space-y-8">
          <BudgetRequestForm />
          <Separator className="my-8" />
          <WorkshopRegistrationForm />
          <Separator className="my-8" />
          <AutoPartsManager />
        </main>
      </div>
    </div>
  );
};

export default Index;