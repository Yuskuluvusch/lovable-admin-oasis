
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { Pencil, Trash, Plus, User, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, adminAuthClient } from "@/integrations/supabase/client";

interface Admin {
  id: string;
  name: string;
  email: string;
  role: string;
  auth_id: string;
}

const Administrators = () => {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [newAdmin, setNewAdmin] = useState<Partial<Admin> & { password?: string }>({
    name: "",
    email: "",
    password: "",
    role: "admin",
  });
  const [adminToDelete, setAdminToDelete] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from("administrators")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching admins:", error);
        throw error;
      }
      
      console.log("Fetched administrators:", data);
      setAdmins(data || []);
    } catch (error: any) {
      console.error("Error fetching admins:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los administradores: " + error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor complete todos los campos",
      });
      return;
    }

    try {
      setIsCreating(true);
      
      console.log("Creating new admin with email:", newAdmin.email);
      
      // 1. Create the auth user using the admin client with service role key
      const createUserResponse = await adminAuthClient.auth.admin.createUser({
        email: newAdmin.email,
        password: newAdmin.password,
        email_confirm: true
      });

      const authData = createUserResponse.data;
      const authError = createUserResponse.error;

      console.log("Auth response:", createUserResponse);
      
      if (authError) {
        console.error("Auth error:", authError);
        throw new Error(`Error de autenticación: ${authError.message}`);
      }

      if (!authData?.user) {
        throw new Error("No se pudo crear el usuario de autenticación");
      }
      
      console.log("Auth user created:", authData.user);

      // 2. Create the administrator record with auth_id
      const adminData = {
        name: newAdmin.name,
        email: newAdmin.email,
        role: "admin",
        auth_id: authData.user.id,
      };
      
      console.log("Creating admin record:", adminData);
      
      const { data, error } = await supabase
        .from("administrators")
        .insert([adminData])
        .select()
        .single();

      if (error) {
        console.error("Admin insert error:", error);
        throw error;
      }

      console.log("Admin record created:", data);
      
      // 3. Update local state and reset form
      setAdmins([...admins, data]);
      setNewAdmin({ name: "", email: "", password: "", role: "admin" });
      setIsOpen(false);

      toast({
        title: "Administrador creado",
        description: `${data.name} ha sido añadido como administrador.`,
      });
      
      // 4. Refresh the admin list to make sure we have the latest data
      fetchAdmins();
      
    } catch (error: any) {
      console.error("Error creating admin:", error);
      toast({
        variant: "destructive",
        title: "Error al crear el administrador",
        description: error.message || "No se pudo crear el administrador",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateAdmin = async () => {
    if (!editingAdmin) return;

    try {
      const { data, error } = await supabase
        .from("administrators")
        .update({
          name: editingAdmin.name,
          email: editingAdmin.email,
        })
        .eq("id", editingAdmin.id)
        .select()
        .single();

      if (error) throw error;

      setAdmins(admins.map((admin) => (admin.id === data.id ? data : admin)));
      setEditingAdmin(null);

      toast({
        title: "Administrador actualizado",
        description: `La información de ${data.name} ha sido actualizada.`,
      });
    } catch (error: any) {
      console.error("Error updating admin:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo actualizar el administrador",
      });
    }
  };

  const handleDeleteAdmin = async () => {
    if (!adminToDelete) return;

    if (adminToDelete.email === currentUser?.email) {
      toast({
        variant: "destructive",
        title: "Acción no permitida",
        description: "No puedes eliminar tu propio usuario.",
      });
      setAdminToDelete(null);
      return;
    }

    try {
      // 1. Delete the administrator record
      const { error: adminError } = await supabase
        .from("administrators")
        .delete()
        .eq("id", adminToDelete.id);

      if (adminError) throw adminError;

      // 2. Delete the auth user if auth_id exists
      if (adminToDelete.auth_id) {
        const { error: authError } = await adminAuthClient.auth.admin.deleteUser(
          adminToDelete.auth_id
        );
        if (authError) throw authError;
      }

      setAdmins(admins.filter((admin) => admin.id !== adminToDelete.id));
      toast({
        title: "Administrador eliminado",
        description: `${adminToDelete.name} ha sido eliminado del sistema.`,
      });
    } catch (error: any) {
      console.error("Error deleting admin:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo eliminar el administrador",
      });
    } finally {
      setAdminToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Administradores</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona los usuarios administradores del sistema
          </p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#0078D4] hover:bg-[#106EBE]">
              <Plus size={16} className="mr-2" /> Nuevo Administrador
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Crear administrador</DialogTitle>
              <DialogDescription>
                Añade un nuevo administrador al sistema
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  className="h-9"
                  placeholder="Nombre completo"
                  value={newAdmin.name}
                  onChange={(e) =>
                    setNewAdmin({ ...newAdmin, name: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  className="h-9"
                  placeholder="correo@ejemplo.com"
                  value={newAdmin.email}
                  onChange={(e) =>
                    setNewAdmin({ ...newAdmin, email: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  className="h-9"
                  placeholder="••••••••"
                  value={newAdmin.password}
                  onChange={(e) =>
                    setNewAdmin({ ...newAdmin, password: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleCreateAdmin}
                className="bg-[#0078D4] hover:bg-[#106EBE]"
                disabled={!newAdmin.name || !newAdmin.email || !newAdmin.password || isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  "Crear"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Cargando administradores...</span>
          </div>
        ) : admins.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-48 text-center p-6">
            <User size={48} className="text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">No hay administradores</h3>
            <p className="text-muted-foreground mt-1">
              Los administradores que agregues aparecerán aquí.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin, index) => (
                <TableRow key={admin.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">{admin.name}</TableCell>
                  <TableCell>{admin.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <User size={14} className="mr-2 text-primary" />
                      Administrador
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingAdmin(admin)}
                          >
                            <Pencil size={16} />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar administrador</DialogTitle>
                            <DialogDescription>
                              Modifica los datos del administrador
                            </DialogDescription>
                          </DialogHeader>
                          {editingAdmin && (
                            <div className="grid gap-4 py-4">
                              <div className="grid gap-2">
                                <Label htmlFor="edit-name">Nombre</Label>
                                <Input
                                  id="edit-name"
                                  value={editingAdmin.name}
                                  onChange={(e) =>
                                    setEditingAdmin({
                                      ...editingAdmin,
                                      name: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="edit-email">
                                  Correo electrónico
                                </Label>
                                <Input
                                  id="edit-email"
                                  type="email"
                                  value={editingAdmin.email}
                                  onChange={(e) =>
                                    setEditingAdmin({
                                      ...editingAdmin,
                                      email: e.target.value,
                                    })
                                  }
                                />
                              </div>
                            </div>
                          )}
                          <DialogFooter>
                            <Button onClick={handleUpdateAdmin}>Guardar</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => setAdminToDelete(admin)}
                          >
                            <Trash size={16} />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              ¿Estás seguro de eliminar este administrador?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. El administrador
                              perderá acceso al sistema inmediatamente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteAdmin}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default Administrators;
