import { Search, MessageCircle, Mail, MapPin, ChevronRight, HelpCircle, BookOpen, Target, BarChart3 } from "lucide-react";

export default function HelpPage() {
    const faqs = [
        {
            category: "Getting Started",
            icon: BookOpen,
            questions: [
                { q: "Is MdcatXpert really free?", a: "Yes, MdcatXpert is 100% free for all MDCAT aspirants. We provide access to all past papers and analytics without any subscription fees." },
                { q: "How do I take a quiz?", a: "Simply log in to your account, navigate to the 'Papers' tab, and select any year's paper to start your timed quiz." }
            ]
        },
        {
            category: "Analytics & Performance",
            icon: BarChart3,
            questions: [
                { q: "How is my score calculated?", a: "Your score is calculated based on the official MDCAT marking scheme. We also provide subject-wise accuracy breakdowns to help you improve." },
                { q: "Can I reset my progress?", a: "Currently, we keep all your attempt history so you can track your growth over time. You can always retake a paper to see your improvement." }
            ]
        },
        {
            category: "Technical Support",
            icon: Target,
            questions: [
                { q: "What should I do if a question has an error?", a: "We strive for 100% accuracy. If you spot an error, please contact us via the Contact Us page or email support@mdcatxpert.com with the paper year and question number." },
                { q: "Does the app work offline?", a: "Currently, MdcatXpert requires an active internet connection to securely save your attempts and calculate real-time analytics." }
            ]
        }
    ];

    return (
        <div className="space-y-16">
            <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-black uppercase tracking-widest mb-2">
                    <HelpCircle className="w-4 h-4" />
                    Support Center
                </div>
                <h1 className="text-4xl sm:text-6xl font-black text-gray-900 tracking-tight">How can we <span className="text-primary-600">help?</span></h1>
                <p className="text-lg text-gray-500 max-w-2xl mx-auto font-medium">Search our knowledge base or browse help topics below.</p>

                <div className="max-w-xl mx-auto pt-8">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search for articles..."
                            className="w-full pl-12 pr-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-4 focus:ring-primary-100 focus:bg-white focus:border-primary-500 transition-all text-sm font-medium"
                        />
                    </div>
                </div>
            </div>

            <div className="grid gap-12 pt-8">
                {faqs.map((group) => (
                    <div key={group.category} className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600">
                                <group.icon className="w-5 h-5" />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 leading-none">{group.category}</h2>
                        </div>
                        <div className="grid gap-4">
                            {group.questions.map((faq) => (
                                <div key={faq.q} className="p-6 rounded-2xl bg-white border border-gray-100 hover:border-primary-100 hover:shadow-xl hover:shadow-primary-600/5 transition-all group">
                                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">{faq.q}</h3>
                                    <p className="text-gray-500 font-medium leading-relaxed">{faq.a}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-black rounded-[2.5rem] p-10 sm:p-16 text-center text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary-600/20 rounded-full blur-[100px] pointer-events-none" />
                <h2 className="text-3xl font-black mb-4">Still have questions?</h2>
                <p className="text-gray-400 mb-10 max-w-sm mx-auto font-medium">We&apos;re here to help you on your medical journey. Get in touch with our team.</p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                    <a href="mailto:support@mdcatxpert.com" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-black rounded-2xl hover:bg-gray-100 transition-all active:scale-95">
                        <Mail className="w-5 h-5" />
                        Email Support
                    </a>
                </div>
            </div>
        </div>
    );
}
