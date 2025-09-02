import { WorkshopRegistrationForm } from "@/components/WorkshopRegistrationForm";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Gerencie suas oficinas aqui.
          </p>
        </header>
        <main className="flex justify-center">
          <WorkshopRegistrationForm />
        </main>
      </div>
    </div>
  );
};

export default Index;