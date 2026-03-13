"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  onboardingStep1Schema,
  onboardingStep2Schema,
  onboardingStep3Schema,
  onboardingStep4Schema,
} from "@smoke-shop/validators";
import { trpc } from "@/lib/trpc";
import { FileUpload } from "@/components/shared/file-upload";

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

const STEPS = [
  "Business Info",
  "Location",
  "License & Compliance",
  "Operating Hours",
  "Branding",
];

type Step1Data = z.infer<typeof onboardingStep1Schema>;
type Step2Data = z.infer<typeof onboardingStep2Schema>;
type Step3Data = z.infer<typeof onboardingStep3Schema>;
type Step4Data = z.infer<typeof onboardingStep4Schema>;

const defaultHours = {
  open: "09:00",
  close: "21:00",
  closed: false,
};

export default function StoreOnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [step2Data, setStep2Data] = useState<Step2Data | null>(null);
  const [step3Data, setStep3Data] = useState<Step3Data | null>(null);
  const [step4Data, setStep4Data] = useState<Step4Data | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | undefined>();
  const [bannerUrl, setBannerUrl] = useState<string | undefined>();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const submitMutation = trpc.storeOwner.submitOnboarding.useMutation({
    onSuccess: () => {
      router.push("/store");
    },
    onError: (err) => {
      setSubmitError(err.message);
    },
  });

  function goNext() {
    setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setCurrentStep((s) => Math.max(s - 1, 0));
  }

  async function handleFinalSubmit() {
    if (!step1Data || !step2Data || !step3Data || !step4Data) return;
    setSubmitError(null);
    submitMutation.mutate({
      step1: step1Data,
      step2: step2Data,
      step3: step3Data,
      step4: step4Data,
      logoUrl,
      bannerUrl,
    });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">Store Onboarding</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Complete all steps to submit your store for review.
      </p>

      {/* Step indicator */}
      <div className="mt-6 flex gap-1">
        {STEPS.map((label, i) => (
          <div key={label} className="flex-1">
            <div
              className={`h-1.5 rounded-full ${
                i <= currentStep ? "bg-primary" : "bg-secondary"
              }`}
            />
            <p
              className={`mt-1 text-xs ${
                i === currentStep
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-lg border p-6">
        {currentStep === 0 && (
          <Step1Form
            defaultValues={step1Data}
            onSubmit={(data) => {
              setStep1Data(data);
              goNext();
            }}
          />
        )}
        {currentStep === 1 && (
          <Step2Form
            defaultValues={step2Data}
            onSubmit={(data) => {
              setStep2Data(data);
              goNext();
            }}
            onBack={goBack}
          />
        )}
        {currentStep === 2 && (
          <Step3Form
            defaultValues={step3Data}
            onSubmit={(data) => {
              setStep3Data(data);
              goNext();
            }}
            onBack={goBack}
          />
        )}
        {currentStep === 3 && (
          <Step4Form
            defaultValues={step4Data}
            onSubmit={(data) => {
              setStep4Data(data);
              goNext();
            }}
            onBack={goBack}
          />
        )}
        {currentStep === 4 && (
          <Step5Branding
            logoUrl={logoUrl}
            bannerUrl={bannerUrl}
            onLogoChange={setLogoUrl}
            onBannerChange={setBannerUrl}
            onBack={goBack}
            onSubmit={handleFinalSubmit}
            isSubmitting={submitMutation.isPending}
            error={submitError}
          />
        )}
      </div>
    </div>
  );
}

/* ─── Step 1: Business Info ─── */
function Step1Form({
  defaultValues,
  onSubmit,
}: {
  defaultValues: Step1Data | null;
  onSubmit: (data: Step1Data) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Step1Data>({
    resolver: zodResolver(onboardingStep1Schema),
    defaultValues: defaultValues ?? undefined,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-lg font-semibold">Business Information</h2>
      <div>
        <label className="text-sm font-medium">Store Name *</label>
        <input
          {...register("name")}
          className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
          placeholder="My Smoke Shop"
        />
        {errors.name && (
          <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Business Phone *</label>
          <input
            {...register("phone")}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="(555) 123-4567"
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-destructive">{errors.phone.message}</p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium">Business Email *</label>
          <input
            {...register("email")}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="store@example.com"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Description</label>
        <textarea
          {...register("description")}
          rows={3}
          className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
          placeholder="Tell customers about your store..."
        />
        {errors.description && (
          <p className="mt-1 text-xs text-destructive">{errors.description.message}</p>
        )}
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-md bg-primary px-6 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          Next
        </button>
      </div>
    </form>
  );
}

/* ─── Step 2: Location ─── */
function Step2Form({
  defaultValues,
  onSubmit,
  onBack,
}: {
  defaultValues: Step2Data | null;
  onSubmit: (data: Step2Data) => void;
  onBack: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Step2Data>({
    resolver: zodResolver(onboardingStep2Schema),
    defaultValues: defaultValues ?? undefined,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-lg font-semibold">Location</h2>
      <div>
        <label className="text-sm font-medium">Address Line 1 *</label>
        <input
          {...register("addressLine1")}
          className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
          placeholder="123 Main St"
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
          placeholder="Suite 100"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="text-sm font-medium">City *</label>
          <input
            {...register("city")}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="Houston"
          />
          {errors.city && (
            <p className="mt-1 text-xs text-destructive">{errors.city.message}</p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium">State *</label>
          <input
            {...register("state")}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="TX"
            maxLength={2}
          />
          {errors.state && (
            <p className="mt-1 text-xs text-destructive">{errors.state.message}</p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium">ZIP Code *</label>
          <input
            {...register("zip")}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="77001"
          />
          {errors.zip && (
            <p className="mt-1 text-xs text-destructive">{errors.zip.message}</p>
          )}
        </div>
      </div>
      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border px-6 py-2 text-sm hover:bg-accent"
        >
          Back
        </button>
        <button
          type="submit"
          className="rounded-md bg-primary px-6 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          Next
        </button>
      </div>
    </form>
  );
}

/* ─── Step 3: License & Compliance ─── */
function Step3Form({
  defaultValues,
  onSubmit,
  onBack,
}: {
  defaultValues: Step3Data | null;
  onSubmit: (data: Step3Data) => void;
  onBack: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Step3Data>({
    resolver: zodResolver(onboardingStep3Schema),
    defaultValues: defaultValues ?? { tosAccepted: undefined },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-lg font-semibold">License & Compliance</h2>
      <div>
        <label className="text-sm font-medium">Tobacco Retail License Number *</label>
        <input
          {...register("licenseNumber")}
          className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
          placeholder="TRL-12345678"
        />
        {errors.licenseNumber && (
          <p className="mt-1 text-xs text-destructive">{errors.licenseNumber.message}</p>
        )}
      </div>
      <div>
        <label className="text-sm font-medium">License Expiry Date *</label>
        <input
          type="date"
          {...register("licenseExpiry")}
          className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
        {errors.licenseExpiry && (
          <p className="mt-1 text-xs text-destructive">{errors.licenseExpiry.message}</p>
        )}
      </div>
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          {...register("tosAccepted")}
          id="tos"
          className="mt-1"
        />
        <label htmlFor="tos" className="text-sm">
          I agree to the Terms of Service and confirm that all information provided is accurate.
          I understand that operating without a valid tobacco retail license is a violation of Texas law.
        </label>
      </div>
      {errors.tosAccepted && (
        <p className="text-xs text-destructive">{errors.tosAccepted.message}</p>
      )}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border px-6 py-2 text-sm hover:bg-accent"
        >
          Back
        </button>
        <button
          type="submit"
          className="rounded-md bg-primary px-6 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          Next
        </button>
      </div>
    </form>
  );
}

/* ─── Step 4: Operating Hours ─── */
function Step4Form({
  defaultValues,
  onSubmit,
  onBack,
}: {
  defaultValues: Step4Data | null;
  onSubmit: (data: Step4Data) => void;
  onBack: () => void;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Step4Data>({
    resolver: zodResolver(onboardingStep4Schema),
    defaultValues: defaultValues ?? {
      operatingHours: Object.fromEntries(
        DAYS.map((d) => [d, { ...defaultHours }]),
      ) as Step4Data["operatingHours"],
    },
  });

  const hours = watch("operatingHours");

  function copyToAll(sourceDay: (typeof DAYS)[number]) {
    const source = hours[sourceDay];
    for (const day of DAYS) {
      if (day !== sourceDay) {
        setValue(`operatingHours.${day}.open`, source.open);
        setValue(`operatingHours.${day}.close`, source.close);
        setValue(`operatingHours.${day}.closed`, source.closed);
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Operating Hours</h2>
        <button
          type="button"
          onClick={() => copyToAll("mon")}
          className="text-xs text-primary hover:underline"
        >
          Copy Monday to all
        </button>
      </div>
      <div className="space-y-3">
        {DAYS.map((day) => (
          <div key={day} className="flex items-center gap-3">
            <span className="w-24 text-sm font-medium">{DAY_LABELS[day]}</span>
            <label className="flex items-center gap-1 text-xs">
              <input type="checkbox" {...register(`operatingHours.${day}.closed`)} />
              Closed
            </label>
            <input
              type="time"
              {...register(`operatingHours.${day}.open`)}
              disabled={hours[day]?.closed}
              className="rounded-md border bg-background px-2 py-1 text-sm disabled:opacity-50"
            />
            <span className="text-sm text-muted-foreground">to</span>
            <input
              type="time"
              {...register(`operatingHours.${day}.close`)}
              disabled={hours[day]?.closed}
              className="rounded-md border bg-background px-2 py-1 text-sm disabled:opacity-50"
            />
          </div>
        ))}
      </div>
      {errors.operatingHours && (
        <p className="text-xs text-destructive">Please fill in all operating hours</p>
      )}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border px-6 py-2 text-sm hover:bg-accent"
        >
          Back
        </button>
        <button
          type="submit"
          className="rounded-md bg-primary px-6 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          Next
        </button>
      </div>
    </form>
  );
}

/* ─── Step 5: Branding (optional) ─── */
function Step5Branding({
  logoUrl,
  bannerUrl,
  onLogoChange,
  onBannerChange,
  onBack,
  onSubmit,
  isSubmitting,
  error,
}: {
  logoUrl?: string;
  bannerUrl?: string;
  onLogoChange: (url: string) => void;
  onBannerChange: (url: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  error: string | null;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Branding (Optional)</h2>
      <p className="text-sm text-muted-foreground">
        Upload a logo and banner for your store. You can skip this and add them later.
      </p>

      <FileUpload
        bucket="store-logos"
        label="Store Logo (square, max 2MB)"
        maxSizeMB={2}
        accept="image/jpeg,image/png,image/webp"
        onUploadComplete={onLogoChange}
        previewUrl={logoUrl}
      />

      <FileUpload
        bucket="store-banners"
        label="Store Banner (landscape, max 5MB)"
        maxSizeMB={5}
        accept="image/jpeg,image/png,image/webp"
        onUploadComplete={onBannerChange}
        previewUrl={bannerUrl}
      />

      {error && (
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border px-6 py-2 text-sm hover:bg-accent"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="rounded-md bg-primary px-6 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isSubmitting ? "Submitting..." : "Submit for Review"}
        </button>
      </div>
    </div>
  );
}
