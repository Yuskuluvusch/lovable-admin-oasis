
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Search, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const [territorySearchOpen, setTerritorySearchOpen] = useState(false);
  const [publisherSearchOpen, setPublisherSearchOpen] = useState(false);
  const [territorySearchTerm, setTerritorySearchTerm] = useState("");
  const [publisherSearchTerm, setPublisherSearchTerm] = useState("");

  // Filter territories based on search term
  const filteredTerritories = territories.filter(territory => 
    territory.name.toLowerCase().includes(territorySearchTerm.toLowerCase())
  );

  // Filter publishers based on search term
  const filteredPublishers = publishers.filter(publisher => 
    publisher.name.toLowerCase().includes(publisherSearchTerm.toLowerCase())
  );

  return (
    <div className="grid gap-4">
      <div className="space-y-2">
        <Label htmlFor="territory">Territorio</Label>
        <DropdownMenu open={territorySearchOpen} onOpenChange={setTerritorySearchOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={territorySearchOpen}
              className="w-full justify-between"
            >
              {selectedTerritory !== "all"
                ? territories.find((territory) => territory.id === selectedTerritory)?.name || "Selecciona un territorio"
                : "Todos los territorios"}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-full" align="start">
            <div className="p-2">
              <Input
                placeholder="Buscar territorio..."
                value={territorySearchTerm}
                onChange={(e) => setTerritorySearchTerm(e.target.value)}
                className="mb-2"
              />
            </div>
            <DropdownMenuItem
              className="flex items-center justify-between"
              onSelect={() => {
                setSelectedTerritory("all");
                setTerritorySearchOpen(false);
              }}
            >
              <span>Todos</span>
              {selectedTerritory === "all" && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
            {filteredTerritories.map((territory) => (
              <DropdownMenuItem
                key={territory.id}
                className="flex items-center justify-between"
                onSelect={() => {
                  setSelectedTerritory(territory.id);
                  setTerritorySearchOpen(false);
                }}
              >
                <span>{territory.name}</span>
                {selectedTerritory === territory.id && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
            ))}
            {filteredTerritories.length === 0 && (
              <div className="text-sm text-muted-foreground p-2">
                No se encontraron resultados.
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-2">
        <Label htmlFor="publisher">Publicador</Label>
        <DropdownMenu open={publisherSearchOpen} onOpenChange={setPublisherSearchOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={publisherSearchOpen}
              className="w-full justify-between"
            >
              {selectedPublisher !== "all"
                ? publishers.find((publisher) => publisher.id === selectedPublisher)?.name || "Selecciona un publicador"
                : "Todos los publicadores"}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-full" align="start">
            <div className="p-2">
              <Input
                placeholder="Buscar publicador..."
                value={publisherSearchTerm}
                onChange={(e) => setPublisherSearchTerm(e.target.value)}
                className="mb-2"
              />
            </div>
            <DropdownMenuItem
              className="flex items-center justify-between"
              onSelect={() => {
                setSelectedPublisher("all");
                setPublisherSearchOpen(false);
              }}
            >
              <span>Todos</span>
              {selectedPublisher === "all" && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
            {filteredPublishers.map((publisher) => (
              <DropdownMenuItem
                key={publisher.id}
                className="flex items-center justify-between"
                onSelect={() => {
                  setSelectedPublisher(publisher.id);
                  setPublisherSearchOpen(false);
                }}
              >
                <span>{publisher.name}</span>
                {selectedPublisher === publisher.id && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
            ))}
            {filteredPublishers.length === 0 && (
              <div className="text-sm text-muted-foreground p-2">
                No se encontraron resultados.
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
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
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateRange?.from && "text-muted-foreground"
                )}
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
