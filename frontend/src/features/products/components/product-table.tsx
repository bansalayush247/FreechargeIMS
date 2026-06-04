import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { buttonVariants } from "@/src/components/ui/button";
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
              <TableHead className="text-right">Details</TableHead>
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
                  <TableCell className="text-right">
                    <Link href={`/products/${product._id || product.id}`} className={buttonVariants({ size: "icon", variant: "outline" })} title={`Open ${product.name}`}>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-slate-500">
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
