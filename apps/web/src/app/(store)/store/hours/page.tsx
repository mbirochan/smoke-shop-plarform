"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type UpdateOperatingHoursInput,
  updateOperatingHoursSchema,
} from "@smoke-shop/validators";
import { trpc } from "@/lib/trpc";
import { useCurrentStore } from "@/hooks/use-current-store";

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const DAY_LABELS: Record<string, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

const defaultHours = {
  open: "09:00",
  close: "21:00",
  closed: false,
};

export default function StoreHoursPage() {
  const { store, isLoading, refetch } = useCurrentStore();
  const utils = trpc.useUtils();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<UpdateOperatingHoursInput>({
    resolver: zodResolver(updateOperatingHoursSchema),
    defaultValues: {
      operatingHours: Object.fromEntries(
        DAYS.map((d) => [d, { ...defaultHours }]),
      ) as UpdateOperatingHoursInput["operatingHours"],
    },
  });

  useEffect(() => {
    if (store?.operatingHours) {
      const hours = store.operatingHours as UpdateOperatingHoursInput["operatingHours"];
      reset({ operatingHours: hours });
    }
  }, [store, reset]);

  const hours = watch("operatingHours");

  const updateMutation = trpc.storeOwner.updateHours.useMutation({
    onSuccess: () => {
      utils.storeOwner.getMyStore.invalidate();
      refetch();
    },
  });

  function copyToAll(sourceDay: (typeof DAYS)[number]) {
    const source = hours[sourceDay];
    for (const day of DAYS) {
      if (day !== sourceDay) {
        setValue(`operatingHours.${day}.open`, source.open, { shouldDirty: true });
        setValue(`operatingHours.${day}.close`, source.close, { shouldDirty: true });
        setValue(`operatingHours.${day}.closed`, source.closed, { shouldDirty: true });
      }
    }
  }

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
      <h1 className="text-2xl font-bold">Operating Hours</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Set your store&apos;s opening and closing times for each day.
      </p>

      {updateMutation.isSuccess && (
        <div className="mt-4 rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
          Hours updated successfully.
        </div>
      )}

      {updateMutation.isError && (
        <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {updateMutation.error.message}
        </div>
      )}

      <form
        onSubmit={handleSubmit((data) => updateMutation.mutate(data))}
        className="mt-6 space-y-4"
      >
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => copyToAll("mon")}
            className="text-xs text-primary hover:underline"
          >
            Copy Monday to all days
          </button>
        </div>

        <div className="space-y-3">
          {DAYS.map((day) => (
            <div
              key={day}
              className="flex flex-wrap items-center gap-3 rounded-lg border p-3"
            >
              <span className="w-24 text-sm font-medium">{DAY_LABELS[day]}</span>
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  {...register(`operatingHours.${day}.closed`)}
                />
                Closed
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  {...register(`operatingHours.${day}.open`)}
                  disabled={hours[day]?.closed}
                  className="rounded-md border bg-background px-2 py-1.5 text-sm disabled:opacity-50"
                />
                <span className="text-sm text-muted-foreground">to</span>
                <input
                  type="time"
                  {...register(`operatingHours.${day}.close`)}
                  disabled={hours[day]?.closed}
                  className="rounded-md border bg-background px-2 py-1.5 text-sm disabled:opacity-50"
                />
              </div>
            </div>
          ))}
        </div>

        {errors.operatingHours && (
          <p className="text-xs text-destructive">Please fill in all operating hours</p>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={!isDirty || updateMutation.isPending}
            className="rounded-md bg-primary px-6 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {updateMutation.isPending ? "Saving..." : "Save Hours"}
          </button>
        </div>
      </form>
    </div>
  );
}
