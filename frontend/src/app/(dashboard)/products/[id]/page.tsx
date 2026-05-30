"use client";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/src/components/layout/page-header";
import { Button } from "@/src/components/ui/button";
import { deleteProduct, getProduct } from "@/src/features/products/api";
export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data } = useQuery({ queryKey: ["product", id], queryFn: () => getProduct(id), enabled: Boolean(id) });
  const remove = useMutation({ mutationFn: () => deleteProduct(id) });
  return <div className="space-y-4"><PageHeader eyebrow="Products" title={`Product ${id}`} description="Product detail and lifecycle actions." /><pre className="border rounded p-3 text-xs">{JSON.stringify(data, null, 2)}</pre><Button variant="outline" onClick={() => remove.mutate()}>Delete product</Button></div>;
}
