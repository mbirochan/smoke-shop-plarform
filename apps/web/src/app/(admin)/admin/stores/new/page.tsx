"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { createStoreSchema } from "@smoke-shop/validators";
import type { CreateStoreInput } from "@smoke-shop/validators";

const defaultForm: CreateStoreInput = {
  name: "",
  phone: "",
  email: "",
  addressLine1: "",
  city: "",
  state: "TX",
  zip: "",
  licenseNumber: "",
  licenseExpiry: "",
};

export default function AdminNewStorePage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [form, setForm] = useState<CreateStoreInput>(defaultForm);

  const mutation = trpc.adminStore.create.useMutation({
    onSuccess: (store) => {
      if (store) router.push(`/admin/stores/${store.id}`);
    },
    onError: (err) => setError(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const parsed = createStoreSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "Invalid input");
      return;
    }
    mutation.mutate(parsed.data);
  }

  function updateField(field: keyof CreateStoreInput, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="mx-auto max-w-2xl">
      <button onClick={() => router.push("/admin/stores")} className="mb-4 text-sm text-muted-foreground hover:underline">
        &larr; Back to stores
      </button>
      <h1 className="mb-6 text-2xl font-bold">Create New Store</h1>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Store Name" value={form.name} onChange={(v) => updateField("name", v)} required />
        <FormField label="Phone" value={form.phone} onChange={(v) => updateField("phone", v)} required />
        <FormField label="Email" type="email" value={form.email} onChange={(v) => updateField("email", v)} required />
        <FormField label="Description" value={form.description ?? ""} onChange={(v) => updateField("description", v)} />
        <FormField label="Address" value={form.addressLine1} onChange={(v) => updateField("addressLine1", v)} required />
        <FormField label="Address Line 2" value={form.addressLine2 ?? ""} onChange={(v) => updateField("addressLine2", v)} />
        <div className="grid grid-cols-3 gap-3">
          <FormField label="City" value={form.city} onChange={(v) => updateField("city", v)} required />
          <FormField label="State" value={form.state} onChange={(v) => updateField("state", v)} required />
          <FormField label="ZIP" value={form.zip} onChange={(v) => updateField("zip", v)} required />
        </div>
        <FormField label="License Number" value={form.licenseNumber} onChange={(v) => updateField("licenseNumber", v)} required />
        <FormField label="License Expiry" type="date" value={form.licenseExpiry} onChange={(v) => updateField("licenseExpiry", v)} required />

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {mutation.isPending ? "Creating..." : "Create Store"}
        </button>
      </form>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <input
        type={type}
        required={required}
        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
