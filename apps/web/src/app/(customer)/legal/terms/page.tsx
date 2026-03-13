import { PLATFORM_NAME } from "@/lib/constants";

export const metadata = {
  title: `Terms of Service — ${PLATFORM_NAME}`,
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl py-8">
      <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
        DRAFT — This document requires legal review before launch.
      </div>

      <h1 className="text-3xl font-bold">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: March 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold">1. Acceptance of Terms</h2>
          <p className="mt-2">
            By accessing or using {PLATFORM_NAME} (&quot;the Platform&quot;), you agree to be
            bound by these Terms of Service. If you do not agree, do not use the Platform.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">2. Age Restriction</h2>
          <p className="mt-2">
            You must be at least 21 years of age to purchase tobacco and vape products
            through this Platform. You will be required to verify your age through our
            identity verification process before making any purchase. Providing false
            information about your age is a violation of these Terms and may be a violation
            of law.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">3. Account Registration</h2>
          <p className="mt-2">
            You are responsible for maintaining the confidentiality of your account
            credentials. You agree to notify us immediately of any unauthorized use of your
            account. You are responsible for all activity under your account.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">4. Products and Pricing</h2>
          <p className="mt-2">
            All products are sold by independent store owners through the Platform.
            {PLATFORM_NAME} acts as a marketplace facilitator. Prices are set by individual
            stores and may vary. All prices are in US dollars and are subject to applicable
            taxes.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">5. Orders and Payment</h2>
          <p className="mt-2">
            By placing an order, you authorize us to charge your payment method for the
            total order amount including taxes and delivery fees. Payment is authorized at
            order time and captured when the store begins preparing your order. Orders may
            be cancelled before preparation begins.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">6. Delivery</h2>
          <p className="mt-2">
            Delivery is provided through third-party delivery partners. A valid ID showing
            you are 21 or older may be required at the time of delivery. If age cannot be
            verified at delivery, the order will be returned.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">7. Prohibited Use</h2>
          <p className="mt-2">
            You may not use the Platform to: (a) purchase products for resale without
            proper licensing; (b) purchase products for minors; (c) engage in fraudulent
            activity; (d) interfere with the Platform&apos;s operation; (e) violate any
            applicable law or regulation.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">8. Limitation of Liability</h2>
          <p className="mt-2">
            {PLATFORM_NAME} is provided &quot;as is&quot; without warranties of any kind.
            To the maximum extent permitted by law, we shall not be liable for any
            indirect, incidental, special, or consequential damages arising from your use
            of the Platform.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">9. Dispute Resolution</h2>
          <p className="mt-2">
            Any disputes arising from these Terms shall be resolved through binding
            arbitration in the State of Texas, in accordance with the rules of the American
            Arbitration Association.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">10. Changes to Terms</h2>
          <p className="mt-2">
            We reserve the right to modify these Terms at any time. Continued use of the
            Platform after changes constitutes acceptance of the revised Terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">11. Contact</h2>
          <p className="mt-2">
            For questions about these Terms, contact us at legal@smokeshop.com.
          </p>
        </section>
      </div>
    </div>
  );
}
