
import React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { TerritoryHistory as TerritoryHistoryType } from "@/types/territory-types";

interface TerritoryHistoryTableProps {
  history: TerritoryHistoryType[];
}

const TerritoryHistoryTable = ({ history }: TerritoryHistoryTableProps) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "dd MMM yyyy", { locale: es });
  };

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Este territorio nunca ha sido asignado.
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Publicador</TableHead>
              <TableHead>Fecha de Asignación</TableHead>
              <TableHead>Fecha de Expiración</TableHead>
              <TableHead>Fecha de Devolución</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  {item.publisher_name}
                </TableCell>
                <TableCell>
                  {formatDate(item.assigned_at)}
                </TableCell>
                <TableCell>
                  {item.expires_at
                    ? formatDate(item.expires_at)
                    : "No definida"}
                </TableCell>
                <TableCell>
                  {item.returned_at
                    ? formatDate(item.returned_at)
                    : "No devuelto"}
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-md text-xs font-medium ${
                      item.status === "assigned"
                        ? "bg-green-100 text-green-800"
                        : item.status === "returned"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {item.status === "assigned"
                      ? "Asignado"
                      : item.status === "returned"
                      ? "Devuelto"
                      : item.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

const TerritoryHistory = ({ history }: TerritoryHistoryTableProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Historial de Asignaciones
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TerritoryHistoryTable history={history} />
      </CardContent>
    </Card>
  );
};

export default TerritoryHistory;
