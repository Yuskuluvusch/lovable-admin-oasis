
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Tags,
  Map,
  MapPin,
  LogOut,
  BarChart,
} from "lucide-react";

interface AdminSidebarProps {
  onLinkClick?: () => void;
}

const AdminSidebar = ({ onLinkClick }: AdminSidebarProps) => {
  const { logout } = useAuth();

  const handleLogout = () => {
    if (onLinkClick) onLinkClick();
    logout();
  };

  return (
    <aside className="w-64 bg-slate-800 text-white p-6">
      <nav className="space-y-2">
        <Link to="/dashboard" onClick={onLinkClick}>
          <Button variant="ghost" className="w-full justify-start text-white hover:text-white hover:bg-slate-700">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
        </Link>
        
        <Link to="/administrators" onClick={onLinkClick}>
          <Button variant="ghost" className="w-full justify-start text-white hover:text-white hover:bg-slate-700">
            <Users className="mr-2 h-4 w-4" />
            Administradores
          </Button>
        </Link>

        <Link to="/publishers" onClick={onLinkClick}>
          <Button variant="ghost" className="w-full justify-start text-white hover:text-white hover:bg-slate-700">
            <Users className="mr-2 h-4 w-4" />
            Publicadores
          </Button>
        </Link>

        <Link to="/publisher-roles" onClick={onLinkClick}>
          <Button variant="ghost" className="w-full justify-start text-white hover:text-white hover:bg-slate-700">
            <Tags className="mr-2 h-4 w-4" />
            Roles
          </Button>
        </Link>

        <Link to="/zones" onClick={onLinkClick}>
          <Button variant="ghost" className="w-full justify-start text-white hover:text-white hover:bg-slate-700">
            <Map className="mr-2 h-4 w-4" />
            Zonas
          </Button>
        </Link>

        <Link to="/territories" onClick={onLinkClick}>
          <Button variant="ghost" className="w-full justify-start text-white hover:text-white hover:bg-slate-700">
            <MapPin className="mr-2 h-4 w-4" />
            Territorios
          </Button>
        </Link>

        <Link to="/estadisticas" onClick={onLinkClick}>
          <Button variant="ghost" className="w-full justify-start text-white hover:text-white hover:bg-slate-700">
            <BarChart className="mr-2 h-4 w-4" />
            Estadísticas
          </Button>
        </Link>

        <Button
          variant="ghost"
          className="w-full justify-start text-white hover:text-white hover:bg-slate-700"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </Button>
      </nav>
    </aside>
  );
};

export default AdminSidebar;
