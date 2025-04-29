
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit2 } from "lucide-react";
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

interface PublisherRole {
  id: string;
  name: string;
  max_territories: number;
}

const PublisherRoles = () => {
  const [roles, setRoles] = useState<PublisherRole[]>([]);
  const [newRoleName, setNewRoleName] = useState("");
  const [newMaxTerritories, setNewMaxTerritories] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editMaxTerritories, setEditMaxTerritories] = useState<number>(1);

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
      .insert([{ name: newRoleName.trim(), max_territories: newMaxTerritories }]);

    if (error) {
      toast.error("Error al crear el rol");
    } else {
      toast.success("Rol creado exitosamente");
      setNewRoleName("");
      setNewMaxTerritories(1);
      fetchRoles();
    }
    setIsLoading(false);
  };

  const startEditing = (role: PublisherRole) => {
    setEditingRole(role.id);
    setEditMaxTerritories(role.max_territories);
  };

  const saveMaxTerritories = async (roleId: string) => {
    const { error } = await supabase
      .from("publisher_roles")
      .update({ max_territories: editMaxTerritories })
      .eq("id", roleId);

    if (error) {
      toast.error("Error al actualizar el límite de territorios");
    } else {
      toast.success("Límite de territorios actualizado");
      fetchRoles();
      setEditingRole(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Roles de Publicadores</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona los roles disponibles para los publicadores y sus límites de territorios.
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
        <div className="w-32">
          <p className="text-sm mb-2">Máx. Territorios</p>
          <Input
            type="number"
            min="1"
            value={newMaxTerritories}
            onChange={(e) => setNewMaxTerritories(parseInt(e.target.value) || 1)}
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
              <TableHead>Máx. Territorios</TableHead>
              <TableHead className="w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell>{role.name}</TableCell>
                <TableCell>
                  {editingRole === role.id ? (
                    <Input
                      type="number"
                      min="1"
                      value={editMaxTerritories}
                      onChange={(e) => setEditMaxTerritories(parseInt(e.target.value) || 1)}
                      className="w-20"
                    />
                  ) : (
                    role.max_territories
                  )}
                </TableCell>
                <TableCell>
                  {editingRole === role.id ? (
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        onClick={() => saveMaxTerritories(role.id)}
                      >
                        Guardar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setEditingRole(null)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEditing(role)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PublisherRoles;
