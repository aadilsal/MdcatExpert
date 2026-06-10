"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme, type Theme } from "@/components/theme-provider";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const themeOptions: { value: Theme; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  const getActiveIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="w-5 h-5 text-amber-500" />;
      case "dark":
        return <Moon className="w-5 h-5 text-indigo-400" />;
      case "system":
        return <Monitor className="w-5 h-5 text-gray-500 dark:text-gray-400" />;
    }
  };

  return (
    <div ref={dropdownRef} className="relative z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 flex items-center justify-center cursor-pointer transition-all hover:bg-gray-100 dark:hover:bg-slate-800 active:scale-95"
        aria-label="Toggle Theme"
      >
        {getActiveIcon()}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 mt-2.5 w-36 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-gray-100 dark:border-slate-800 p-1.5 shadow-xl"
          >
            {themeOptions.map((opt) => {
              const Icon = opt.icon;
              const isActive = theme === opt.value;

              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    setTheme(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer text-left ${
                    isActive
                      ? "bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 font-extrabold"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${isActive ? "text-primary-600 dark:text-primary-400" : "text-gray-400"}`} />
                    {opt.label}
                  </span>
                  {isActive && <Check className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
