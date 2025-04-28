
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

const PublisherRoles = () => {
  const [roles, setRoles] = useState<Array<{ id: string; name: string }>>([]);
  const [newRoleName, setNewRoleName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchRoles = async () => {
    const { data, error } = await supabase
      .from("publisher_roles")
      .select("*")
      .order("name");

    if (error) {
      toast.error("Error al cargar roles");
      return;
    }

    setRoles(data);
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    setIsLoading(true);
    const { error } = await supabase
      .from("publisher_roles")
      .insert([{ name: newRoleName.trim() }]);

    if (error) {
      toast.error("Error al crear el rol");
    } else {
      toast.success("Rol creado exitosamente");
      setNewRoleName("");
      fetchRoles();
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Roles de Publicadores</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona los roles disponibles para los publicadores.
        </p>
      </div>

      <form onSubmit={handleCreateRole} className="flex gap-4 items-end max-w-md">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Nombre del rol"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <Button type="submit" disabled={isLoading}>
          <Plus className="mr-2 h-4 w-4" />
          Crear Rol
        </Button>
      </form>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre del Rol</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell>{role.name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PublisherRoles;
