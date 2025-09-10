
import React from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Calendar, AlertTriangle, Info } from "lucide-react";

interface TerritoryStatusAlertsProps {
  isExpired: boolean;
  expiryDate: string | null;
  daysRemaining: number | null;
}

const TerritoryStatusAlerts: React.FC<TerritoryStatusAlertsProps> = ({ 
  isExpired,
  expiryDate,
  daysRemaining
}) => {
  // Calculate if territory is truly expired based on date
  const isDateExpired = expiryDate ? new Date(expiryDate) < new Date() : false;
  const isTrulyExpired = isExpired || isDateExpired;
  
  if (isTrulyExpired) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Territorio caducado</AlertTitle>
        <AlertDescription>
          Este territorio ha expirado. Por favor, solicite otro territorio.
        </AlertDescription>
      </Alert>
    );
  }
  
  if (daysRemaining === null) {
    return null;
  }
  
  return (
    <Alert 
      className={`${daysRemaining < 7 ? "border-amber-500 bg-amber-50 text-amber-800" : "border-green-500 bg-green-50 text-green-800"} mb-4`}
    >
      <Calendar className="h-4 w-4" />
      <AlertTitle>
        {daysRemaining === 0 
          ? "¡El territorio vence hoy!" 
          : `Faltan ${daysRemaining} días para el vencimiento`}
      </AlertTitle>
    </Alert>
  );
};

export default TerritoryStatusAlerts;
