"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Flame } from "lucide-react"; // Fire Icon

export default function Sidebar() {
  const pathname = usePathname(); // Get current page path

  return (
    <nav className="fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-orange-500 to-red-600 text-white shadow-lg flex flex-col py-8 px-4">
      
      {/* Wildfire Analyzer Logo - Clickable to Home */}
      <Link href="/" passHref>
        <motion.div
          className="flex items-center space-x-2 mb-8 mx-auto cursor-pointer"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Flame size={32} className="text-yellow-400" />
          </motion.div>
          <motion.span className="text-2xl font-bold" whileHover={{ scale: 1.1 }}>
            Wildfire Analyzer
          </motion.span>
        </motion.div>
      </Link>

      {/* Navigation Links with Smooth Fade-In Animation */}
      <div className="flex flex-col space-y-6">
        <NavItem href="/" text="Home" pathname={pathname} delay={0.1} />
        <NavItem href="/upload-csv" text="Upload CSV" pathname={pathname} delay={0.2} />
        <NavItem href="/statistics" text="Statistics" pathname={pathname} delay={0.3} />
        <NavItem href="/future-wildfires" text="Future Wildfires" pathname={pathname} delay={0.4} /> {/* NEW PAGE */}
      </div>
    </nav>
  );
}

// Helper Component for Navigation Links with Fade-In Animation
function NavItem({
  href,
  text,
  pathname,
  delay,
}: {
  href: string;
  text: string;
  pathname: string;
  delay: number;
}) {
  const isActive = pathname === href;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Link href={href} passHref>
        <motion.span
          className={`cursor-pointer text-lg font-medium transition duration-300 px-3 py-2 relative 
            ${isActive ? "text-yellow-300" : "hover:text-yellow-300"}`}
          whileHover={{ scale: 1.1 }}
        >
          {text}
          {isActive && (
            <motion.div
              className="absolute left-0 bottom-0 w-full h-[2px] bg-yellow-300"
              layoutId="underline"
              transition={{ duration: 0.3 }}
            />
          )}
        </motion.span>
      </Link>
    </motion.div>
  );
}
