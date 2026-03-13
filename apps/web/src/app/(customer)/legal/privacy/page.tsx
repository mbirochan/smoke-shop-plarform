import { PLATFORM_NAME } from "@/lib/constants";

export const metadata = {
  title: `Privacy Policy — ${PLATFORM_NAME}`,
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl py-8">
      <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
        DRAFT — This document requires legal review before launch.
      </div>

      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: March 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold">1. Information We Collect</h2>
          <p className="mt-2">We collect the following types of information:</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li><strong>Account information:</strong> Name, email, phone number, password (hashed)</li>
            <li><strong>Identity verification:</strong> Verification status and session ID only — we do NOT store your ID documents</li>
            <li><strong>Order information:</strong> Items purchased, delivery addresses, payment status</li>
            <li><strong>Usage data:</strong> Pages visited, actions taken, device and browser type</li>
            <li><strong>Location data:</strong> When you use the store finder (with your permission)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">2. How We Use Your Information</h2>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>To process and deliver your orders</li>
            <li>To verify your age as required by law</li>
            <li>To communicate about your orders and account</li>
            <li>To improve our services and user experience</li>
            <li>To prevent fraud and comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">3. Third-Party Sharing</h2>
          <p className="mt-2">We share data with these service providers:</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li><strong>Veriff:</strong> Identity verification — receives your name for verification purposes</li>
            <li><strong>Authorize.net:</strong> Payment processing — receives tokenized card data (we never see your card number)</li>
            <li><strong>DoorDash Drive:</strong> Delivery — receives delivery address and order details</li>
            <li><strong>Store owners:</strong> Your name, contact info, and order details for fulfillment</li>
          </ul>
          <p className="mt-2">We do NOT sell your personal information to third parties.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">4. Data Retention</h2>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>Account data: retained while your account is active</li>
            <li>Order records: retained for 7 years (tax and compliance)</li>
            <li>Audit logs: retained for 7 years</li>
            <li>IDV verification results: retained for 365 days, then re-verification required</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">5. Your Rights</h2>
          <p className="mt-2">You have the right to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Correction:</strong> Update inaccurate information</li>
            <li><strong>Deletion:</strong> Request deletion of your account and personal data (subject to legal retention requirements)</li>
            <li><strong>Opt-out:</strong> Disable non-essential email notifications in your account settings</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">6. Security</h2>
          <p className="mt-2">
            We implement industry-standard security measures including encrypted data
            transmission (HTTPS/TLS), password hashing (bcrypt), PCI-compliant payment
            tokenization, and role-based access controls. Card numbers never touch our
            servers.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">7. Cookies</h2>
          <p className="mt-2">
            We use essential cookies for authentication and session management. We do not
            use tracking cookies or third-party advertising cookies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">8. Children&apos;s Privacy</h2>
          <p className="mt-2">
            Our Platform is not intended for anyone under 21 years of age. We do not
            knowingly collect information from minors. Age verification is required before
            any purchase.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">9. Changes to This Policy</h2>
          <p className="mt-2">
            We may update this Privacy Policy from time to time. We will notify you of
            significant changes via email or an in-app notification.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">10. Contact</h2>
          <p className="mt-2">
            For privacy-related questions or to exercise your rights, contact us at
            privacy@smokeshop.com.
          </p>
        </section>
      </div>
    </div>
  );
}
