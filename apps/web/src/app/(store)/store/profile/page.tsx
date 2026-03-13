"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type UpdateStoreInput, updateStoreSchema } from "@smoke-shop/validators";
import { trpc } from "@/lib/trpc";
import { useCurrentStore } from "@/hooks/use-current-store";
import { FileUpload } from "@/components/shared/file-upload";

export default function StoreProfilePage() {
  const { store, isLoading, refetch } = useCurrentStore();
  const utils = trpc.useUtils();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateStoreInput>({
    resolver: zodResolver(updateStoreSchema),
  });

  useEffect(() => {
    if (store) {
      reset({
        name: store.name,
        description: store.description ?? "",
        phone: store.phone,
        email: store.email,
        addressLine1: store.addressLine1,
        addressLine2: store.addressLine2 ?? "",
        city: store.city,
        state: store.state,
        zip: store.zip,
      });
    }
  }, [store, reset]);

  const updateMutation = trpc.storeOwner.updateProfile.useMutation({
    onSuccess: () => {
      utils.storeOwner.getMyStore.invalidate();
      refetch();
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="text-center">
        <p className="text-muted-foreground">No store found. Please complete onboarding first.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">Store Profile</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Update your store information. Slug and license details require admin approval to change.
      </p>

      {updateMutation.isSuccess && (
        <div className="mt-4 rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
          Profile updated successfully.
        </div>
      )}

      {updateMutation.isError && (
        <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {updateMutation.error.message}
        </div>
      )}

      {/* Read-only fields */}
      <div className="mt-6 rounded-lg border bg-muted/50 p-4">
        <p className="text-xs font-medium uppercase text-muted-foreground">Read-only</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div>
            <span className="text-xs text-muted-foreground">Slug</span>
            <p className="text-sm font-mono">{store.slug}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">License #</span>
            <p className="text-sm font-mono">{store.licenseNumber}</p>
          </div>
        </div>
      </div>

      {/* Branding */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <FileUpload
          bucket="store-logos"
          entityId={store.id}
          label="Store Logo"
          maxSizeMB={2}
          accept="image/jpeg,image/png,image/webp"
          previewUrl={store.logoUrl ?? undefined}
          onUploadComplete={() => {
            void utils.storeOwner.getMyStore.invalidate();
            void refetch();
          }}
        />
        <FileUpload
          bucket="store-banners"
          entityId={store.id}
          label="Store Banner"
          maxSizeMB={5}
          accept="image/jpeg,image/png,image/webp"
          previewUrl={store.bannerUrl ?? undefined}
          onUploadComplete={() => {
            void refetch();
          }}
        />
      </div>

      {/* Editable form */}
      <form
        onSubmit={handleSubmit((data) => updateMutation.mutate(data))}
        className="mt-6 space-y-4"
      >
        <div>
          <label className="text-sm font-medium">Store Name *</label>
          <input
            {...register("name")}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
          {errors.name && (
            <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium">Description</label>
          <textarea
            {...register("description")}
            rows={3}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
          {errors.description && (
            <p className="mt-1 text-xs text-destructive">{errors.description.message}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Phone *</label>
            <input
              {...register("phone")}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
            {errors.phone && (
              <p className="mt-1 text-xs text-destructive">{errors.phone.message}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">Email *</label>
            <input
              {...register("email")}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Address Line 1 *</label>
          <input
            {...register("addressLine1")}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
          {errors.addressLine1 && (
            <p className="mt-1 text-xs text-destructive">{errors.addressLine1.message}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium">Address Line 2</label>
          <input
            {...register("addressLine2")}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-sm font-medium">City *</label>
            <input
              {...register("city")}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
            {errors.city && (
              <p className="mt-1 text-xs text-destructive">{errors.city.message}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">State *</label>
            <input
              {...register("state")}
              maxLength={2}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
            {errors.state && (
              <p className="mt-1 text-xs text-destructive">{errors.state.message}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">ZIP *</label>
            <input
              {...register("zip")}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
            {errors.zip && (
              <p className="mt-1 text-xs text-destructive">{errors.zip.message}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={!isDirty || updateMutation.isPending}
            className="rounded-md bg-primary px-6 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
