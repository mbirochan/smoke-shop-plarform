"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createProductSchema, type CreateProductInput } from "@smoke-shop/validators";
import { trpc } from "@/lib/trpc";
import { FileUpload } from "@/components/shared/file-upload";
import { useState } from "react";

export default function NewProductPage() {
  const router = useRouter();
  const [images, setImages] = useState<Array<{ url: string; key: string; order: number }>>([]);

  const { data: categories } = trpc.customerStore.getCategories.useQuery();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      quantity: 0,
      lowStockThreshold: 5,
      taxRate: 0.0825,
      isAgeRestricted: true,
      minimumAge: 21,
    },
  });

  const createMutation = trpc.storeProduct.create.useMutation({
    onSuccess: () => router.push("/store/products"),
  });

  function onSubmit(data: CreateProductInput) {
    createMutation.mutate({
      ...data,
      images: images.map((img, i) => ({ ...img, order: i, alt: "" })),
    });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">Add Product</h1>

      {createMutation.isError && (
        <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {createMutation.error.message}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
        {/* Name */}
        <div>
          <label className="text-sm font-medium">Name *</label>
          <input
            {...register("name")}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="Product name"
          />
          {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
        </div>

        {/* Category */}
        <div>
          <label className="text-sm font-medium">Category</label>
          <select
            {...register("categoryId")}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="">Select category</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.parentId ? "— " : ""}{c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Price + Compare-at */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-sm font-medium">Price *</label>
            <input
              type="number"
              step="0.01"
              {...register("price")}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="0.00"
            />
            {errors.price && <p className="mt-1 text-xs text-destructive">{errors.price.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium">Compare-at Price</label>
            <input
              type="number"
              step="0.01"
              {...register("compareAtPrice")}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Cost Price</label>
            <input
              type="number"
              step="0.01"
              {...register("costPrice")}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Stock */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-sm font-medium">Quantity in Stock</label>
            <input
              type="number"
              min={0}
              {...register("quantity")}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Low Stock Threshold</label>
            <input
              type="number"
              min={0}
              {...register("lowStockThreshold")}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Weight (grams)</label>
            <input
              type="number"
              min={0}
              {...register("weightGrams")}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Brand + SKU */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Brand</label>
            <input
              {...register("brand")}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">SKU</label>
            <input
              {...register("sku")}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-medium">Description</label>
          <textarea
            {...register("description")}
            rows={4}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="Product description (markdown supported)"
          />
        </div>

        {/* Age restriction */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("isAgeRestricted")} />
            Age restricted
          </label>
          <div>
            <label className="text-sm font-medium">Min Age</label>
            <input
              type="number"
              min={18}
              max={21}
              {...register("minimumAge")}
              className="ml-2 w-16 rounded-md border bg-background px-2 py-1 text-sm"
            />
          </div>
        </div>

        {/* Images */}
        <div>
          <label className="text-sm font-medium">Images (up to 5)</label>
          <p className="text-xs text-muted-foreground">First image will be the primary product image.</p>
          {images.length < 5 && (
            <div className="mt-2">
              <FileUpload
                bucket="product-images"
                label=""
                maxSizeMB={5}
                accept="image/jpeg,image/png,image/webp"
                onUploadComplete={(url) => {
                  setImages((prev) => [...prev, { url, key: url, order: prev.length }]);
                }}
              />
            </div>
          )}
          {images.length > 0 && (
            <div className="mt-3 flex gap-2 flex-wrap">
              {images.map((img, i) => (
                <div key={img.url} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className="h-20 w-20 rounded object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-xs text-destructive-foreground"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md border px-4 py-2 text-sm hover:bg-accent"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="rounded-md bg-primary px-6 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {createMutation.isPending ? "Creating..." : "Create Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
