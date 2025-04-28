import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { useToast } from "@/components/ui/use-toast";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Crear el contexto
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Crear el proveedor
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setCurrentUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCurrentUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Error de autenticación",
          description: error.message || "Email o contraseña incorrectos",
        });
        return false;
      }

      if (data.user) {
        toast({
          title: "Inicio de sesión exitoso",
          description: `Bienvenido, ${data.user.email}`,
        });
        return true;
      }

      return false;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error de autenticación",
        description: error.message || "Ha ocurrido un error durante el inicio de sesión",
      });
      return false;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setSession(null);
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente",
    });
  };

  const value = {
    currentUser,
    login,
    logout,
    isAuthenticated: !!currentUser,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 🎯 Exportar el hook useAuth
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
