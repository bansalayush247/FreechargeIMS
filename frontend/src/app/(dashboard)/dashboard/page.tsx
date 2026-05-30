"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/src/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { PageHeader } from "@/src/components/layout/page-header";
import { useProducts } from "@/src/features/products";
import { useWarehouses } from "@/src/features/warehouses/hooks/use-warehouses";
import { listAssetRequests } from "@/src/lib/assetRequestClient";
import { listNotifications } from "@/src/lib/notificationClient";
import { useCurrentSpace } from "@/src/hooks/useCurrentSpace";

function readTotal(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return 0;
  }

  const root = "data" in payload ? (payload as { data?: unknown }).data : payload;

  if (!root || typeof root !== "object") {
    return Array.isArray(root) ? root.length : 0;
  }

  const pagination = (root as { pagination?: { total?: unknown } }).pagination;
  const items = (root as { items?: unknown[] }).items;

  if (typeof pagination?.total === "number") {
    return pagination.total;
  }

  if (Array.isArray(items)) {
    return items.length;
  }

  return 0;
}

export default function DashboardPage() {
  const { activeSpaceId } = useCurrentSpace();
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: warehouses = [], isLoading: warehousesLoading } = useWarehouses({ spaceId: activeSpaceId ?? undefined });

  const { data: requestCount, isLoading: requestsLoading } = useQuery({
    queryKey: ["dashboard", "asset-requests-count", activeSpaceId],
    queryFn: async () => readTotal(await listAssetRequests({ spaceId: activeSpaceId ?? undefined, page: 1, limit: 1 })),
    enabled: Boolean(activeSpaceId),
  });

  const { data: alertCount, isLoading: alertsLoading } = useQuery({
    queryKey: ["dashboard", "notifications-count", activeSpaceId],
    queryFn: async () => readTotal(await listNotifications({ spaceId: activeSpaceId ?? undefined, page: 1, limit: 1 })),
    enabled: Boolean(activeSpaceId),
  });

  const metrics = [
    { label: "Open requests", value: requestsLoading ? "..." : String(requestCount ?? 0), tone: "warning" as const },
    { label: "Active warehouses", value: warehousesLoading ? "..." : String(warehouses.length), tone: "success" as const },
    { label: "Products tracked", value: productsLoading ? "..." : String(products.length), tone: "secondary" as const },
    { label: "Alerts", value: alertsLoading ? "..." : String(alertCount ?? 0), tone: "danger" as const },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dashboard"
        title="Operations overview"
        description="A single view for inventory health, request throughput, and warehouse activity."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader>
              <CardDescription>{metric.label}</CardDescription>
              <CardTitle className="text-3xl">{metric.value}</CardTitle>
              <Badge variant={metric.tone}>{metric.label}</Badge>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recommended next steps</CardTitle>
          <CardDescription>Hook these dashboard cards to backend summaries and analytics endpoints.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-slate-600">
          The layout, nav, and auth boundary are ready for team-owned module expansion.
        </CardContent>
      </Card>
    </div>
  );
}