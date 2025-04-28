
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, MapPin, Trash2, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { differenceInDays } from "date-fns";
import { Zone, Territory, TerritoryAssignment } from "../types/territory-types";
import EditTerritoryDialog from "../components/territories/EditTerritoryDialog";
import AssignTerritoryDialog from "../components/territories/AssignTerritoryDialog";
import TerritoryConfigDialog from "../components/territories/TerritoryConfigDialog";

const Territories = () => {
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [assignments, setAssignments] = useState<TerritoryAssignment[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>("all");
  const [newTerritory, setNewTerritory] = useState({ name: "", zone_id: "", google_maps_link: "" });
  const [isLoading, setIsLoading] = useState(false);

  const fetchZones = async () => {
    const { data, error } = await supabase.from("zones").select("id, name").order("name");
    if (error) {
      toast.error("Error al cargar zonas");
      console.error(error);
      return;
    }
    setZones(data || []);
  };

  const fetchTerritories = async () => {
    try {
      const { data, error } = await supabase
        .from("territories")
        .select(`
          id, name, zone_id, google_maps_link, created_at, updated_at,
          zone:zone_id(id, name)
        `)
        .order("name");

      if (error) {
        toast.error("Error al cargar territorios");
        console.error(error);
        return;
      }

      // Transform the data to match our Territory type
      const transformedData = (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        zone_id: item.zone_id,
        google_maps_link: item.google_maps_link,
        created_at: item.created_at,
        updated_at: item.updated_at,
        zone: item.zone ? { id: item.zone.id, name: item.zone.name } : undefined,
      }));

      setTerritories(transformedData);
    } catch (err) {
      console.error("Error in fetchTerritories:", err);
      toast.error("Error al cargar territorios");
    }
  };

  const fetchAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from("assigned_territories")
        .select(`
          id, territory_id, publisher_id, assigned_at, expires_at, status, token,
          publisher:publisher_id(name)
        `)
        .eq("status", "assigned");

      if (error) {
        toast.error("Error al cargar asignaciones");
        console.error(error);
        return;
      }

      // Transform the data to match our TerritoryAssignment type
      const transformedData = (data || []).map((item: any) => ({
        id: item.id,
        territory_id: item.territory_id,
        publisher_id: item.publisher_id,
        assigned_at: item.assigned_at,
        expires_at: item.expires_at,
        status: item.status,
        token: item.token,
        publisher: item.publisher ? { name: item.publisher.name } : undefined,
      }));

      setAssignments(transformedData);
    } catch (err) {
      console.error("Error in fetchAssignments:", err);
      toast.error("Error al cargar asignaciones");
    }
  };

  const fetchAll = () => {
    fetchZones();
    fetchTerritories();
    fetchAssignments();
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const filteredTerritories = selectedZone === "all"
    ? territories
    : territories.filter((t) => t.zone_id === selectedZone);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTerritory.name.trim()) return;

    setIsLoading(true);
    const { error } = await supabase.from("territories").insert([{ ...newTerritory }]);
    if (error) {
      toast.error("Error al crear territorio");
      console.error(error);
    } else {
      toast.success("Territorio creado");
      setNewTerritory({ name: "", zone_id: "", google_maps_link: "" });
      fetchTerritories();
    }
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("territories").delete().eq("id", id);
    if (error) {
      toast.error("Error al eliminar territorio");
      console.error(error);
    } else {
      toast.success("Territorio eliminado");
      fetchAll();
    }
  };

  const getAssignment = (territoryId: string) => assignments.find((a) => a.territory_id === territoryId);

  const getDaysRemaining = (expireDate: string | null) => expireDate ? Math.max(differenceInDays(new Date(expireDate), new Date()), 0) : null;

  const copyPublicLink = (token: string) => {
    const link = `${window.location.origin}/territorio/${token}`;
    navigator.clipboard.writeText(link);
    toast.success("Enlace copiado al portapapeles");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Territorios</h1>
          <p className="text-muted-foreground">
            Administra y asigna territorios a los publicadores.
          </p>
        </div>
        <TerritoryConfigDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="flex flex-col sm:flex-row gap-2 items-end mb-4">
            <div className="w-full sm:w-48">
              <Label htmlFor="zone-filter">Filtrar por zona</Label>
              <Select
                value={selectedZone}
                onValueChange={setSelectedZone}
              >
                <SelectTrigger id="zone-filter">
                  <SelectValue placeholder="Todas las zonas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las zonas</SelectItem>
                  {zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>{zone.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Zona</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTerritories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No hay territorios disponibles
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTerritories.map((territory) => {
                    const assignment = getAssignment(territory.id);
                    const isAssigned = !!assignment;
                    const daysRemaining = isAssigned && assignment.expires_at ? getDaysRemaining(assignment.expires_at) : null;
                    const isExpired = isAssigned && daysRemaining === 0;

                    return (
                      <TableRow key={territory.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin size={16} className="text-muted-foreground" />
                            <span>{territory.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{territory.zone?.name || "Sin zona"}</TableCell>
                        <TableCell>
                          {isAssigned ? (
                            <div className="flex flex-col">
                              <span className={`text-sm ${isExpired ? "text-destructive" : "text-green-600"}`}>
                                {isExpired ? "Expirado" : "Asignado"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {assignment.publisher?.name}
                                {daysRemaining !== null && !isExpired && ` (${daysRemaining} días)`}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-amber-600">Disponible</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <EditTerritoryDialog territory={territory} zones={zones} onUpdate={fetchTerritories} />
                            
                            {!isAssigned ? (
                              <AssignTerritoryDialog territory={territory} onAssign={fetchAll} />
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => copyPublicLink(assignment.token)}
                                title="Copiar enlace"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            )}
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar territorio?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción no se puede deshacer. Se eliminará el territorio permanentemente.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction 
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() => handleDelete(territory.id)}
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
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="border rounded-md p-4">
          <h2 className="text-lg font-semibold mb-4">Nuevo Territorio</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="territory-name">Nombre</Label>
              <Input
                id="territory-name"
                value={newTerritory.name}
                onChange={(e) => setNewTerritory({ ...newTerritory, name: e.target.value })}
                placeholder="Nombre del territorio"
                disabled={isLoading}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="territory-zone">Zona (opcional)</Label>
              <Select
                value={newTerritory.zone_id}
                onValueChange={(value) => setNewTerritory({ ...newTerritory, zone_id: value })}
                disabled={isLoading}
              >
                <SelectTrigger id="territory-zone">
                  <SelectValue placeholder="Seleccionar zona" />
                </SelectTrigger>
                <SelectContent>
                  {zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>{zone.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="territory-google-maps">
                Link de Google Maps (opcional)
              </Label>
              <Input
                id="territory-google-maps"
                value={newTerritory.google_maps_link}
                onChange={(e) => setNewTerritory({ ...newTerritory, google_maps_link: e.target.value })}
                placeholder="https://www.google.com/maps/..."
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Para compartir un mapa, ábrelo en Google Maps, haz clic en "Compartir" y copia el enlace de "Incorporar un mapa".
              </p>
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              <Plus className="mr-2 h-4 w-4" />
              Crear Territorio
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Territories;
