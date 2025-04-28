
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Territory } from "../../types/territory-types";
import { addDays, format } from "date-fns";

interface Publisher {
  id: string;
  name: string;
}

interface AssignTerritoryDialogProps {
  territory: Territory;
  onAssign: () => void;
}

const AssignTerritoryDialog = ({ territory, onAssign }: AssignTerritoryDialogProps) => {
  const [open, setOpen] = useState(false);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [selectedPublisher, setSelectedPublisher] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [expirationDays, setExpirationDays] = useState<number>(30);

  useEffect(() => {
    if (open) {
      fetchPublishers();
      fetchExpirationDays();
    }
  }, [open]);

  const fetchPublishers = async () => {
    const { data, error } = await supabase
      .from("publishers")
      .select("id, name")
      .order("name");

    if (error) {
      toast.error("Error al cargar publicadores");
      console.error("Error al cargar publicadores:", error);
      return;
    }

    setPublishers(data || []);
  };

  const fetchExpirationDays = async () => {
    const { data, error } = await supabase
      .from("territory_settings")
      .select("expiration_days")
      .single();

    if (data) {
      setExpirationDays(data.expiration_days);
    } else if (error && error.code !== "PGRST116") {
      // PGRST116 is "no rows returned" - this is expected if no config exists yet
      console.error("Error fetching territory settings:", error);
    }
  };

  const handleAssign = async () => {
    if (!selectedPublisher) {
      toast.error("Por favor selecciona un publicador");
      return;
    }

    setIsLoading(true);
    const now = new Date();
    const dueDate = addDays(now, expirationDays);

    const { error } = await supabase
      .from("assigned_territories")
      .insert({
        territory_id: territory.id,
        publisher_id: selectedPublisher,
        assigned_at: now.toISOString(),
        due_at: dueDate.toISOString(),
        status: "assigned",
      });

    if (error) {
      toast.error("Error al asignar el territorio");
      console.error("Error al asignar el territorio:", error);
    } else {
      toast.success("Territorio asignado exitosamente");
      onAssign();
      setSelectedPublisher("");
      setOpen(false);
    }

    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <UserPlus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Asignar Territorio</DialogTitle>
          <DialogDescription>
            Asigna el territorio "{territory.name}" a un publicador.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="publisher">Selecciona un Publicador</Label>
            <Select
              value={selectedPublisher}
              onValueChange={setSelectedPublisher}
              disabled={isLoading}
            >
              <SelectTrigger>
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
          <div className="text-sm text-muted-foreground">
            Fecha de caducidad estimada:{" "}
            {format(addDays(new Date(), expirationDays), "dd/MM/yyyy")}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleAssign} disabled={isLoading}>
            Asignar Territorio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignTerritoryDialog;
