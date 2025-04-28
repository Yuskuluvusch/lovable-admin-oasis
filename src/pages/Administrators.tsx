
import React, { useState } from "react";
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
import { Pencil, Trash, Plus, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Admin {
  id: string;
  name: string;
  email: string;
  role: string;
}

const Administrators = () => {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [admins, setAdmins] = useState<Admin[]>([
    {
      id: "1",
      name: "Admin Usuario",
      email: "admin@example.com",
      role: "admin",
    },
    {
      id: "2",
      name: "Gerente Sistema",
      email: "gerente@example.com",
      role: "admin",
    },
  ]);

  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [newAdmin, setNewAdmin] = useState<Partial<Admin>>({
    name: "",
    email: "",
    role: "admin",
  });
  const [adminToDelete, setAdminToDelete] = useState<Admin | null>(null);

  const handleCreateAdmin = () => {
    if (!newAdmin.name || !newAdmin.email) return;

    const admin: Admin = {
      id: Date.now().toString(),
      name: newAdmin.name,
      email: newAdmin.email,
      role: "admin",
    };

    setAdmins([...admins, admin]);
    setNewAdmin({ name: "", email: "", role: "admin" });

    toast({
      title: "Administrador creado",
      description: `${admin.name} ha sido añadido como administrador.`,
    });
  };

  const handleUpdateAdmin = () => {
    if (!editingAdmin) return;

    setAdmins(
      admins.map((admin) =>
        admin.id === editingAdmin.id ? editingAdmin : admin
      )
    );

    toast({
      title: "Administrador actualizado",
      description: `La información de ${editingAdmin.name} ha sido actualizada.`,
    });

    setEditingAdmin(null);
  };

  const handleDeleteAdmin = () => {
    if (!adminToDelete) return;
    
    // Prevent deleting yourself
    if (adminToDelete.id === currentUser?.id) {
      toast({
        variant: "destructive",
        title: "Acción no permitida",
        description: "No puedes eliminar tu propio usuario.",
      });
      setAdminToDelete(null);
      return;
    }

    setAdmins(admins.filter((admin) => admin.id !== adminToDelete.id));

    toast({
      title: "Administrador eliminado",
      description: `${adminToDelete.name} ha sido eliminado del sistema.`,
    });

    setAdminToDelete(null);
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

        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus size={16} className="mr-2" /> Nuevo Administrador
            </Button>
          </DialogTrigger>
          <DialogContent>
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
                  placeholder="correo@ejemplo.com"
                  value={newAdmin.email}
                  onChange={(e) =>
                    setNewAdmin({ ...newAdmin, email: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleCreateAdmin}
                disabled={!newAdmin.name || !newAdmin.email}
              >
                Crear
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
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
      </div>
    </div>
  );
};

export default Administrators;
