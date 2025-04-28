
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

interface PublisherRole {
  id: string;
  name: string;
}

interface Publisher {
  id: string;
  name: string;
  role_id: string;
  publisher_roles?: PublisherRole;
}

const Publishers = () => {
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [roles, setRoles] = useState<PublisherRole[]>([]);
  const [newPublisher, setNewPublisher] = useState({ name: "", role_id: "" });
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    // Cargar roles
    const { data: rolesData } = await supabase
      .from("publisher_roles")
      .select("*")
      .order("name");

    if (rolesData) {
      setRoles(rolesData);
    }

    // Cargar publicadores con sus roles
    const { data: publishersData } = await supabase
      .from("publishers")
      .select(`
        *,
        publisher_roles (
          id,
          name
        )
      `)
      .order("name");

    if (publishersData) {
      setPublishers(publishersData);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreatePublisher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPublisher.name.trim() || !newPublisher.role_id) {
      toast.error("Por favor complete todos los campos");
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.from("publishers").insert([
      {
        name: newPublisher.name.trim(),
        role_id: newPublisher.role_id,
      },
    ]);

    if (error) {
      toast.error("Error al crear el publicador");
    } else {
      toast.success("Publicador creado exitosamente");
      setNewPublisher({ name: "", role_id: "" });
      fetchData();
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Publicadores</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona los publicadores y sus roles asignados.
        </p>
      </div>

      <form onSubmit={handleCreatePublisher} className="flex gap-4 items-end max-w-2xl">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Nombre del publicador"
            value={newPublisher.name}
            onChange={(e) => setNewPublisher({ ...newPublisher, name: e.target.value })}
            disabled={isLoading}
          />
        </div>
        <div className="w-64">
          <Select
            value={newPublisher.role_id}
            onValueChange={(value) => setNewPublisher({ ...newPublisher, role_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar rol" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={isLoading}>
          <Plus className="mr-2 h-4 w-4" />
          Crear Publicador
        </Button>
      </form>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Rol</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {publishers.map((publisher) => (
              <TableRow key={publisher.id}>
                <TableCell>{publisher.name}</TableCell>
                <TableCell>{publisher.publisher_roles?.name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Publishers;
