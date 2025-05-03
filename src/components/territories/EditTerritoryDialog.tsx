
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
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit, CircleCheck, CircleAlert, X, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Zone, Territory } from "../../types/territory-types";
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from "@/components/ui/tooltip";

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
    danger_level: territory.danger_level || "",
    warnings: territory.warnings || "",
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
        danger_level: formData.danger_level || null,
        warnings: formData.warnings.trim() || null,
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

  const getDangerLevelIcon = () => {
    switch (formData.danger_level) {
      case "verde":
        return <CircleCheck className="h-4 w-4 text-green-500" />;
      case "amarillo":
        return <CircleAlert className="h-4 w-4 text-amber-500" />;
      case "rojo":
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
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
              <Label>Nivel de Peligrosidad</Label>
              <RadioGroup 
                className="flex gap-4"
                value={formData.danger_level} 
                onValueChange={(value) => setFormData({ ...formData, danger_level: value })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="verde" id="verde" />
                  <Label htmlFor="verde" className="flex items-center gap-1 cursor-pointer">
                    <CircleCheck className="h-4 w-4 text-green-500" /> Verde
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="amarillo" id="amarillo" />
                  <Label htmlFor="amarillo" className="flex items-center gap-1 cursor-pointer">
                    <CircleAlert className="h-4 w-4 text-amber-500" /> Amarillo
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="rojo" id="rojo" />
                  <Label htmlFor="rojo" className="flex items-center gap-1 cursor-pointer">
                    <X className="h-4 w-4 text-red-500" /> Rojo
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-warnings">Advertencias (Opcional)</Label>
              <Textarea
                id="edit-warnings"
                value={formData.warnings}
                onChange={(e) => setFormData({ ...formData, warnings: e.target.value })}
                placeholder="Ej: Muchas escaleras, pendientes pronunciadas..."
                disabled={isLoading}
                className="min-h-[100px]"
              />
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
