"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { PageHeader } from "@/src/components/layout/page-header";
import { CreateProductForm, ProductTable, useProducts } from "@/src/features/products";
import { Authorize } from "@/src/components/auth/Authorize";
import { BACKEND_PERMISSIONS } from "@/src/lib/authorization";

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const { data = [], isLoading, isError } = useProducts();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catalog"
        title="Products"
        description="Catalog items define what can be requested, stocked, and tracked in inventory."
        actions={<Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ["products"] })}>Refresh</Button>}
      />

      <Authorize permission={BACKEND_PERMISSIONS.CREATE_PRODUCT}>
        <CreateProductForm />
      </Authorize>

      {isLoading ? (
        <div className="grid gap-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : isError ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          Products could not be loaded right now.
        </div>
      ) : (
        <ProductTable products={data ?? []} />
      )}
    </div>
  );
}
