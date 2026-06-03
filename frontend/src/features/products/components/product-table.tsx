import { Badge } from "@/src/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import type { Product } from "@/src/features/products/types";

export function ProductTable({ products }: { products: Product[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Products</CardTitle>
        <CardDescription>Starter table architecture with reusable table primitives.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length ? (
              products.map((product) => (
                <TableRow key={String(product._id ?? product.id ?? product.sku ?? product.name)}>
                  <TableCell className="font-medium text-slate-900">{product.name}</TableCell>
                  <TableCell>{product.sku ?? "-"}</TableCell>
                  <TableCell>{product.category ?? "-"}</TableCell>
                  <TableCell>{product.assetType ?? (product.isTrackable ? "NON_CONSUMABLE" : "CONSUMABLE")}</TableCell>
                  <TableCell>
                    <Badge variant={product.status === "ACTIVE" ? "success" : "secondary"}>{product.status ?? "UNKNOWN"}</Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-slate-500">
                  No products have been created in this space yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}