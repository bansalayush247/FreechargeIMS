
"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Select } from "@/src/components/ui/select";
import { createProduct } from "@/src/features/products/api";
import { PRODUCT_CATEGORY_OPTIONS } from "@/src/features/products/constants";
import { usePermission } from "@/src/hooks/usePermission";
import { useToast } from "@/src/components/toastProvider";
import { getApiErrorMessage } from "@/src/services/http/client";

export function CreateProductForm() {
  const canAdd = usePermission({ action: "CREATE_PRODUCT" });
  const queryClient = useQueryClient();
  const toast = useToast();

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [assetType, setAssetType] = useState<"CONSUMABLE" | "NON_CONSUMABLE">("CONSUMABLE");
  const [imageUrl, setImageUrl] = useState("");
  const [imageName, setImageName] = useState("");

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      setImageUrl("");
      setImageName("");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(typeof reader.result === "string" ? reader.result : "");
      setImageName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const mutation = useMutation({
    mutationFn: () =>
      createProduct(
        {
          name,
          sku,
          category,
          assetType,
          isTrackable: assetType === "NON_CONSUMABLE",
          imageUrl,
        },
      ),
    onSuccess: async () => {
      toast.show("success", "Product created");
      setName("");
      setSku("");
      setCategory("");
      setAssetType("CONSUMABLE");
      setImageUrl("");
      setImageName("");
      await queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => {
      toast.show("error", getApiErrorMessage(error));
    },
  });

  const canSubmit = canAdd && Boolean(name.trim()) && Boolean(sku.trim()) && Boolean(category.trim());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create product</CardTitle>
        {!canAdd ? (
          <p className="text-sm text-slate-500">You need the CREATE_PRODUCT permission to add a product.</p>
        ) : null}
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Product name</Label>
          <Input id="name" value={name} onChange={(event) => setName(event.target.value)} disabled={!canAdd} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" value={sku} onChange={(event) => setSku(event.target.value.toUpperCase())} disabled={!canAdd} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select id="category" value={category} onChange={(event) => setCategory(event.target.value)} disabled={!canAdd}>
            <option value="">Select category</option>
            {PRODUCT_CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="assetType">Product type</Label>
          <Select id="assetType" value={assetType} onChange={(event) => setAssetType(event.target.value as "CONSUMABLE" | "NON_CONSUMABLE")} disabled={!canAdd}>
            <option value="CONSUMABLE">Bulk / Consumable</option>
            <option value="NON_CONSUMABLE">Trackable / Serialized</option>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="productImage">Product image</Label>
          <Input id="productImage" type="file" accept="image/*" onChange={handleImageChange} disabled={!canAdd} />
          <p className="text-xs text-slate-500">Choose an image file. It will be stored with the product as an image URL.</p>
          {imageName ? <p className="text-xs text-slate-500">Selected file: {imageName}</p> : null}
          {imageUrl ? <img src={imageUrl} alt="Selected product preview" className="h-24 w-24 rounded-xl border border-white/10 object-cover" /> : null}
        </div>

        <div className="flex items-end">
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !canSubmit}>
            {mutation.isPending ? "Creating..." : "Create product"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}