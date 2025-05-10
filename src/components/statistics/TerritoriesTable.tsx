
import React from "react";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { TerritorySafeData } from "@/types/territory-types";

interface TerritoriesTableProps {
  filteredTerritories: TerritorySafeData[];
  isLoading: boolean;
}

const TerritoriesTable: React.FC<TerritoriesTableProps> = ({ filteredTerritories, isLoading }) => {
  const navigate = useNavigate();

  const handleRowClick = (territoryId: string) => {
    navigate(`/estadisticas/${territoryId}`);
  };

  const getStatusDisplay = (territory: TerritorySafeData) => {
    if (territory.status === "expired") {
      return "Expirado";
    } else if (territory.status === "assigned") {
      return "Asignado";
    } else {
      return territory.last_assigned_at ? "Devuelto" : "Nunca asignado";
    }
  };

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Territorio</TableHead>
              <TableHead>Zona</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Última Asignación</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4">
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Cargando territorios...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredTerritories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                  No hay territorios registrados.
                </TableCell>
              </TableRow>
            ) : (
              filteredTerritories.map((territory) => (
                <TableRow
                  key={territory.id}
                  className="cursor-pointer hover:bg-muted/60"
                  onClick={() => handleRowClick(territory.id)}
                >
                  <TableCell className="font-medium">{territory.name}</TableCell>
                  <TableCell>{territory.zone?.name || "Sin zona"}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      territory.status === "expired" 
                        ? "bg-red-100 text-red-800" 
                        : territory.status === "assigned"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                    }`}>
                      {getStatusDisplay(territory)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {territory.last_assigned_at
                      ? new Date(territory.last_assigned_at).toLocaleDateString()
                      : "N/A"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TerritoriesTable;
