
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
import { Edit } from "lucide-react";
import { Zone, Territory } from "../../types/territory-types";
import TerritoryForm from "./TerritoryForm";
import { useEditTerritory } from "@/hooks/useEditTerritory";

interface EditTerritoryDialogProps {
  territory: Territory;
  zones: Zone[];
  onUpdate: () => void;
}

const EditTerritoryDialog = ({ territory, zones, onUpdate }: EditTerritoryDialogProps) => {
  const [open, setOpen] = useState(false);
  const { formData, isLoading, handleFormChange, handleSubmit } = useEditTerritory(territory, () => {
    onUpdate();
    setOpen(false);
  });

  const handleFormSubmit = async (e: React.FormEvent) => {
    const success = await handleSubmit(e);
    if (success) {
      setOpen(false);
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
        <TerritoryForm
          formData={formData}
          zones={zones}
          isLoading={isLoading}
          onFormChange={handleFormChange}
          onSubmit={handleFormSubmit}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditTerritoryDialog;
