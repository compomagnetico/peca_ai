"use client";

import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { showError, showLoading, dismissToast } from "@/utils/toast";
import { Upload, Building } from "lucide-react";

interface LogoUploaderProps {
  currentLogoUrl: string | null | undefined;
  onUploadSuccess: (newUrl: string) => void;
}

export function LogoUploader({ currentLogoUrl, onUploadSuccess }: LogoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    const toastId = showLoading("Enviando logo...");
    setIsUploading(true);

    try {
      const filePath = `public/workshop_logo_${new Date().getTime()}`;
      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("logos")
        .getPublicUrl(filePath);
      
      if (!publicUrlData.publicUrl) {
        throw new Error("Não foi possível obter a URL pública da logo.");
      }

      onUploadSuccess(publicUrlData.publicUrl);
      dismissToast(toastId);
    } catch (error) {
      dismissToast(toastId);
      showError(`Erro no upload: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
      setPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-20 w-20">
        <AvatarImage src={preview || currentLogoUrl || undefined} alt="Logo da Oficina" />
        <AvatarFallback>
          <Building className="h-10 w-10" />
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Upload className="mr-2 h-4 w-4" />
          {isUploading ? "Enviando..." : "Trocar Logo"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
        <p className="text-xs text-muted-foreground">PNG, JPG ou WEBP (Max 2MB).</p>
      </div>
    </div>
  );
}