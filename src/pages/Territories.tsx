
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
import { Plus, MapPin } from "lucide-react";
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

type Zone = {
  id: string;
  name: string;
};

type Territory = {
  id: string;
  name: string;
  zone_id: string | null;
  google_maps_link: string | null;
  created_at: string;
  updated_at: string;
  zone?: {
    name: string;
  };
};

const Territories = () => {
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [filteredTerritories, setFilteredTerritories] = useState<Territory[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>("all");
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

  useEffect(() => {
    fetchZones();
    fetchTerritories();
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Territorios</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona los territorios y su asignación a zonas.
        </p>
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTerritories.map((territory) => (
              <TableRow key={territory.id}>
                <TableCell>{territory.name}</TableCell>
                <TableCell>{territory.zone?.name || "Sin Zona"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Territories;
