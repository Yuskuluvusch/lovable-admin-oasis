import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LayoutDashboard, User, LogOut, Menu, Users } from "lucide-react";

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isCollapsed: boolean;
}

const SidebarLink = ({ to, icon, children, isCollapsed }: SidebarLinkProps) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <NavLink to={to} className="w-full">
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start gap-3 font-normal h-12 px-4",
          isActive
            ? "bg-accent text-primary font-medium"
            : "hover:bg-accent/50 text-muted-foreground"
        )}
      >
        <span className="shrink-0">{icon}</span>
        {!isCollapsed && <span>{children}</span>}
      </Button>
    </NavLink>
  );
};

const AdminSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { currentUser, logout } = useAuth();

  const getUserInitials = () => {
    if (!currentUser) return "A";
    if (currentUser.email) {
      return currentUser.email.charAt(0).toUpperCase();
    }
    return "A";
  };

  const getDisplayName = () => {
    if (!currentUser) return "";
    return currentUser.email || "";
  };

  return (
    <div
      className={cn(
        "border-r bg-card transition-all duration-300 flex flex-col h-screen",
        isCollapsed ? "w-[70px]" : "w-[240px]"
      )}
    >
      <div className="p-4 flex items-center justify-between border-b">
        <div className={cn("flex items-center", isCollapsed ? "justify-center w-full" : "")}>
          <div className="shrink-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-white font-semibold text-sm">SA</span>
          </div>
          {!isCollapsed && <h1 className="ml-3 font-semibold text-lg">Admin</h1>}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className={isCollapsed ? "hidden" : ""}
          onClick={() => setIsCollapsed(true)}
        >
          <Menu size={18} />
        </Button>
      </div>

      {isCollapsed && (
        <Button
          variant="ghost"
          size="icon"
          className="m-2 self-center"
          onClick={() => setIsCollapsed(false)}
        >
          <Menu size={18} />
        </Button>
      )}

      <div className="py-4 flex-1 flex flex-col gap-1 px-2">
        <SidebarLink to="/dashboard" icon={<LayoutDashboard size={20} />} isCollapsed={isCollapsed}>
          Dashboard
        </SidebarLink>
        <SidebarLink to="/administrators" icon={<User size={20} />} isCollapsed={isCollapsed}>
          Administradores
        </SidebarLink>
        <SidebarLink to="/publishers" icon={<Users size={20} />} isCollapsed={isCollapsed}>
          Publicadores
        </SidebarLink>
        <SidebarLink to="/publisher-roles" icon={<User size={20} />} isCollapsed={isCollapsed}>
          Roles
        </SidebarLink>
      </div>

      <div className="border-t p-4">
        <div 
          className={cn(
            "flex items-center mb-4", 
            isCollapsed ? "justify-center" : "justify-start"
          )}
        >
          <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center text-primary font-medium">
            {getUserInitials()}
          </div>
          {!isCollapsed && (
            <div className="ml-3 truncate">
              <div className="font-medium text-sm">{getDisplayName()}</div>
              <div className="text-xs text-muted-foreground truncate">
                {currentUser?.email}
              </div>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 text-muted-foreground hover:text-destructive",
            isCollapsed && "justify-center p-2"
          )}
          onClick={logout}
        >
          <LogOut size={20} />
          {!isCollapsed && "Cerrar sesión"}
        </Button>
      </div>
    </div>
  );
};

export default AdminSidebar;
