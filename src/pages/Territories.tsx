
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, MapPin, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { differenceInDays } from "date-fns";
import { Zone, Territory, TerritoryAssignment } from "../types/territory-types";
import EditTerritoryDialog from "../components/territories/EditTerritoryDialog";
import AssignTerritoryDialog from "../components/territories/AssignTerritoryDialog";
import TerritoryConfigDialog from "../components/territories/TerritoryConfigDialog";

const Territories = () => {
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [filteredTerritories, setFilteredTerritories] = useState<Territory[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>("all");
  const [assignments, setAssignments] = useState<TerritoryAssignment[]>([]);
  const [newTerritory, setNewTerritory] = useState({
    name: "",
    zone_id: "",
    google_maps_link: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchZones = async () => {
    const { data, error } = await supabase
      .from("zones")
      .select("id, name")
      .order("name");

    if (error) {
      toast.error("Error al cargar zonas");
      console.error("Error al cargar zonas:", error);
      return;
    }

    setZones(data || []);
  };

  const fetchTerritories = async () => {
    const { data, error } = await supabase
      .from("territories")
      .select(`
        *,
        zone:zone_id (
          name
        )
      `)
      .order("name");

    if (error) {
      toast.error("Error al cargar territorios");
      console.error("Error al cargar territorios:", error);
      return;
    }

    const formattedData = data.map((item: any) => ({
      ...item,
      zone: item.zone
    }));

    setTerritories(formattedData);
    setFilteredTerritories(formattedData);
  };

  const fetchAssignments = async () => {
    const { data, error } = await supabase
      .from("assigned_territories")
      .select(`
        *,
        publisher:publisher_id (
          name
        )
      `)
      .is("status", "assigned");

    if (error) {
      toast.error("Error al cargar asignaciones");
      console.error("Error al cargar asignaciones:", error);
      return;
    }

    setAssignments(data || []);
  };

  const fetchAllData = () => {
    fetchZones();
    fetchTerritories();
    fetchAssignments();
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (selectedZone === "all") {
      setFilteredTerritories(territories);
    } else {
      setFilteredTerritories(
        territories.filter((territory) => territory.zone_id === selectedZone)
      );
    }
  }, [selectedZone, territories]);

  const handleCreateTerritory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTerritory.name.trim()) return;

    setIsLoading(true);
    const { error } = await supabase
      .from("territories")
      .insert([
        {
          name: newTerritory.name.trim(),
          zone_id: newTerritory.zone_id || null,
          google_maps_link: newTerritory.google_maps_link?.trim() || null,
        },
      ])
      .select()
      .single();

    if (error) {
      toast.error("Error al crear el territorio");
      console.error("Error al crear el territorio:", error);
    } else {
      toast.success("Territorio creado exitosamente");
      setNewTerritory({ name: "", zone_id: "", google_maps_link: "" });
      fetchTerritories();
    }
    setIsLoading(false);
  };

  const handleDeleteTerritory = async (id: string) => {
    const { error } = await supabase.from("territories").delete().eq("id", id);

    if (error) {
      toast.error("Error al eliminar el territorio");
      console.error("Error al eliminar el territorio:", error);
    } else {
      toast.success("Territorio eliminado exitosamente");
      fetchAllData();
    }
  };

  const getAssignment = (territoryId: string) => {
    return assignments.find((a) => a.territory_id === territoryId);
  };

  const getDaysRemaining = (dueDate: string | null) => {
    if (!dueDate) return null;
    
    const now = new Date();
    const due = new Date(dueDate);
    const days = differenceInDays(due, now);
    
    return days >= 0 ? days : 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Territorios</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona los territorios y su asignación a zonas.
          </p>
        </div>
        <TerritoryConfigDialog />
      </div>

      <div className="max-w-xs">
        <Label htmlFor="zone-filter">Filtrar por Zona</Label>
        <Select
          value={selectedZone}
          onValueChange={(value) => setSelectedZone(value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona una zona" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las zonas</SelectItem>
            {zones.map((zone) => (
              <SelectItem key={zone.id} value={zone.id}>
                {zone.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <form onSubmit={handleCreateTerritory} className="flex gap-4 items-end max-w-md">
        <div className="flex-1 space-y-2">
          <Label htmlFor="name">Nombre del Territorio</Label>
          <Input
            type="text"
            id="name"
            placeholder="Nombre del territorio"
            value={newTerritory.name}
            onChange={(e) =>
              setNewTerritory({ ...newTerritory, name: e.target.value })
            }
            disabled={isLoading}
          />
        </div>

        <div className="flex-1 space-y-2">
          <Label htmlFor="zone">Zona</Label>
          <Select
            onValueChange={(value) =>
              setNewTerritory({ ...newTerritory, zone_id: value })
            }
          >
            <SelectTrigger className="w-[180px]">
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

        <div className="flex-1 space-y-2">
          <Label htmlFor="googleMapsLink">Link de Google Maps (Opcional)</Label>
          <Input
            type="text"
            id="googleMapsLink"
            placeholder="Enlace de Google Maps"
            value={newTerritory.google_maps_link}
            onChange={(e) =>
              setNewTerritory({ ...newTerritory, google_maps_link: e.target.value })
            }
            disabled={isLoading}
          />
        </div>

        <Button type="submit" disabled={isLoading}>
          <Plus className="mr-2 h-4 w-4" />
          Crear Territorio
        </Button>
      </form>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre del Territorio</TableHead>
              <TableHead>Zona</TableHead>
              <TableHead>Asignado a</TableHead>
              <TableHead>Días restantes</TableHead>
              <TableHead className="w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTerritories.map((territory) => {
              const assignment = getAssignment(territory.id);
              const daysRemaining = assignment ? getDaysRemaining(assignment.due_at) : null;
              
              return (
                <TableRow key={territory.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {territory.name}
                      {territory.google_maps_link && (
                        <a 
                          href={territory.google_maps_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <MapPin className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{territory.zone?.name || "Sin Zona"}</TableCell>
                  <TableCell>{assignment?.publisher?.name || "-"}</TableCell>
                  <TableCell>
                    {daysRemaining !== null ? (
                      <span className={`${daysRemaining <= 5 ? 'text-red-500 font-medium' : ''}`}>
                        {daysRemaining} días
                      </span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <EditTerritoryDialog 
                        territory={territory} 
                        zones={zones} 
                        onUpdate={fetchAllData}
                      />
                      
                      {!assignment && (
                        <AssignTerritoryDialog 
                          territory={territory} 
                          onAssign={fetchAllData}
                        />
                      )}
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción eliminará permanentemente el territorio "{territory.name}".
                              {assignment && " Este territorio está actualmente asignado a un publicador."}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteTerritory(territory.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Territories;
