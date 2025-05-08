
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Territory } from "../types/territory-types";
import { TerritoryFormData } from "../components/territories/TerritoryForm";

export function useEditTerritory(territory: Territory, onUpdate: () => void) {
  const [formData, setFormData] = useState<TerritoryFormData>({
    name: territory.name,
    zone_id: territory.zone_id || "",
    google_maps_link: territory.google_maps_link || "",
    danger_level: territory.danger_level || "",
    warnings: territory.warnings || "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleFormChange = (data: Partial<TerritoryFormData>) => {
    setFormData({ ...formData, ...data });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase
      .from("territories")
      .update({
        name: formData.name.trim(),
        zone_id: formData.zone_id === "no_zone" ? null : (formData.zone_id || null),
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
      return true;
    }

    setIsLoading(false);
    return false;
  };

  return {
    formData,
    isLoading,
    handleFormChange,
    handleSubmit,
  };
}
