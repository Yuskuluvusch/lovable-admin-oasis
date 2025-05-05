
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRange } from "react-day-picker";
import { Calendar as CalendarIcon, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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

  return (
    <div className="grid gap-4">
      <div className="space-y-2">
        <Label htmlFor="territory">Territorio</Label>
        <Popover open={territorySearchOpen} onOpenChange={setTerritorySearchOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={territorySearchOpen}
              className="w-full justify-between"
            >
              {selectedTerritory !== "all"
                ? territories.find((territory) => territory.id === selectedTerritory)?.name || "Selecciona un territorio"
                : "Todos los territorios"}
              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Buscar territorio..." />
              <CommandEmpty>No se encontraron resultados.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="all"
                  onSelect={() => {
                    setSelectedTerritory("all");
                    setTerritorySearchOpen(false);
                  }}
                >
                  <span>Todos</span>
                </CommandItem>
                {territories.map((territory) => (
                  <CommandItem
                    key={territory.id}
                    value={territory.name}
                    onSelect={() => {
                      setSelectedTerritory(territory.id);
                      setTerritorySearchOpen(false);
                    }}
                  >
                    {territory.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="publisher">Publicador</Label>
        <Popover open={publisherSearchOpen} onOpenChange={setPublisherSearchOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={publisherSearchOpen}
              className="w-full justify-between"
            >
              {selectedPublisher !== "all"
                ? publishers.find((publisher) => publisher.id === selectedPublisher)?.name || "Selecciona un publicador"
                : "Todos los publicadores"}
              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Buscar publicador..." />
              <CommandEmpty>No se encontraron resultados.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="all"
                  onSelect={() => {
                    setSelectedPublisher("all");
                    setPublisherSearchOpen(false);
                  }}
                >
                  <span>Todos</span>
                </CommandItem>
                {publishers.map((publisher) => (
                  <CommandItem
                    key={publisher.id}
                    value={publisher.name}
                    onSelect={() => {
                      setSelectedPublisher(publisher.id);
                      setPublisherSearchOpen(false);
                    }}
                  >
                    {publisher.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
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
