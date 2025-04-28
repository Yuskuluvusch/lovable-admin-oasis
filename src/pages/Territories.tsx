
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
      {/* Tu render de territorios y tabla, como ya tenías */}
    </div>
  );
};

export default Territories;
