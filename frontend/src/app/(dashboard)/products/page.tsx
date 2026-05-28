"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/src/components/layout/page-header";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Label } from "@/src/components/ui/label";
import { Skeleton } from "@/src/components/ui/skeleton";
import { ProductTable, useProducts } from "@/src/features/products";
import { useMySpaces, useSpaceSelection } from "@/src/features/spaces";
import { Select } from "@/src/components/ui/select";

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const { data: mySpaces = [], isLoading: spacesLoading } = useMySpaces();
  const { activeSpaceId, activeSpace, setActiveSpaceId } = useSpaceSelection(mySpaces);
  const { data = [], isLoading, isError } = useProducts({ spaceId: activeSpaceId ?? undefined });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Products"
        title="Product catalog"
        description="Products are shown for your selected joined space so the list matches what you can actually access."
        actions={
          activeSpaceId ? (
            <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ["products", activeSpaceId] })}>
              Refresh list
            </Button>
          ) : null
        }
      />

      <Card className="border-white/10 bg-white/5 text-slate-50 shadow-2xl shadow-black/20 backdrop-blur">
        <CardHeader>
          <CardTitle>Current space</CardTitle>
          <CardDescription className="text-slate-300">
            Select one of your joined spaces to view the products assigned to it.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div className="space-y-2">
            <Label htmlFor="current-space">Joined spaces</Label>
            <Select
              id="current-space"
              value={activeSpaceId ?? ""}
              onChange={(event) => setActiveSpaceId(event.target.value)}
              disabled={!mySpaces.length}
            >
              {mySpaces.length ? (
                mySpaces.map((space) => {
                  const spaceId = space.id || space._id;
                  if (!spaceId) return null;

                  return (
                    <option key={spaceId} value={spaceId}>
                      {space.name} ({space.code})
                    </option>
                  );
                })
              ) : (
                <option value="">No joined spaces available</option>
              )}
            </Select>
          </div>

          <div className="text-sm text-slate-300">
            {activeSpace ? (
              <>
                Showing products for <span className="font-semibold text-slate-50">{activeSpace.name}</span>.
              </>
            ) : (
              <>
                Join or create a space from the Spaces page before product data can load. <Link className="text-brand underline-offset-4 hover:underline" href="/spaces">Open Spaces</Link>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {spacesLoading ? (
        <div className="grid gap-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : isLoading ? (
        <div className="grid gap-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : isError ? (
        <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-6 text-rose-100">
          Unable to load products right now.
        </div>
      ) : !activeSpaceId ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300 shadow-2xl shadow-black/20 backdrop-blur">
          Select a joined space to load its products.
        </div>
      ) : (
        <ProductTable products={data ?? []} />
      )}
    </div>
  );
}
