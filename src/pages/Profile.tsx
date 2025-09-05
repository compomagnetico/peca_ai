import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const ProfilePage = () => {
  return (
    <div className="flex justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Perfil da Oficina</CardTitle>
          <CardDescription>
            Atualize as informações da sua oficina aqui.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Endereço da Oficina</Label>
            <Input
              id="address"
              placeholder="Ex: Rua das Peças, 123, Bairro Centro"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp do Responsável</Label>
            <Input id="whatsapp" placeholder="Ex: (11) 98888-7777" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget-time">
              Tempo máximo para o orçamento (em minutos)
            </Label>
            <Input
              id="budget-time"
              type="number"
              placeholder="Ex: 60"
            />
            <p className="text-sm text-muted-foreground">
              Define o tempo que você tem para responder a uma solicitação de
              orçamento.
            </p>
          </div>
          <Button>Salvar Alterações</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;