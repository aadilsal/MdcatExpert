import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy",
  description:
    "MdcatXpert's refund policy for the Monthly Pass and Elite Annual plans — digital access, no auto-renewal, and how to request a refund review.",
};

export default function RefundPolicyPage() {
    return (
        <article className="prose prose-blue max-w-none">
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-8">Refund <span className="text-primary-600">Policy</span></h1>
            <p className="text-lg text-gray-500 dark:text-slate-400 font-medium mb-12">Last Updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

            <section className="space-y-6 mb-12 text-gray-600 dark:text-slate-400 font-medium leading-relaxed">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white pt-8 border-t border-gray-100 dark:border-slate-800 uppercase tracking-wider text-sm">1. Digital Product, Instant Access</h2>
                <p>
                    MdcatXpert&apos;s Monthly Pass and Elite Annual pass are digital products that unlock instantly upon successful payment — you get full access to premium quizzes, the Study Copilot, and the AI Weakness Radar the moment your payment is confirmed, with no waiting period.
                </p>

                <h2 className="text-2xl font-black text-gray-900 dark:text-white pt-8 border-t border-gray-100 dark:border-slate-800 uppercase tracking-wider text-sm">2. No Refunds Once Activated</h2>
                <p>
                    Because access activates immediately and the content becomes available to you in full at that moment, all payments are final once your plan is active. We do not offer refunds for change of mind, unused time remaining on a plan, or partial use of a billing period.
                </p>

                <h2 className="text-2xl font-black text-gray-900 dark:text-white pt-8 border-t border-gray-100 dark:border-slate-800 uppercase tracking-wider text-sm">3. Failed or Duplicate Payments</h2>
                <p>
                    If you were charged but never received premium access (a technical failure on our end), or if you were accidentally charged twice for the same plan, contact us at support@mdcatxpert.com with your payment reference number and we will investigate and refund the erroneous charge.
                </p>

                <h2 className="text-2xl font-black text-gray-900 dark:text-white pt-8 border-t border-gray-100 dark:border-slate-800 uppercase tracking-wider text-sm">4. No Auto-Renewal</h2>
                <p>
                    Neither plan renews automatically. Your access simply ends at the end of the paid period (30 days for the Monthly Pass, 365 days for the Elite Annual pass) — you will never be charged again without taking a new, separate action to purchase.
                </p>

                <h2 className="text-2xl font-black text-gray-900 dark:text-white pt-8 border-t border-gray-100 dark:border-slate-800 uppercase tracking-wider text-sm">5. How to Request a Refund Review</h2>
                <p>
                    Email support@mdcatxpert.com with your account email and payment reference number. We aim to respond within 24 hours.
                </p>

                <h2 className="text-2xl font-black text-gray-900 dark:text-white pt-8 border-t border-gray-100 dark:border-slate-800 uppercase tracking-wider text-sm">6. Contact</h2>
                <p>
                    MdcatXpert, Gulberg III, Lahore, Pakistan. Phone: 0303-5116528. Email: support@mdcatxpert.com.
                </p>
            </section>
        </article>
    );
}
