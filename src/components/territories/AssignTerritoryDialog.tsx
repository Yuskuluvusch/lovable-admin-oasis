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
      const { data, error } = await supabase
        .from("publishers")
        .select("id, name")
        .order("name");

      if (error) {
        console.error("Error loading publishers:", error);
        return;
      }
      setPublishers(data || []);
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

    setLoading(true);

    const expiresAt = format(
      addDays(new Date(), appSettings.territory_link_days),
      "yyyy-MM-dd"
    );

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

    setLoading(false);
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
                  <SelectItem key={publisher.id} value={publisher.id}>
                    {publisher.name}
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
