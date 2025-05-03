
import React from "react";
import { Badge } from "@/components/ui/badge";
import { CircleCheck, CircleAlert, X } from "lucide-react";

interface DangerLevelBadgeProps {
  level: string | null | undefined;
  showText?: boolean;
  size?: "sm" | "default";
}

const DangerLevelBadge: React.FC<DangerLevelBadgeProps> = ({ 
  level, 
  showText = true,
  size = "default" 
}) => {
  if (!level) return null;

  const iconSize = size === "sm" ? 14 : 16;
  
  switch (level) {
    case "verde":
      return (
        <Badge 
          className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200"
        >
          <CircleCheck className="h-4 w-4 mr-1" size={iconSize} />
          {showText && "Seguro"}
        </Badge>
      );
    case "amarillo":
      return (
        <Badge 
          className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200"
        >
          <CircleAlert className="h-4 w-4 mr-1" size={iconSize} />
          {showText && "Precaución"}
        </Badge>
      );
    case "rojo":
      return (
        <Badge 
          className="bg-red-100 text-red-800 hover:bg-red-200 border-red-200"
        >
          <X className="h-4 w-4 mr-1" size={iconSize} />
          {showText && "Peligro"}
        </Badge>
      );
    default:
      return null;
  }
};

export default DangerLevelBadge;
