
import React, { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Zone, Territory } from "../../types/territory-types";

interface EditTerritoryDialogProps {
  territory: Territory;
  zones: Zone[];
  onUpdate: () => void;
}

const EditTerritoryDialog = ({ territory, zones, onUpdate }: EditTerritoryDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: territory.name,
    zone_id: territory.zone_id || "",
    google_maps_link: territory.google_maps_link || "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase
      .from("territories")
      .update({
        name: formData.name.trim(),
        zone_id: formData.zone_id || null,
        google_maps_link: formData.google_maps_link.trim() || null,
      })
      .eq("id", territory.id);

    if (error) {
      toast.error("Error al actualizar el territorio");
      console.error("Error al actualizar el territorio:", error);
    } else {
      toast.success("Territorio actualizado exitosamente");
      onUpdate();
      setOpen(false);
    }

    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Territorio</DialogTitle>
          <DialogDescription>
            Actualiza la información del territorio seleccionado.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nombre del Territorio</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-zone">Zona</Label>
              <Select
                value={formData.zone_id}
                onValueChange={(value) => setFormData({ ...formData, zone_id: value })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una zona" />
                </SelectTrigger>
                <SelectContent>
                  {zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-maps-link">Link de Google Maps (Opcional)</Label>
              <Input
                id="edit-maps-link"
                value={formData.google_maps_link}
                onChange={(e) =>
                  setFormData({ ...formData, google_maps_link: e.target.value })
                }
                disabled={isLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              Guardar cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTerritoryDialog;
