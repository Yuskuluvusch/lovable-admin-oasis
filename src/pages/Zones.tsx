
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
import { toast } from "sonner";

type Zone = {
  id: string;
  name: string;
};

const Zones = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [newZoneName, setNewZoneName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
            </TableRow>
          </TableHeader>
          <TableBody>
            {zones.map((zone) => (
              <TableRow key={zone.id}>
                <TableCell>{zone.name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Zones;
