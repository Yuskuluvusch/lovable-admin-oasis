
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, MapPin, Trash2, Copy, Unlink, Calendar, ArrowUp, ArrowDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { differenceInDays, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Zone, Territory, TerritoryAssignment } from "../types/territory-types";
import EditTerritoryDialog from "../components/territories/EditTerritoryDialog";
import AssignTerritoryDialog from "../components/territories/AssignTerritoryDialog";
import TerritoryConfigDialog from "../components/territories/TerritoryConfigDialog";

type SortField = 'name' | 'zone' | 'status' | 'last_assigned_at' | 'last_returned_at' | 'inactive_time';

const Territories = () => {
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [assignments, setAssignments] = useState<TerritoryAssignment[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>("all");
  const [newTerritory, setNewTerritory] = useState({ name: "", zone_id: "", google_maps_link: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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
          zones(id, name)
        `)
        .order("name");

      if (error) {
        toast.error("Error al cargar territorios");
        console.error(error);
        return;
      }

      const transformedTerritories = (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        zone_id: item.zone_id,
        google_maps_link: item.google_maps_link,
        created_at: item.created_at,
        updated_at: item.updated_at,
        zone: item.zones ? { id: item.zones.id, name: item.zones.name } : undefined,
        last_assigned_at: null,
        last_returned_at: null,
      }));

      // Fetch assignment history
      const { data: assignmentsHistory, error: assignmentsError } = await supabase
        .from("assigned_territories")
        .select("territory_id, assigned_at, returned_at, status")
        .order("assigned_at", { ascending: false });

      if (assignmentsError) {
        toast.error("Error al cargar historial de asignaciones");
        console.error(assignmentsError);
        setTerritories(transformedTerritories);
        return;
      }

      // Process territories with last assignment and last return dates
      const lastAssignmentMap = new Map<string, string>();
      const lastReturnMap = new Map<string, string>();

      assignmentsHistory?.forEach(assignment => {
        const territoryId = assignment.territory_id;
        
        // Track last assignment date
        if (!lastAssignmentMap.has(territoryId)) {
          lastAssignmentMap.set(territoryId, assignment.assigned_at);
        }
        
        // Track last return date
        if (assignment.returned_at && !lastReturnMap.has(territoryId)) {
          lastReturnMap.set(territoryId, assignment.returned_at);
        }
      });

      const territoriesWithHistory = transformedTerritories.map(territory => ({
        ...territory,
        last_assigned_at: lastAssignmentMap.get(territory.id) || null,
        last_returned_at: lastReturnMap.get(territory.id) || null,
      }));

      setTerritories(territoriesWithHistory);
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
          id, territory_id, publisher_id, assigned_at, expires_at, status, token, returned_at,
          publishers!assigned_territories_publisher_id_fkey(name)
        `)
        .eq("status", "assigned");

      if (error) {
        toast.error("Error al cargar asignaciones");
        console.error("Error fetching assignments:", error);
        return;
      }

      const transformedData = (data || []).map((item: any) => ({
        id: item.id,
        territory_id: item.territory_id,
        publisher_id: item.publisher_id,
        assigned_at: item.assigned_at,
        expires_at: item.expires_at,
        status: item.status,
        token: item.token,
        returned_at: item.returned_at, // Added the missing property
        publisher: item.publishers ? { name: item.publishers.name } : undefined,
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

  const toggleSortDirection = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  const handleSortClick = (field: SortField) => {
    if (sortField === field) {
      toggleSortDirection();
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortTerritories = (territories: Territory[]) => {
    return [...territories].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'zone':
          const zoneA = a.zone?.name || '';
          const zoneB = b.zone?.name || '';
          comparison = zoneA.localeCompare(zoneB);
          break;
        case 'last_assigned_at':
          if (a.last_assigned_at === null && b.last_assigned_at === null) comparison = 0;
          else if (a.last_assigned_at === null) comparison = 1;
          else if (b.last_assigned_at === null) comparison = -1;
          else comparison = (new Date(a.last_assigned_at)).getTime() - (new Date(b.last_assigned_at)).getTime();
          break;
        case 'last_returned_at':
          if (a.last_returned_at === null && b.last_returned_at === null) comparison = 0;
          else if (a.last_returned_at === null) comparison = 1;
          else if (b.last_returned_at === null) comparison = -1;
          else comparison = (new Date(a.last_returned_at)).getTime() - (new Date(b.last_returned_at)).getTime();
          break;
        case 'inactive_time':
          // Para "Más tiempo sin asignar", priorizamos territorios no asignados
          const isAssignedA = !!assignments.find(assignment => assignment.territory_id === a.id);
          const isAssignedB = !!assignments.find(assignment => assignment.territory_id === b.id);
          
          // Si uno está asignado y el otro no, el no asignado va primero
          if (isAssignedA !== isAssignedB) {
            return isAssignedA ? 1 : -1;
          }
          
          // Si ambos están libres, comparamos por última devolución
          if (!isAssignedA && !isAssignedB) {
            if (a.last_returned_at === null && b.last_returned_at === null) comparison = 0;
            else if (a.last_returned_at === null) comparison = 1;  // Sin historial va al final
            else if (b.last_returned_at === null) comparison = -1; // Sin historial va al final
            else comparison = (new Date(a.last_returned_at)).getTime() - (new Date(b.last_returned_at)).getTime();
          } else {
            // Si ambos están asignados, ordenar por orden alfabético
            comparison = a.name.localeCompare(b.name);
          }
          break;
        case 'status':
          const isAssignedStatusA = !!assignments.find(assignment => assignment.territory_id === a.id);
          const isAssignedStatusB = !!assignments.find(assignment => assignment.territory_id === b.id);
          if (isAssignedStatusA !== isAssignedStatusB) {
            return isAssignedStatusA ? -1 : 1;
          }
          if (a.last_assigned_at === null && b.last_assigned_at === null) comparison = 0;
          else if (a.last_assigned_at === null) comparison = 1;
          else if (b.last_assigned_at === null) comparison = -1;
          else comparison = (new Date(a.last_assigned_at)).getTime() - (new Date(b.last_assigned_at)).getTime();
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  const filteredTerritories = selectedZone === "all"
    ? territories
    : territories.filter((t) => t.zone_id === selectedZone);

  const sortedTerritories = sortTerritories(filteredTerritories);

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

  const handleUnassignTerritory = async (assignmentId: string) => {
    const { error } = await supabase
      .from("assigned_territories")
      .update({
        status: "returned",
        returned_at: new Date().toISOString()
      })
      .eq("id", assignmentId);
    
    if (error) {
      toast.error("Error al devolver territorio");
      console.error(error);
    } else {
      toast.success("Territorio devuelto correctamente");
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

  const formatLastAssigned = (date: string | null) => {
    if (!date) return "Nunca asignado";
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es });
  };

  const formatLastReturned = (date: string | null) => {
    if (!date) return "Sin devoluciones";
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es });
  };

  const isLongUnassigned = (territory: Territory) => {
    if (getAssignment(territory.id)) return false;
    
    // Si no hay registro de devolución, verificamos la asignación
    if (!territory.last_returned_at) {
      if (!territory.last_assigned_at) return true;
      const daysUnassigned = differenceInDays(new Date(), new Date(territory.last_assigned_at));
      return daysUnassigned > 90;
    }
    
    // Si hay registro de devolución, lo usamos para el cálculo
    const daysUnassigned = differenceInDays(new Date(), new Date(territory.last_returned_at));
    return daysUnassigned > 90; 
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Territorios</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Administra y asigna territorios a los publicadores.
          </p>
        </div>
        <TerritoryConfigDialog />
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="flex flex-col sm:flex-row gap-2 items-end mb-4">
            <div className="w-full sm:w-48">
              <Label htmlFor="zone-filter">Filtrar por zona</Label>
              <Select
                value={selectedZone}
                onValueChange={setSelectedZone}
              >
                <SelectTrigger id="zone-filter" className="w-full">
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
            
            <div className="w-full sm:w-48">
              <Label htmlFor="sort-territories">Ordenar por</Label>
              <Select
                value={sortField}
                onValueChange={(value) => handleSortClick(value as SortField)}
              >
                <SelectTrigger id="sort-territories" className="flex justify-between items-center w-full">
                  <SelectValue placeholder="Ordenar por" />
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); toggleSortDirection(); }} className="ml-2 h-5 w-5">
                    {sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                  </Button>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nombre</SelectItem>
                  <SelectItem value="zone">Zona</SelectItem>
                  <SelectItem value="status">Estado</SelectItem>
                  <SelectItem value="last_assigned_at">Última asignación</SelectItem>
                  <SelectItem value="last_returned_at">Último devuelto</SelectItem>
                  <SelectItem value="inactive_time">Más tiempo sin asignar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer whitespace-nowrap" onClick={() => handleSortClick('name')}>
                      Nombre {sortField === 'name' && (
                        sortDirection === 'asc' ? <ArrowUp className="inline h-4 w-4" /> : <ArrowDown className="inline h-4 w-4" />
                      )}
                    </TableHead>
                    <TableHead className="cursor-pointer whitespace-nowrap" onClick={() => handleSortClick('zone')}>
                      Zona {sortField === 'zone' && (
                        sortDirection === 'asc' ? <ArrowUp className="inline h-4 w-4" /> : <ArrowDown className="inline h-4 w-4" />
                      )}
                    </TableHead>
                    <TableHead className="cursor-pointer whitespace-nowrap" onClick={() => handleSortClick('status')}>
                      Estado {sortField === 'status' && (
                        sortDirection === 'asc' ? <ArrowUp className="inline h-4 w-4" /> : <ArrowDown className="inline h-4 w-4" />
                      )}
                    </TableHead>
                    <TableHead className="cursor-pointer whitespace-nowrap" onClick={() => handleSortClick('inactive_time')}>
                      Última actividad {sortField === 'inactive_time' && (
                        sortDirection === 'asc' ? <ArrowUp className="inline h-4 w-4" /> : <ArrowDown className="inline h-4 w-4" />
                      )}
                    </TableHead>
                    <TableHead className="whitespace-nowrap">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedTerritories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No hay territorios disponibles
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedTerritories.map((territory) => {
                      const assignment = getAssignment(territory.id);
                      const isAssigned = !!assignment;
                      const daysRemaining = isAssigned && assignment.expires_at ? getDaysRemaining(assignment.expires_at) : null;
                      const isExpired = isAssigned && daysRemaining === 0;
                      const longUnassigned = !isAssigned && isLongUnassigned(territory);

                      return (
                        <TableRow key={territory.id} className={longUnassigned ? "bg-amber-50" : ""}>
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
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  Asignado: {formatLastAssigned(territory.last_assigned_at)}
                                </span>
                              </div>
                              {territory.last_returned_at && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4 text-amber-600" />
                                  <span className={`text-xs ${longUnassigned ? "text-amber-600 font-medium" : "text-muted-foreground"}`}>
                                    Devuelto: {formatLastReturned(territory.last_returned_at)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <EditTerritoryDialog territory={territory} zones={zones} onUpdate={fetchTerritories} />
                              
                              {!isAssigned ? (
                                <AssignTerritoryDialog territory={territory} onAssign={fetchAll} />
                              ) : (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => copyPublicLink(assignment.token)}
                                    title="Copiar enlace"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                  
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="icon" className="text-amber-600" title="Desasignar territorio">
                                        <Unlink className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>¿Desasignar territorio?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          El territorio será desasignado del publicador {assignment.publisher?.name}. 
                                          El territorio no será eliminado y quedar�� disponible para una nueva asignación.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction 
                                          className="bg-amber-600 text-white hover:bg-amber-700"
                                          onClick={() => handleUnassignTerritory(assignment.id)}
                                        >
                                          Desasignar
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </>
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
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="territory-zone">Zona (opcional)</Label>
              <Select
                value={newTerritory.zone_id}
                onValueChange={(value) => setNewTerritory({ ...newTerritory, zone_id: value })}
                disabled={isLoading}
              >
                <SelectTrigger id="territory-zone" className="w-full">
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
                className="w-full"
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
