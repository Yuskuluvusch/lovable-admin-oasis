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
    const { data, error } = await supabase
      .from("territories")
      .select(`
        id,
        name,
        zone_id,
        google_maps_link,
        created_at,
        updated_at,
        zones:zone_id(name)
      `)
      .order("name");
    
    if (error) {
      toast.error("Error al cargar territorios");
      console.error(error);
      return;
    }
    
    const transformedData: Territory[] = (data || []).map(item => ({
      id: item.id,
      name: item.name,
      zone_id: item.zone_id,
      google_maps_link: item.google_maps_link,
      created_at: item.created_at,
      updated_at: item.updated_at,
      zone: item.zones ? { name: item.zones.name } : undefined
    }));
    
    setTerritories(transformedData);
  };

  const fetchAssignments = async () => {
    const { data, error } = await supabase
      .from("assigned_territories")
      .select(`
        id,
        territory_id,
        publisher_id,
        assigned_at,
        expires_at,
        status,
        token,
        publishers:publisher_id(name)
      `)
      .eq("status", "assigned");
    
    if (error) {
      toast.error("Error al cargar asignaciones");
      console.error(error);
      return;
    }
    
    const transformedData: TerritoryAssignment[] = (data || []).map(item => ({
      id: item.id,
      territory_id: item.territory_id,
      publisher_id: item.publisher_id,
      assigned_at: item.assigned_at,
      expires_at: item.expires_at,
      status: item.status,
      token: item.token,
      publisher: item.publishers ? { name: item.publishers.name } : undefined
    }));
    
    setAssignments(transformedData);
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Territorios</h1>
          <p className="text-muted-foreground mt-2">Gestiona territorios y asignaciones.</p>
        </div>
        <TerritoryConfigDialog />
      </div>

      <div className="max-w-xs">
        <Label>Filtrar por Zona</Label>
        <Select value={selectedZone} onValueChange={setSelectedZone}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona una zona" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las zonas</SelectItem>
            {zones.map((zone) => (
              <SelectItem key={zone.id} value={zone.id}>{zone.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <form onSubmit={handleCreate} className="flex gap-4 items-end max-w-4xl">
        <div className="flex-1 space-y-2">
          <Label>Nombre del Territorio</Label>
          <Input value={newTerritory.name} onChange={(e) => setNewTerritory({ ...newTerritory, name: e.target.value })} disabled={isLoading} />
        </div>

        <div className="flex-1 space-y-2">
          <Label>Zona</Label>
          <Select onValueChange={(value) => setNewTerritory({ ...newTerritory, zone_id: value })}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona una zona" />
            </SelectTrigger>
            <SelectContent>
              {zones.map((zone) => (
                <SelectItem key={zone.id} value={zone.id}>{zone.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 space-y-2">
          <Label>Link de Google Maps</Label>
          <Input value={newTerritory.google_maps_link} onChange={(e) => setNewTerritory({ ...newTerritory, google_maps_link: e.target.value })} disabled={isLoading} />
        </div>

        <Button type="submit" disabled={isLoading}>
          <Plus className="mr-2 h-4 w-4" /> Crear
        </Button>
      </form>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Territorio</TableHead>
              <TableHead>Zona</TableHead>
              <TableHead>Asignado a</TableHead>
              <TableHead>Días restantes</TableHead>
              <TableHead className="w-[150px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTerritories.map((territory) => {
              const assignment = getAssignment(territory.id);
              const daysRemaining = assignment?.expires_at ? getDaysRemaining(assignment.expires_at) : null;

              return (
                <TableRow key={territory.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {territory.name}
                      {territory.google_maps_link && (
                        <a href={territory.google_maps_link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                          <MapPin className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{territory.zone?.name || "Sin Zona"}</TableCell>
                  <TableCell>{assignment?.publisher?.name || "-"}</TableCell>
                  <TableCell>{daysRemaining !== null ? daysRemaining + " días" : "-"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <EditTerritoryDialog territory={territory} zones={zones} onUpdate={fetchAll} />
                      {!assignment && <AssignTerritoryDialog territory={territory} onAssign={fetchAll} />}
                      {assignment && assignment.token && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => copyPublicLink(assignment.token)}
                          title="Copiar enlace público"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar?</AlertDialogTitle>
                            <AlertDialogDescription>Esta acción eliminará el territorio.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(territory.id)} className="bg-red-600 hover:bg-red-700">
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
