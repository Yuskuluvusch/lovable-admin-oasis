
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent } from "@/components/ui/sheet";

const AdminLayout = () => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {!isMobile ? (
        <AdminSidebar />
      ) : (
        <>
          <Button 
            variant="ghost" 
            size="icon" 
            className="fixed top-4 left-4 z-30"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetContent side="left" className="p-0 w-64 max-w-[80vw] border-r">
              <AdminSidebar />
            </SheetContent>
          </Sheet>
        </>
      )}
      <main className="flex-1 overflow-y-auto">
        <div className="container py-8 px-3 sm:px-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
