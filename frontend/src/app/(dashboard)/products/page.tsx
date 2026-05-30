"use client";

import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/src/components/layout/page-header";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { CreateProductForm, ProductTable, useProducts } from "@/src/features/products";

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const { data = [], isLoading, isError } = useProducts();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Products"
        title="Product catalog"
        description="Products are global catalog records and do not depend on a selected space."
        actions={<Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ["products"] })}>Refresh list</Button>}
      />

      <CreateProductForm />

      {isLoading ? (
        <div className="grid gap-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : isError ? (
        <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-6 text-rose-100">
          Unable to load products right now.
        </div>
      ) : (
        <ProductTable products={data ?? []} />
      )}
    </div>
  );
}
