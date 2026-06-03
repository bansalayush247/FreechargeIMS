import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";

export type DataTableColumn<T> = {
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
};

export function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  emptyState,
}: {
  columns: DataTableColumn<T>[];
  data: T[];
  emptyState?: React.ReactNode;
}) {
  if (!data.length) {
    return <>{emptyState ?? null}</>;
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-orange-100 bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.header} className={column.className}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow key={row.id ?? rowIndex}>
              {columns.map((column) => (
                <TableCell key={column.header} className={column.className}>
                  {column.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
