"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Select } from "@/src/components/ui/select";

import { useCurrentSpace } from "@/src/hooks/useCurrentSpace";
import { useMySpaces } from "@/src/features/spaces/hooks/use-my-spaces";
import { useProducts } from "@/src/features/products/hooks/use-products";
import type { Product } from "@/src/features/products/types";
import { useWarehouses } from "@/src/features/warehouses/hooks/use-warehouses";
import type { Warehouse } from "@/src/features/warehouses/types";
import { createInventoryItem } from "@/src/lib/inventoryClient";
import { usePermission } from "@/src/hooks/usePermission";
import { useToast } from "@/src/components/toastProvider";
import { getApiErrorMessage } from "@/src/services/http/client";

export default function CreateInventoryForm() {
  const { activeSpaceId } = useCurrentSpace();
  const { data: mySpaces = [] } = useMySpaces();
  const availableSpaces = useMemo(() => mySpaces, [mySpaces]);

  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(activeSpaceId ?? "");
  const canAdd = usePermission({ action: "CREATE_INVENTORY" });
  const queryClient = useQueryClient();
  const toast = useToast();

  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [serialNumber, setSerialNumber] = useState("");
  const [assetTag, setAssetTag] = useState("");
  const [qrCode, setQrCode] = useState("");

  useEffect(() => {
    if (!selectedSpaceId && availableSpaces[0]) {
      const nextSpaceId = availableSpaces[0]._id ?? availableSpaces[0].id ?? "";
      if (nextSpaceId) {
        setSelectedSpaceId(nextSpaceId);
      }
    }
  }, [availableSpaces, selectedSpaceId]);

  useEffect(() => {
    if (!activeSpaceId) {
      return;
    }

    const matchingAllowedSpace = availableSpaces.find((space) => {
      const spaceId = space._id ?? space.id ?? "";
      return spaceId === activeSpaceId;
    });

    if (matchingAllowedSpace) {
      setSelectedSpaceId(activeSpaceId);
    }
  }, [activeSpaceId, availableSpaces]);

  const selectedSpace = availableSpaces.find((space) => (space._id ?? space.id ?? "") === selectedSpaceId) ?? null;
  const { data: products = [] } = useProducts();
  const typedProducts = products as Product[];
  const { data: warehouses = [] } = useWarehouses({ spaceId: selectedSpaceId || undefined });
  const typedWarehouses = warehouses as Warehouse[];
  const selectedProduct = typedProducts.find((product) => String(product._id ?? product.id) === productId) ?? null;
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");
  const selectedWarehouse =
    typedWarehouses.find((w) => String(w._id ?? w.id) === selectedWarehouseId) ?? typedWarehouses[0] ?? null;
  const isTrackableProduct = selectedProduct ? String(selectedProduct.assetType || "").toUpperCase() === "NON_CONSUMABLE" || selectedProduct.isTrackable === true : false;

  useEffect(() => {
    if (isTrackableProduct) {
      setQuantity("1");
      setSerialNumber("");
      setAssetTag("");
      setQrCode("");
    }
  }, [isTrackableProduct]);

  useEffect(() => {
    if (!availableSpaces.length) {
      setSelectedSpaceId("");
      return;
    }

    const hasSelectedSpace = availableSpaces.some((space) => (space._id ?? space.id ?? "") === selectedSpaceId);

    if (!hasSelectedSpace) {
      const nextSpaceId = activeSpaceId && availableSpaces.some((space) => (space._id ?? space.id ?? "") === activeSpaceId)
        ? activeSpaceId
        : (availableSpaces[0]._id ?? availableSpaces[0].id ?? "");

      if (nextSpaceId && nextSpaceId !== selectedSpaceId) {
        setSelectedSpaceId(nextSpaceId);
      }
    }
  }, [activeSpaceId, availableSpaces, selectedSpaceId]);

  useEffect(() => {
    setProductId("");
    setQuantity("1");
    setSerialNumber("");
    setAssetTag("");
    setQrCode("");
    setSelectedWarehouseId("");
  }, [selectedSpaceId]);

  useEffect(() => {
    if (!selectedWarehouseId && typedWarehouses.length) {
      const first = typedWarehouses[0];
      const id = String(first._id ?? first.id ?? "");
      if (id) setSelectedWarehouseId(id);
    }
  }, [typedWarehouses, selectedWarehouseId]);

  const mutation = useMutation({
    mutationFn: () =>
      createInventoryItem(
        {
          productId,
          warehouseId: String(selectedWarehouseId || (selectedWarehouse?._id ?? selectedWarehouse?.id ?? "")),
          quantity: isTrackableProduct ? 1 : Number(quantity || 1),
          serialNumber: isTrackableProduct ? serialNumber : undefined,
          assetTag: isTrackableProduct ? assetTag : undefined,
          qrCode: isTrackableProduct ? qrCode : undefined,
        },
        selectedSpaceId || undefined,
      ),
    onSuccess: async () => {
      toast.show("success", "Inventory item created");
      await queryClient.invalidateQueries({ queryKey: ["space-inventory", selectedSpaceId] });
    },
    onError: (error) => {
      toast.show("error", getApiErrorMessage(error));
    },
  });

  const canSubmit =
    canAdd &&
    Boolean(selectedSpaceId) &&
    Boolean(productId) &&
    Boolean(selectedWarehouseId || selectedWarehouse) &&
    (isTrackableProduct
      ? Boolean(serialNumber.trim()) && Boolean(assetTag.trim()) && Boolean(qrCode.trim())
      : Number(quantity) >= 1) &&
    (isTrackableProduct ? quantity === "1" : true);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add inventory</CardTitle>
        {!canAdd ? (
          <p className="text-sm text-slate-500">
            You need the CREATE_INVENTORY permission to submit this form.
          </p>
        ) : !availableSpaces.length ? (
          <p className="text-sm text-slate-500">
            Join or create a space first. <Link className="text-brand underline-offset-4 hover:underline" href="/spaces">Open Spaces</Link>
          </p>
        ) : !selectedSpaceId ? (
          <p className="text-sm text-slate-500">
            Select a space first so the form can load products for that space.
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="spaceId">Space</Label>
          <Select id="spaceId" value={selectedSpaceId} onChange={(event) => setSelectedSpaceId(event.target.value)} disabled={!canAdd || !availableSpaces.length}>
            <option value="">Select space</option>
            {availableSpaces.map((space) => {
              const spaceId = space._id ?? space.id ?? "";
              if (!spaceId) return null;

              const normalizedCode = String(space.code || "").toUpperCase();
              const label = normalizedCode === "IT_TEAM"
                ? "IT Space"
                : normalizedCode === "WAREHOUSE"
                  ? "Warehouse Space"
                  : `${space.name || "Space"}`;

              return (
                <option key={spaceId} value={spaceId}>
                  {label}
                </option>
              );
            })}
          </Select>
          {selectedSpace ? (
            <p className="text-xs text-slate-500">Inventory will be added under {selectedSpace.name}.</p>
          ) : null}
          {selectedSpace && ["IT_TEAM", "WAREHOUSE"].includes(String(selectedSpace.code || "").toUpperCase()) ? (
            <p className="text-xs text-slate-500">No source-stock quantity verification is required for this system space.</p>
          ) : selectedSpace ? (
            <p className="text-xs text-slate-500">Quantity will be checked against IT or Warehouse stock based on this space type.</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="productId">Product</Label>
          <Select id="productId" value={productId} onChange={(e) => setProductId(e.target.value)} disabled={!canAdd || !selectedSpaceId}>
            <option value="">{products.length ? "Select product" : "No products in this space"}</option>
            {typedProducts.map((p) => {
              const id = p._id ?? p.id;
              if (!id) return null;
              const name = p.name ?? p.title ?? "Unnamed product";
              const sku = p.sku ? ` (${p.sku})` : "";
              return (
                <option key={id} value={id}>
                  {`${name}${sku}`}
                </option>
              );
            })}
          </Select>
          {!products.length ? (
            <p className="text-xs text-slate-500">
              Create a product first. <Link className="text-brand underline-offset-4 hover:underline" href="/products">Open Products</Link>
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input id="quantity" type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} disabled={!canAdd || !selectedSpaceId || isTrackableProduct} />
          {isTrackableProduct ? <p className="text-xs text-slate-500">Serialized products are added one item at a time.</p> : null}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="warehouseId">Storage location (warehouse)</Label>
          <Select id="warehouseId" value={selectedWarehouseId} onChange={(e) => setSelectedWarehouseId(e.target.value)} disabled={!canAdd || !selectedSpaceId || !typedWarehouses.length}>
            <option value="">Select storage location</option>
            {typedWarehouses.map((w) => {
              const id = w._id ?? w.id;
              if (!id) return null;
              const label = `${w.name ?? w.code ?? id}${w.city ? ` — ${w.city}` : ""}`;
              return (
                <option key={id} value={String(id)}>
                  {label}
                </option>
              );
            })}
          </Select>

          <p className="text-sm text-slate-500">
            {selectedWarehouse ? (
              <>
                Inventory will be stored in <span className="font-medium text-slate-700">{selectedWarehouse.name ?? selectedWarehouse.code}</span>.
              </>
            ) : (
              "Create or assign a storage location (warehouse) in this space before adding inventory."
            )}
          </p>
        </div>

        {isTrackableProduct ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial number</Label>
              <Input id="serialNumber" value={serialNumber} onChange={(event) => setSerialNumber(event.target.value)} disabled={!canAdd || !selectedSpaceId} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assetTag">Asset tag</Label>
              <Input id="assetTag" value={assetTag} onChange={(event) => setAssetTag(event.target.value)} disabled={!canAdd || !selectedSpaceId} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="qrCode">QR code</Label>
              <Input id="qrCode" value={qrCode} onChange={(event) => setQrCode(event.target.value)} disabled={!canAdd || !selectedSpaceId} />
            </div>

            <div className="md:col-span-2 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm text-slate-700">
              Trackable product selected. Serial number, asset tag, and QR code are required.
            </div>
          </>
        ) : null}

        <div className="md:col-span-2 flex items-center gap-3">
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !canSubmit}>
            {mutation.isPending ? "Adding..." : "Add inventory"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
