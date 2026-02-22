"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Upload,
    FileSpreadsheet,
    CheckCircle,
    AlertCircle,
    X,
    Loader2,
    Shield,
    Info,
    ChevronRight,
    Zap,
    Layers,
    Database,
} from "lucide-react";

export default function AdminUploadPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState("");
    const [year, setYear] = useState("");
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [result, setResult] = useState<{
        success?: boolean;
        total_inserted?: number;
        skipped_count?: number;
        skipped_rows?: number[];
        error?: string;
    } | null>(null);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const droppedFile = e.dataTransfer.files?.[0];
        if (
            droppedFile &&
            (droppedFile.name.endsWith(".xlsx") || droppedFile.name.endsWith(".xls"))
        ) {
            setFile(droppedFile);
            setResult(null);
        }
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file || !title.trim() || !year.trim()) return;

        setUploading(true);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("title", title.trim());
            formData.append("year", year.trim());

            const res = await fetch("/api/papers/upload", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setResult({
                    success: true,
                    total_inserted: data.total_inserted,
                    skipped_count: data.skipped_count,
                    skipped_rows: data.skipped_rows,
                });
                setFile(null);
                setTitle("");
                setYear("");
                if (fileInputRef.current) fileInputRef.current.value = "";
            } else {
                setResult({ success: false, error: data.error });
            }
        } catch {
            setResult({
                success: false,
                error: "Network error. Please try again.",
            });
        } finally {
            setUploading(false);
        }
    };

    const canUpload = file && title.trim() && year.trim() && !uploading;

    return (
        <div className="space-y-12 pb-20 max-w-6xl mx-auto">
            {/* Header Hero */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gray-900 border border-white/5 p-12 text-white shadow-2xl">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-[10px] font-black uppercase tracking-[0.2em] text-primary-400">
                            <Shield className="w-3.5 h-3.5" />
                            Admin Credentials Verified
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-none italic">
                            Control <span className="text-primary-500 italic">Center.</span>
                        </h1>
                        <p className="text-gray-400 font-medium max-w-md">
                            Upload and parse academic datasets with high-performance subject inference.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-white/5 backdrop-blur-xl p-4 rounded-3xl border border-white/5">
                            <Database className="w-6 h-6 text-primary-400 mb-2" />
                            <p className="text-xl font-bold italic line-clamp-1">Ready</p>
                            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Pipeline Status</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-xl p-4 rounded-3xl border border-white/5">
                            <Layers className="w-6 h-6 text-emerald-400 mb-2" />
                            <p className="text-xl font-bold italic line-clamp-1">XLSX</p>
                            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Target Engine</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Feedback Overlay */}
            <AnimatePresence>
                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`rounded-[2.5rem] border p-8 flex items-start gap-6 backdrop-blur-xl shadow-2xl ${result.success
                                ? "bg-emerald-500/10 border-emerald-500/20"
                                : "bg-red-500/10 border-red-500/20 text-red-100"
                            }`}
                    >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${result.success ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-red-500 text-white shadow-red-500/20"
                            }`}>
                            {result.success ? <CheckCircle className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
                        </div>
                        <div className="flex-1 space-y-2">
                            <h3 className={`text-2xl font-black tracking-tight ${result.success ? "text-emerald-900" : "text-red-900"}`}>
                                {result.success ? "Ingestion Successful." : "Ingestion Failed."}
                            </h3>
                            <p className={`font-bold ${result.success ? "text-emerald-800" : "text-red-800"}`}>
                                {result.success
                                    ? `${result.total_inserted} questions successfully committed to clusters.`
                                    : result.error
                                }
                                {result.skipped_count ? ` ${result.skipped_count} rows identified as non-standard.` : ""}
                            </p>
                            {result.success && (
                                <button
                                    onClick={() => router.push("/admin/papers")}
                                    className="inline-flex items-center gap-2 mt-2 text-emerald-700 font-black uppercase tracking-widest text-[10px] hover:text-emerald-900 transition-colors"
                                >
                                    Proceed to Repository <ChevronRight className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                        <button onClick={() => setResult(null)} className="p-2 hover:bg-black/5 rounded-xl transition-colors">
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Main Form Area */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Step 1: Meta-Data */}
                    <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl shadow-gray-200/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-3xl group-hover:bg-primary-500/10 transition-colors" />
                        <div className="relative mb-8">
                            <p className="text-[10px] font-black text-primary-500 uppercase tracking-[0.2em] mb-1">Step 01</p>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight italic">Dataset Definition.</h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Archive Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. MDCAT 2024 ELITE"
                                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 placeholder:text-gray-300 focus:outline-none focus:ring-4 focus:ring-primary-500/5 focus:bg-white focus:border-primary-500 transition-all font-bold text-gray-900 italic"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Release Year</label>
                                <input
                                    type="number"
                                    value={year}
                                    onChange={(e) => setYear(e.target.value)}
                                    placeholder="2024"
                                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 placeholder:text-gray-300 focus:outline-none focus:ring-4 focus:ring-primary-500/5 focus:bg-white focus:border-primary-500 transition-all font-bold text-gray-900 italic"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Step 2: Payload Injection */}
                    <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl shadow-gray-200/20 relative overflow-hidden group">
                        <div className="relative mb-8">
                            <p className="text-[10px] font-black text-primary-500 uppercase tracking-[0.2em] mb-1">Step 02</p>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight italic">Payload Injection.</h2>
                        </div>

                        <div
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`relative border-2 border-dashed rounded-[2rem] p-12 text-center transition-all duration-500 cursor-pointer group/drop ${dragActive
                                    ? "border-primary-500 bg-primary-500/5 scale-[1.01]"
                                    : file
                                        ? "border-emerald-500 bg-emerald-50"
                                        : "border-gray-100 bg-gray-50/50 hover:border-primary-300 hover:bg-white hover:scale-[1.01]"
                                }`}
                        >
                            <div className={`absolute inset-0 bg-primary-600/5 opacity-0 group-hover/drop:opacity-100 transition-opacity rounded-[2rem] pointer-events-none`} />

                            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileSelect} className="hidden" />

                            {file ? (
                                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-4 relative z-10 w-full max-w-sm mx-auto">
                                    <div className="w-20 h-20 bg-emerald-500 text-white rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/20">
                                        <FileSpreadsheet className="w-10 h-10" />
                                    </div>
                                    <div className="text-center w-full">
                                        <p className="text-xl font-black text-gray-900 truncate bg-emerald-100/50 px-4 py-1 rounded-full italic">{file.name}</p>
                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-2 bg-emerald-500/10 inline-block px-3 py-1 rounded-full border border-emerald-500/10">
                                            {(file.size / 1024).toFixed(1)} KB PAYLOAD
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                                        className="mt-2 p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all font-bold uppercase text-[9px] tracking-widest flex items-center gap-2"
                                    >
                                        <X className="w-4 h-4" /> Eject File
                                    </button>
                                </motion.div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="w-20 h-20 bg-white rounded-3xl border border-gray-100 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-gray-100 transition-transform group-hover/drop:scale-110 group-hover/drop:rotate-6">
                                        <FileSpreadsheet className="w-10 h-10 text-primary-500" />
                                    </div>
                                    <h3 className="text-2xl font-black text-gray-900 tracking-tight italic">Drag & Drop Dataset.</h3>
                                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Standard .XLSX Protocol Only</p>
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20">
                                        Browse Modules
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleUpload}
                            disabled={!canUpload}
                            className="w-full mt-10 flex items-center justify-center gap-4 px-8 py-6 bg-gray-900 text-white font-black rounded-3xl hover:bg-black transition-all shadow-2xl shadow-black/20 disabled:opacity-30 disabled:cursor-not-allowed group active:scale-[0.98]"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="w-6 h-6 animate-spin text-primary-400" />
                                    <span className="uppercase tracking-[0.2em] italic">Ingesting Data Stream...</span>
                                </>
                            ) : (
                                <>
                                    <span className="uppercase tracking-[0.2em] italic">Execute Batch Upload</span>
                                    <Zap className={`w-5 h-5 text-primary-500 group-hover:scale-125 transition-transform`} />
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Tactical Sidebar */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Format Checklist */}
                    <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl shadow-gray-200/20">
                        <div className="flex items-center gap-2 mb-6">
                            <Info className="w-5 h-5 text-primary-600" />
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Protocol Matrix</h3>
                        </div>
                        <div className="space-y-3">
                            {[
                                "Question Text",
                                "Option A, B, C, D",
                                "Correct Index (A/B/C/D)",
                                "Subject Classifier",
                            ].map((col, i) => (
                                <div key={col} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/50 border border-gray-100 group hover:border-primary-200 transition-colors">
                                    <span className="text-[10px] font-black text-primary-300 italic">0{i + 1}</span>
                                    <span className="text-xs font-bold text-gray-700">{col}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Inference Logic */}
                    <div className="bg-primary-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-2xl shadow-primary-600/20">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
                        <h3 className="text-[10px] font-black uppercase tracking-[.2em] text-primary-300 mb-4">Inference Engine</h3>
                        <p className="text-sm font-bold leading-relaxed mb-6 italic opacity-80">System automatically classifies question difficulty and cross-references subjects based on headers.</p>
                        <div className="flex flex-wrap gap-2">
                            {["BIOLOGY", "CHEMISTRY", "PHYSICS", "ENGLISH"].map(s => (
                                <span key={s} className="px-2 py-1 bg-white/10 rounded-md text-[8px] font-black tracking-widest border border-white/10">{s}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
