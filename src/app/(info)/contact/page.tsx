"use client";

import { useActionState, useState } from "react";
import { motion } from "framer-motion";
import { Mail, MessageCircle, Send, Globe, Sparkles, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { sendContactEmail } from "./actions";

export default function ContactPage() {
    const [state, action, isPending] = useActionState(sendContactEmail, null);

    if (state?.success) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20 space-y-8"
            >
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-emerald-600/10">
                    <CheckCircle className="w-10 h-10" />
                </div>
                <div className="space-y-4">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Message Received.</h1>
                    <p className="text-xl text-gray-500 font-medium max-w-md mx-auto leading-relaxed">
                        Thank you for reaching out! Our team will get back to you within 24 hours.
                    </p>
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center gap-2 text-primary-600 font-black uppercase tracking-widest text-sm hover:text-primary-700 transition-colors"
                >
                    Send another message
                </button>
            </motion.div>
        );
    }

    return (
        <div className="space-y-16">
            <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-black uppercase tracking-widest mb-2">
                    <MessageCircle className="w-4 h-4" />
                    Get in Touch
                </div>
                <h1 className="text-4xl sm:text-6xl font-black text-gray-900 tracking-tight">Let&apos;s <span className="text-primary-600">talk.</span></h1>
                <p className="text-lg text-gray-500 max-w-xl mx-auto font-medium">Have a question or feedback? We&apos;d love to hear from you. Our team typically responds within 24 hours.</p>
            </div>

            <div className="grid lg:grid-cols-5 gap-12 lg:gap-20">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-2 space-y-12"
                >
                    <div className="space-y-8">
                        <div className="group flex items-start gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                <Mail className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs mb-2">Email Us</h3>
                                <p className="text-lg font-bold text-gray-700">support@mdcatxpert.com</p>
                                <p className="text-sm text-gray-400 font-medium leading-relaxed">For support, feedback, or collaborations.</p>
                            </div>
                        </div>

                        <div className="group flex items-start gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                <Globe className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs mb-2">Location</h3>
                                <p className="text-lg font-bold text-gray-700">Pakistan</p>
                                <p className="text-sm text-gray-400 font-medium leading-relaxed">Serving MDCAT aspirants nationwide.</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 rounded-[2.5rem] bg-gray-900 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-primary-500/20 rounded-full blur-[60px] pointer-events-none" />
                        <Sparkles className="w-8 h-8 text-primary-400 mb-6" />
                        <h4 className="text-xl font-black mb-2 leading-tight">Join our Community</h4>
                        <p className="text-gray-400 text-sm font-medium leading-relaxed mb-6">Connect with fellow medical aspirants and share your journey.</p>
                        <div className="flex gap-4">
                            {['FB', 'IG', 'LI'].map(i => (
                                <div key={i} className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center font-black text-[10px] hover:bg-white hover:text-black transition-all cursor-pointer">
                                    {i}
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-3 bg-white border border-gray-100 p-8 sm:p-12 rounded-[2.5rem] shadow-xl shadow-gray-200/50"
                >
                    {state?.error && (
                        <div className="mb-8 p-4 rounded-2xl bg-red-50 border border-red-100 flex items-center gap-3 text-red-700 text-sm font-bold animate-shake">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            {state.error}
                        </div>
                    )}

                    <form action={action} className="space-y-6">
                        <div className="grid sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-900 uppercase tracking-widest ml-1">First Name</label>
                                <input name="firstName" type="text" placeholder="Ahmad" className={`w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-4 focus:ring-primary-100 focus:bg-white focus:border-primary-500 transition-all text-sm font-medium ${state?.fieldErrors?.firstName ? "border-red-300 ring-red-50" : ""}`} />
                                {state?.fieldErrors?.firstName && <p className="text-xs font-bold text-red-500 ml-1">{state.fieldErrors.firstName[0]}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-900 uppercase tracking-widest ml-1">Last Name</label>
                                <input name="lastName" type="text" placeholder="Ali" className={`w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-4 focus:ring-primary-100 focus:bg-white focus:border-primary-500 transition-all text-sm font-medium ${state?.fieldErrors?.lastName ? "border-red-300 ring-red-50" : ""}`} />
                                {state?.fieldErrors?.lastName && <p className="text-xs font-bold text-red-500 ml-1">{state.fieldErrors.lastName[0]}</p>}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-900 uppercase tracking-widest ml-1">Email Address</label>
                            <input name="email" type="email" placeholder="you@example.com" className={`w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-4 focus:ring-primary-100 focus:bg-white focus:border-primary-500 transition-all text-sm font-medium ${state?.fieldErrors?.email ? "border-red-300 ring-red-50" : ""}`} />
                            {state?.fieldErrors?.email && <p className="text-xs font-bold text-red-500 ml-1">{state.fieldErrors.email[0]}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-900 uppercase tracking-widest ml-1">Subject</label>
                            <select name="subject" className={`w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-4 focus:ring-primary-100 focus:bg-white focus:border-primary-500 transition-all text-sm font-medium appearance-none ${state?.fieldErrors?.subject ? "border-red-300 ring-red-50" : ""}`}>
                                <option value="">Select a subject</option>
                                <option value="General Inquiry">General Inquiry</option>
                                <option value="Technical Support">Technical Support</option>
                                <option value="Feedback">Feedback</option>
                            </select>
                            {state?.fieldErrors?.subject && <p className="text-xs font-bold text-red-500 ml-1">{state.fieldErrors.subject[0]}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-900 uppercase tracking-widest ml-1">Message</label>
                            <textarea name="message" rows={4} placeholder="How can we help?" className={`w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-4 focus:ring-primary-100 focus:bg-white focus:border-primary-500 transition-all text-sm font-medium resize-none ${state?.fieldErrors?.message ? "border-red-300 ring-red-50" : ""}`}></textarea>
                            {state?.fieldErrors?.message && <p className="text-xs font-bold text-red-500 ml-1">{state.fieldErrors.message[0]}</p>}
                        </div>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-700 transition-all shadow-xl shadow-primary-600/30 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isPending ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    <span>Send Message</span>
                                    <Send className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
