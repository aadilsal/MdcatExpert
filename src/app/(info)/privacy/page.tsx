export default function PrivacyPage() {
    return (
        <article className="prose prose-blue max-w-none">
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight mb-8">Privacy <span className="text-primary-600">Policy</span></h1>
            <p className="text-lg text-gray-500 font-medium mb-12">Last Updated: February 22, 2026</p>

            <section className="space-y-6 mb-12 text-gray-600 font-medium leading-relaxed">
                <h2 className="text-2xl font-black text-gray-900 pt-8 border-t border-gray-100 uppercase tracking-wider text-sm">1. Information We Collect</h2>
                <p>
                    When you create an account, we collect your name and email address. We also collect data regarding your quiz attempts, scores, and time taken to provide you with personalized analytics.
                </p>

                <h2 className="text-2xl font-black text-gray-900 pt-8 border-t border-gray-100 uppercase tracking-wider text-sm">2. How We Use Your Data</h2>
                <p>
                    We use the collected information to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                    <li>Maintain your account and security.</li>
                    <li>Generate performance insights (Analytics).</li>
                    <li>Communicate with you regarding updates or support requests.</li>
                </ul>

                <h2 className="text-2xl font-black text-gray-900 pt-8 border-t border-gray-100 uppercase tracking-wider text-sm">3. Data Sharing</h2>
                <p>
                    We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties. Your data is strictly used for the Platform&apos;s educational functionality.
                </p>

                <h2 className="text-2xl font-black text-gray-900 pt-8 border-t border-gray-100 uppercase tracking-wider text-sm">4. Security</h2>
                <p>
                    We implement industry-standard security measures to protect your personal information. All authentication and data storage are handled through Supabase, ensuring enterprise-grade encryption and security.
                </p>

                <h2 className="text-2xl font-black text-gray-900 pt-8 border-t border-gray-100 uppercase tracking-wider text-sm">5. Your Rights</h2>
                <p>
                    You have the right to access, correct, or delete your personal data at any time. If you wish to delete your account, please contact us at support@mdcatxpert.com.
                </p>
            </section>
        </article>
    );
}
