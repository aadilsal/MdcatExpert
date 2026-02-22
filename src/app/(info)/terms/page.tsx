export default function TermsPage() {
    return (
        <article className="prose prose-blue max-w-none">
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight mb-8">Terms of <span className="text-primary-600">Service</span></h1>
            <p className="text-lg text-gray-500 font-medium mb-12">Last Updated: February 22, 2026</p>

            <section className="space-y-6 mb-12 text-gray-600 font-medium leading-relaxed">
                <h2 className="text-2xl font-black text-gray-900 pt-8 border-t border-gray-100 uppercase tracking-wider text-sm">1. Acceptance of Terms</h2>
                <p>
                    By accessing and using MdcatXpert (&quot;the Platform&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Platform.
                </p>

                <h2 className="text-2xl font-black text-gray-900 pt-8 border-t border-gray-100 uppercase tracking-wider text-sm">2. Use of the Platform</h2>
                <p>
                    MdcatXpert is designed to provide educational materials, specifically MDCAT past papers and mock tests, for personal, non-commercial use. You agree not to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                    <li>Copy, redistribute, or resell any content from the Platform.</li>
                    <li>Attempt to bypass any security measures or access restricted data.</li>
                    <li>Use the Platform for any illegal or unauthorized purpose.</li>
                </ul>

                <h2 className="text-2xl font-black text-gray-900 pt-8 border-t border-gray-100 uppercase tracking-wider text-sm">3. Accuracy of Materials</h2>
                <p>
                    While we strive for 100% accuracy in our past papers and solutions, the materials on MdcatXpert are provided for educational purposes only. We do not guarantee that all information is free from errors or reflects the precise latest syllabus changes of official examination bodies.
                </p>

                <h2 className="text-2xl font-black text-gray-900 pt-8 border-t border-gray-100 uppercase tracking-wider text-sm">4. Limitation of Liability</h2>
                <p>
                    MdcatXpert and its creators shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use the Platform, including but not limited to exam results.
                </p>

                <h2 className="text-2xl font-black text-gray-900 pt-8 border-t border-gray-100 uppercase tracking-wider text-sm">5. Modifications to Service</h2>
                <p>
                    We reserve the right to modify or discontinue the Platform (or any part thereof) without notice at any time. We shall not be liable to you or any third party for any modification, suspension, or discontinuance of the service.
                </p>
            </section>
        </article>
    );
}
