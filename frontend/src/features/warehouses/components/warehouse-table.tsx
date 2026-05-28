import { Badge } from "@/src/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import type { Warehouse } from "@/src/features/warehouses/types";

export function WarehouseTable({ warehouses }: { warehouses: Warehouse[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Warehouses</CardTitle>
        <CardDescription>Starter table architecture with location and capacity columns.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {warehouses.length ? (
              warehouses.map((warehouse) => (
                <TableRow key={String(warehouse._id ?? warehouse.id ?? warehouse.code ?? warehouse.name)}>
                  <TableCell className="font-medium text-slate-900">{warehouse.name}</TableCell>
                  <TableCell>{warehouse.code ?? "-"}</TableCell>
                  <TableCell>
                    {[warehouse.city, warehouse.state].filter(Boolean).join(", ") || "-"}
                  </TableCell>
                  <TableCell>{typeof warehouse.capacity === "number" ? warehouse.capacity : "-"}</TableCell>
                  <TableCell>
                    <Badge variant={warehouse.status === "ACTIVE" ? "success" : "secondary"}>{warehouse.status ?? "UNKNOWN"}</Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-slate-500">
                  No warehouses have been loaded yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}