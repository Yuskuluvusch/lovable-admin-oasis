
import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertTriangle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface WarningsTooltipProps {
  warnings: string | null | undefined;
  showAsTooltip?: boolean;
  variant?: "compact" | "alert" | "inline";
  maxLength?: number;
}

const WarningsTooltip: React.FC<WarningsTooltipProps> = ({ 
  warnings, 
  showAsTooltip = true,
  variant = "compact",
  maxLength = 100
}) => {
  if (!warnings) return null;

  const truncatedWarnings = warnings.length > maxLength 
    ? `${warnings.substring(0, maxLength)}...` 
    : warnings;
  
  // Compact variant (just an icon with tooltip)
  if (variant === "compact" && showAsTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-flex items-center cursor-help">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p>{warnings}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // Alert variant (full alert component)
  if (variant === "alert") {
    return (
      <Alert className="border-amber-200 bg-amber-50 text-amber-800">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{warnings}</AlertDescription>
      </Alert>
    );
  }
  
  // Inline variant (icon + text)
  return (
    <div className="flex items-start gap-1.5 text-amber-800">
      <Info className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
      <span className="text-sm">{truncatedWarnings}</span>
    </div>
  );
};

export default WarningsTooltip;
