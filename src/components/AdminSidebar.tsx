
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Tags,
  Map,
  MapPin,
  LogOut,
} from "lucide-react";

const AdminSidebar = () => {
  const { logout } = useAuth();

  return (
    <aside className="w-64 bg-slate-800 text-white p-6">
      <nav className="space-y-2">
        <Link to="/dashboard">
          <Button variant="ghost" className="w-full justify-start text-white hover:text-white hover:bg-slate-700">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
        </Link>
        
        <Link to="/administrators">
          <Button variant="ghost" className="w-full justify-start text-white hover:text-white hover:bg-slate-700">
            <Users className="mr-2 h-4 w-4" />
            Administradores
          </Button>
        </Link>

        <Link to="/publishers">
          <Button variant="ghost" className="w-full justify-start text-white hover:text-white hover:bg-slate-700">
            <Users className="mr-2 h-4 w-4" />
            Publicadores
          </Button>
        </Link>

        <Link to="/publisher-roles">
          <Button variant="ghost" className="w-full justify-start text-white hover:text-white hover:bg-slate-700">
            <Tags className="mr-2 h-4 w-4" />
            Roles
          </Button>
        </Link>

        <Link to="/zones">
          <Button variant="ghost" className="w-full justify-start text-white hover:text-white hover:bg-slate-700">
            <Map className="mr-2 h-4 w-4" />
            Zonas
          </Button>
        </Link>

        <Link to="/territories">
          <Button variant="ghost" className="w-full justify-start text-white hover:text-white hover:bg-slate-700">
            <MapPin className="mr-2 h-4 w-4" />
            Territorios
          </Button>
        </Link>

        <Button
          variant="ghost"
          className="w-full justify-start text-white hover:text-white hover:bg-slate-700"
          onClick={logout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </Button>
      </nav>
    </aside>
  );
};

export default AdminSidebar;
