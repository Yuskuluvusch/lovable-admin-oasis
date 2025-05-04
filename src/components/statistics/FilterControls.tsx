
import React from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRange } from "react-day-picker";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Territory {
  id: string;
  name: string;
}

interface Publisher {
  id: string;
  name: string;
}

interface FilterControlsProps {
  territories: Territory[];
  publishers: Publisher[];
  selectedTerritory: string | "all";
  setSelectedTerritory: (value: string | "all") => void;
  selectedPublisher: string | "all";
  setSelectedPublisher: (value: string | "all") => void;
  dateRange: DateRange | undefined;
  setDateRange: (date: DateRange | undefined) => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({
  territories,
  publishers,
  selectedTerritory,
  setSelectedTerritory,
  selectedPublisher,
  setSelectedPublisher,
  dateRange,
  setDateRange,
}) => {
  return (
    <div className="grid gap-4">
      <div className="space-y-2">
        <Label htmlFor="territory">Territorio</Label>
        <Select
          value={selectedTerritory}
          onValueChange={setSelectedTerritory}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un territorio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {territories.map((territory) => (
              <SelectItem key={territory.id} value={territory.id}>
                {territory.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="publisher">Publicador</Label>
        <Select
          value={selectedPublisher}
          onValueChange={setSelectedPublisher}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un publicador" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {publishers.map((publisher) => (
              <SelectItem key={publisher.id} value={publisher.id}>
                {publisher.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Rango de Fechas</Label>
        <div className="flex flex-col space-y-2">
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <Button
                id="date"
                variant="outline"
                size="sm"
                className={dateRange?.from ? "text-left font-normal" : "text-left font-normal text-muted-foreground"}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y", { locale: es })} -{" "}
                      {format(dateRange.to, "LLL dd, y", { locale: es })}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y", { locale: es })
                  )
                ) : (
                  <span>Seleccionar rango de fechas</span>
                )}
              </Button>
              {dateRange?.from && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDateRange(undefined)}
                >
                  Limpiar
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterControls;
