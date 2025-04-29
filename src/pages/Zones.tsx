
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

type Zone = {
  id: string;
  name: string;
};

// Esquema de validación para el formulario de edición de zona
const zoneSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
});

type ZoneFormValues = z.infer<typeof zoneSchema>;

const Zones = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [newZoneName, setNewZoneName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [zoneToDelete, setZoneToDelete] = useState<Zone | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Configurar el formulario con React Hook Form
  const form = useForm<ZoneFormValues>({
    resolver: zodResolver(zoneSchema),
    defaultValues: {
      name: "",
    },
  });

  const fetchZones = async () => {
    const { data, error } = await supabase
      .from("zones")
      .select("*")
      .order("name");

    if (error) {
      toast.error("Error al cargar zonas");
      console.error("Error al cargar zonas:", error);
      return;
    }

    setZones(data || []);
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneName.trim()) return;

    setIsLoading(true);
    const { error } = await supabase
      .from("zones")
      .insert([{ name: newZoneName.trim() }]);

    if (error) {
      toast.error("Error al crear la zona");
      console.error("Error al crear la zona:", error);
    } else {
      toast.success("Zona creada exitosamente");
      setNewZoneName("");
      fetchZones();
    }
    setIsLoading(false);
  };

  // Abrir el diálogo de edición
  const handleOpenEditDialog = (zone: Zone) => {
    setEditingZone(zone);
    form.reset({ name: zone.name });
    setIsEditDialogOpen(true);
  };

  // Guardar los cambios en la zona
  const handleSaveZoneEdit = async (values: ZoneFormValues) => {
    if (!editingZone) return;

    setIsLoading(true);
    const { error } = await supabase
      .from("zones")
      .update({ name: values.name.trim() })
      .eq("id", editingZone.id);

    if (error) {
      toast.error("Error al actualizar la zona");
      console.error("Error al actualizar la zona:", error);
    } else {
      toast.success("Zona actualizada exitosamente");
      setIsEditDialogOpen(false);
      fetchZones();
    }
    setIsLoading(false);
  };

  // Abrir el diálogo de confirmación de eliminación
  const handleOpenDeleteDialog = async (zone: Zone) => {
    setDeleteError(null);
    
    // Verificar si la zona tiene territorios asociados
    const { data, error } = await supabase
      .from("territories")
      .select("id")
      .eq("zone_id", zone.id)
      .limit(1);
    
    if (error) {
      toast.error("Error al verificar territorios asociados");
      console.error("Error al verificar territorios asociados:", error);
      return;
    }
    
    setZoneToDelete(zone);
    
    if (data && data.length > 0) {
      setDeleteError("No se puede eliminar esta zona porque tiene territorios asociados. Reasigne o elimine los territorios primero.");
    }
    
    setIsDeleteDialogOpen(true);
  };

  // Eliminar la zona
  const handleDeleteZone = async () => {
    if (!zoneToDelete || deleteError) return;

    setIsLoading(true);
    const { error } = await supabase
      .from("zones")
      .delete()
      .eq("id", zoneToDelete.id);

    if (error) {
      toast.error("Error al eliminar la zona");
      console.error("Error al eliminar la zona:", error);
    } else {
      toast.success("Zona eliminada exitosamente");
      setIsDeleteDialogOpen(false);
      fetchZones();
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Zonas</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona las zonas para organizar los territorios.
        </p>
      </div>

      <form onSubmit={handleCreateZone} className="flex gap-4 items-end max-w-md">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Nombre de la zona"
            value={newZoneName}
            onChange={(e) => setNewZoneName(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <Button type="submit" disabled={isLoading}>
          <Plus className="mr-2 h-4 w-4" />
          Crear Zona
        </Button>
      </form>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre de la Zona</TableHead>
              <TableHead className="w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {zones.map((zone) => (
              <TableRow key={zone.id}>
                <TableCell>{zone.name}</TableCell>
                <TableCell className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEditDialog(zone)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenDeleteDialog(zone)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Diálogo de edición */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Zona</DialogTitle>
            <DialogDescription>
              Actualiza el nombre de la zona seleccionada.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSaveZoneEdit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la zona</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isLoading} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  Guardar cambios
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteError ? "No se puede eliminar" : "¿Estás seguro?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteError || 
                `Esta acción eliminará permanentemente la zona "${zoneToDelete?.name}". 
                Esta acción no se puede deshacer.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            {!deleteError && (
              <AlertDialogAction 
                onClick={handleDeleteZone} 
                disabled={isLoading}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Zones;
