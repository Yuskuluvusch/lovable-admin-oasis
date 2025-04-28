
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AppSettings } from "@/types/territory-types";

const TerritoryConfigDialog = () => {
  const [expirationDays, setExpirationDays] = useState<string>("30");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("territory_link_days")
        .single();

      if (data) {
        setExpirationDays(String(data.territory_link_days));
      } else if (error && error.code !== "PGRST116") {
        console.error("Error fetching app settings:", error);
      }
    };

    fetchConfig();
  }, []);

  const saveSettings = async () => {
    setIsLoading(true);
    
    const days = parseInt(expirationDays, 10);
    if (isNaN(days) || days <= 0) {
      toast.error("El número de días debe ser un número positivo");
      setIsLoading(false);
      return;
    }

    const { error } = await supabase
      .from("app_settings")
      .upsert({ 
        id: 1,
        territory_link_days: days 
      });

    if (error) {
      toast.error("Error al guardar la configuración");
      console.error("Error saving app settings:", error);
    } else {
      toast.success("Configuración guardada exitosamente");
    }

    setIsLoading(false);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Settings className="mr-2 h-4 w-4" />
          Configuración
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configuración de Territorios</DialogTitle>
          <DialogDescription>
            Establece los parámetros generales para los territorios.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="expiration-days">
              Días hasta la caducidad de territorios
            </Label>
            <Input
              id="expiration-days"
              type="number"
              min="1"
              value={expirationDays}
              onChange={(e) => setExpirationDays(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Número de días que un territorio estará asignado antes de caducar.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={saveSettings} disabled={isLoading}>
            Guardar configuración
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TerritoryConfigDialog;
