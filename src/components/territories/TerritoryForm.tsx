
import React from "react";
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
import { CircleCheck, CircleAlert, X } from "lucide-react";
import { Zone, Territory } from "../../types/territory-types";
import { Button } from "@/components/ui/button";

export interface TerritoryFormData {
  name: string;
  zone_id: string;
  google_maps_link: string;
  danger_level: string;
  warnings: string;
}

interface TerritoryFormProps {
  formData: TerritoryFormData;
  zones: Zone[];
  isLoading: boolean;
  onFormChange: (data: Partial<TerritoryFormData>) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

const TerritoryForm = ({
  formData,
  zones,
  isLoading,
  onFormChange,
  onSubmit,
}: TerritoryFormProps) => {
  return (
    <form onSubmit={onSubmit}>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="edit-name">Nombre del Territorio</Label>
          <Input
            id="edit-name"
            value={formData.name}
            onChange={(e) => onFormChange({ name: e.target.value })}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-zone">Zona</Label>
          <Select
            value={formData.zone_id}
            onValueChange={(value) => onFormChange({ zone_id: value })}
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
              <SelectItem value="no_zone">Sin zona asignada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Nivel de Peligrosidad</Label>
          <RadioGroup 
            className="flex gap-4"
            value={formData.danger_level} 
            onValueChange={(value) => onFormChange({ danger_level: value })}
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
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="" id="none" />
              <Label htmlFor="none" className="flex items-center gap-1 cursor-pointer">
                Sin valor
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-warnings">Advertencias (Opcional)</Label>
          <Textarea
            id="edit-warnings"
            value={formData.warnings}
            onChange={(e) => onFormChange({ warnings: e.target.value })}
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
            onChange={(e) => onFormChange({ google_maps_link: e.target.value })}
            disabled={isLoading}
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          Guardar cambios
        </Button>
      </div>
    </form>
  );
};

export default TerritoryForm;
