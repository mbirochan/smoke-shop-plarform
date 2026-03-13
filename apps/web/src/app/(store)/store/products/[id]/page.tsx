"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProductSchema, type UpdateProductInput } from "@smoke-shop/validators";
import { trpc } from "@/lib/trpc";
import { FileUpload } from "@/components/shared/file-upload";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [images, setImages] = useState<Array<{ url: string; key: string; order: number }>>([]);

  const { data: product, isLoading } = trpc.storeProduct.getById.useQuery({ id });
  const { data: categories } = trpc.customerStore.getCategories.useQuery();
  const utils = trpc.useUtils();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateProductInput>({
    resolver: zodResolver(updateProductSchema),
  });

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        description: product.description ?? "",
        brand: product.brand ?? "",
        sku: product.sku ?? "",
        price: parseFloat(product.price),
        compareAtPrice: product.compareAtPrice ? parseFloat(product.compareAtPrice) : undefined,
        costPrice: product.costPrice ? parseFloat(product.costPrice) : undefined,
        taxRate: parseFloat(product.taxRate),
        quantity: product.quantity,
        lowStockThreshold: product.lowStockThreshold,
        weightGrams: product.weightGrams ?? undefined,
        categoryId: product.categoryId ?? undefined,
        isAgeRestricted: product.isAgeRestricted,
        minimumAge: product.minimumAge,
      });
      const existingImages = (product.images ?? []) as Array<{ url: string; key: string; order: number }>;
      setImages(existingImages);
    }
  }, [product, reset]);

  const updateMutation = trpc.storeProduct.update.useMutation({
    onSuccess: () => {
      utils.storeProduct.getById.invalidate({ id });
      utils.storeProduct.list.invalidate();
    },
  });

  const deleteMutation = trpc.storeProduct.delete.useMutation({
    onSuccess: () => router.push("/store/products"),
  });

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-muted-foreground">Loading...</div>;
  }
  if (!product) {
    return <div className="text-center text-muted-foreground">Product not found.</div>;
  }

  function onSubmit(data: UpdateProductInput) {
    updateMutation.mutate({
      id,
      data: {
        ...data,
        images: images.map((img, i) => ({ ...img, order: i, alt: "" })),
      },
    });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Product</h1>
        <button
          onClick={() => {
            if (confirm("This will deactivate the product. Continue?")) {
              deleteMutation.mutate({ id });
            }
          }}
          className="rounded-md border border-destructive px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10"
        >
          Deactivate
        </button>
      </div>

      {updateMutation.isSuccess && (
        <div className="mt-4 rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
          Product updated.
        </div>
      )}

      {updateMutation.isError && (
        <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {updateMutation.error.message}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
        <div>
          <label className="text-sm font-medium">Name *</label>
          <input
            {...register("name")}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
          {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
        </div>

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

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-sm font-medium">Price *</label>
            <input
              type="number"
              step="0.01"
              {...register("price")}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
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

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-sm font-medium">Quantity</label>
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

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Brand</label>
            <input {...register("brand")} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium">SKU</label>
            <input {...register("sku")} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Description</label>
          <textarea
            {...register("description")}
            rows={4}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

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
            disabled={!isDirty && images.length === ((product.images as unknown[])?.length ?? 0) || updateMutation.isPending}
            className="rounded-md bg-primary px-6 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
