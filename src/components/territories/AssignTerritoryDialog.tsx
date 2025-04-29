
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { Territory } from "@/types/territory-types";

interface Publisher {
  id: string;
  name: string;
  role_id: string;
  assigned_territories_count: number;
  publisher_roles?: {
    max_territories: number;
    name: string;
  };
}

interface AppSettingsType {
  territory_link_days: number;
}

interface AssignTerritoryDialogProps {
  territory: Territory;
  onAssign: () => void;
}

const AssignTerritoryDialog: React.FC<AssignTerritoryDialogProps> = ({ territory, onAssign }) => {
  const [open, setOpen] = useState(false);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [selectedPublisherId, setSelectedPublisherId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettingsType>({ territory_link_days: 30 });

  useEffect(() => {
    const fetchPublishers = async () => {
      // Primero obtenemos los publishers con sus roles
      const { data: publishersData, error: publishersError } = await supabase
        .from("publishers")
        .select(`
          id,
          name,
          role_id,
          publisher_roles (
            max_territories,
            name
          )
        `)
        .order("name");

      if (publishersError) {
        console.error("Error loading publishers:", publishersError);
        return;
      }

      // Ahora obtenemos el recuento de territorios para cada publicador
      if (publishersData) {
        const publishersWithCounts = await Promise.all(
          publishersData.map(async (publisher) => {
            const { count } = await supabase
              .from("assigned_territories")
              .select("*", { count: 'exact', head: true })
              .eq("publisher_id", publisher.id)
              .eq("status", "assigned");
            
            return {
              ...publisher,
              assigned_territories_count: count || 0
            };
          })
        );

        setPublishers(publishersWithCounts);
      }
    };

    const fetchAppSettings = async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("territory_link_days")
        .single();

      if (error) {
        console.error("Error loading app settings:", error);
        return;
      }

      if (data) {
        setAppSettings(data);
      }
    };

    if (open) {
      fetchPublishers();
      fetchAppSettings();
    }
  }, [open]);

  const handleAssign = async () => {
    if (!selectedPublisherId) {
      toast.error("Por favor selecciona un publicador");
      return;
    }

    // Verificar límite de territorios
    const selectedPublisher = publishers.find(p => p.id === selectedPublisherId);
    if (selectedPublisher) {
      const maxTerritories = selectedPublisher.publisher_roles?.max_territories || 1;
      const currentCount = selectedPublisher.assigned_territories_count || 0;

      if (currentCount >= maxTerritories) {
        toast.error(`El publicador ya tiene el máximo permitido de ${maxTerritories} territorio(s) asignado(s) para su rol de ${selectedPublisher.publisher_roles?.name}`);
        return;
      }
    }

    setLoading(true);

    const expiresAt = format(
      addDays(new Date(), appSettings.territory_link_days),
      "yyyy-MM-dd"
    );

    try {
      const { error } = await supabase.from("assigned_territories").insert([
        {
          territory_id: territory.id,
          publisher_id: selectedPublisherId,
          expires_at: expiresAt,
          status: "assigned",
        },
      ]);

      if (error) {
        toast.error("Error al asignar territorio");
        console.error(error);
      } else {
        toast.success("Territorio asignado correctamente");
        setOpen(false);
        onAssign();
      }
    } catch (err) {
      console.error("Error en handleAssign:", err);
      toast.error("Error al asignar territorio");
    } finally {
      setLoading(false);
    }
  };

  // Filtrar publicadores que ya han alcanzado su límite
  const getPublisherStatus = (publisher: Publisher) => {
    const maxTerritories = publisher.publisher_roles?.max_territories || 1;
    const currentCount = publisher.assigned_territories_count || 0;
    
    if (currentCount >= maxTerritories) {
      return `(${currentCount}/${maxTerritories}) - Límite alcanzado`;
    }
    return `(${currentCount}/${maxTerritories})`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="mr-2 h-4 w-4" />
          Asignar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asignar Territorio</DialogTitle>
          <DialogDescription>
            Asigna el territorio {territory.name} a un publicador.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="publisher">Publicador</Label>
            <Select
              value={selectedPublisherId}
              onValueChange={setSelectedPublisherId}
            >
              <SelectTrigger id="publisher">
                <SelectValue placeholder="Selecciona un publicador" />
              </SelectTrigger>
              <SelectContent>
                {publishers.map((publisher) => (
                  <SelectItem 
                    key={publisher.id} 
                    value={publisher.id}
                    disabled={publisher.assigned_territories_count >= (publisher.publisher_roles?.max_territories || 1)}
                  >
                    {publisher.name} {getPublisherStatus(publisher)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              El territorio será asignado por {appSettings.territory_link_days} días según la 
              configuración actual.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleAssign} disabled={loading}>
            Asignar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignTerritoryDialog;
