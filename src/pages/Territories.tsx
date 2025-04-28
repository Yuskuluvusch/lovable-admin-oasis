
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Territory {
  id: string;
  name: string;
  google_maps_link: string;
  zone_id: string;
  zones?: {
    name: string;
  };
}

interface Zone {
  id: string;
  name: string;
}

const Territories = () => {
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [newTerritory, setNewTerritory] = useState({
    name: "",
    google_maps_link: "",
    zone_id: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    // Cargar zonas
    const { data: zonesData, error: zonesError } = await supabase
      .from("zones")
      .select("*")
      .order("name");

    if (zonesError) {
      console.error("Error al cargar zonas:", zonesError);
      toast.error("Error al cargar zonas");
    } else {
      setZones(zonesData || []);
    }

    // Cargar territorios con sus zonas
    const { data: territoriesData, error: territoriesError } = await supabase
      .from("territories")
      .select(`
        *,
        zones (
          name
        )
      `)
      .order("name");

    if (territoriesError) {
      console.error("Error al cargar territorios:", territoriesError);
      toast.error("Error al cargar territorios");
    } else {
      setTerritories(territoriesData || []);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTerritory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTerritory.name.trim() || !newTerritory.google_maps_link.trim() || !newTerritory.zone_id) {
      toast.error("Por favor complete todos los campos");
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.from("territories").insert([{
      name: newTerritory.name.trim(),
      google_maps_link: newTerritory.google_maps_link.trim(),
      zone_id: newTerritory.zone_id,
    }]);

    if (error) {
      toast.error("Error al crear el territorio");
      console.error("Error al crear el territorio:", error);
    } else {
      toast.success("Territorio creado exitosamente");
      setNewTerritory({ name: "", google_maps_link: "", zone_id: "" });
      fetchData();
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Territorios</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona los territorios y sus mapas asociados.
        </p>
      </div>

      <form onSubmit={handleCreateTerritory} className="space-y-4 max-w-2xl">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              type="text"
              placeholder="Nombre del territorio"
              value={newTerritory.name}
              onChange={(e) => setNewTerritory({ ...newTerritory, name: e.target.value })}
              disabled={isLoading}
            />
          </div>
          <div>
            <Input
              type="url"
              placeholder="Enlace de Google My Maps"
              value={newTerritory.google_maps_link}
              onChange={(e) => setNewTerritory({ ...newTerritory, google_maps_link: e.target.value })}
              disabled={isLoading}
            />
          </div>
        </div>
        <div className="flex gap-4">
          <div className="w-64">
            <Select
              value={newTerritory.zone_id}
              onValueChange={(value) => setNewTerritory({ ...newTerritory, zone_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar zona" />
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
          <Button type="submit" disabled={isLoading}>
            <Plus className="mr-2 h-4 w-4" />
            Crear Territorio
          </Button>
        </div>
      </form>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Zona</TableHead>
              <TableHead>Enlace del Mapa</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {territories.map((territory) => (
              <TableRow key={territory.id}>
                <TableCell>{territory.name}</TableCell>
                <TableCell>{territory.zones?.name}</TableCell>
                <TableCell>
                  <a 
                    href={territory.google_maps_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Ver mapa
                  </a>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Territories;
