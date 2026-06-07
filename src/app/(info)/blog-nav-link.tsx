"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BlogNavLinkClient() {
  const pathname = usePathname();
  const isBlog = pathname.startsWith("/blog");

  return (
    <Link
      href="/blog"
      className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all ${
        isBlog
          ? "text-primary-600 bg-primary-50"
          : "text-gray-600 hover:text-primary-600 hover:bg-gray-50"
      }`}
    >
      Blog
    </Link>
  );
}
