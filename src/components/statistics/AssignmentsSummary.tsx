
import React from "react";
import { CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AssignmentsSummaryProps {
  totalAssignments: number;
  currentAssignments: number;
  expiredAssignments: number;
}

const AssignmentsSummary: React.FC<AssignmentsSummaryProps> = ({
  totalAssignments,
  currentAssignments,
  expiredAssignments,
}) => {
  return (
    <div>
      <CardTitle>Resumen de Asignaciones</CardTitle>
      <CardDescription className="mb-4">
        Información general sobre las asignaciones de territorios.
      </CardDescription>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Total de Asignaciones</TableHead>
            <TableHead>Asignaciones Activas</TableHead>
            <TableHead>Asignaciones Expiradas</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>{totalAssignments}</TableCell>
            <TableCell>{currentAssignments}</TableCell>
            <TableCell>{expiredAssignments}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};

export default AssignmentsSummary;
