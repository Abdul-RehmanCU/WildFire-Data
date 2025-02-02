"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Flame } from "lucide-react"; // Fire Icon
import { useState } from "react";
import { Menu, X } from "lucide-react"; // Mobile Menu Icons

export default function Navbar() {
  const pathname = usePathname(); // Get current page path
  const [isOpen, setIsOpen] = useState(false); // Mobile menu state

  return (
    <>
      <nav className="hidden md:flex fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-orange-500 to-red-600 text-white shadow-lg flex-col py-8 px-4">
        {/* Logo & Title */}
        <Link href="/" passHref>
          <motion.div
            className="flex items-center space-x-2 mb-8 mx-auto cursor-pointer"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* You can keep the flame yellow if you want, or make it white as well */}
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Flame size={32} className="text-yellow-400" />
            </motion.div>
            <motion.span className="text-2xl font-bold" whileHover={{ scale: 1.1 }}>
              Wildfirex
            </motion.span>
          </motion.div>
        </Link>

        {/* Navigation Links */}
        <div className="flex flex-col space-y-6">
          <NavItem href="/" text="Home" pathname={pathname} delay={0.1} />
          <NavItem href="/upload-csv" text="Upload CSV" pathname={pathname} delay={0.2} />
          <NavItem href="/statistics" text="Resource Deployer" pathname={pathname} delay={0.3} />
          <NavItem href="/future-wildfires" text="Wildfire Predictor" pathname={pathname} delay={0.4} />
        </div>
      </nav>

      {/* 
        2) MOBILE NAVBAR (< md):
        shown on small screens, hidden on >= md
      */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-gradient-to-b from-orange-500 to-red-600 text-white shadow-lg flex justify-between items-center py-4 px-6 z-50">
        {/* Logo & Title */}
        <Link href="/" passHref>
          <motion.div
            className="flex items-center space-x-2 cursor-pointer"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Flame size={28} className="text-yellow-400" />
            <span className="text-xl font-bold">Wildfirex</span>
          </motion.div>
        </Link>

        {/* Mobile Menu Button */}
        <button onClick={() => setIsOpen(!isOpen)} className="text-white focus:outline-none">
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <motion.div
          className="md:hidden fixed top-14 left-0 w-full bg-orange-600 shadow-lg py-4 px-6 flex flex-col space-y-4 z-40"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <NavItem href="/" text="Home" pathname={pathname} delay={0.1} />
          <NavItem href="/upload-csv" text="Upload CSV" pathname={pathname} delay={0.2} />
          <NavItem href="/statistics" text="Resource Deployer" pathname={pathname} delay={0.3} />
          <NavItem href="/future-wildfires" text="Wildfire Predictor" pathname={pathname} delay={0.4} />
        </motion.div>
      )}
    </>
  );
}

// Navigation Item Component
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
          // All text remains white, but we can still do hover effects (like scale)
          className={`cursor-pointer text-lg font-medium text-white transition duration-300 px-3 py-2 relative ${
            isActive ? "" : "hover:opacity-80"
          }`}
          whileHover={{ scale: 1.05 }}
        >
          {text}

          {/* Active underline if desired */}
          {isActive && (
            <motion.div
              className="absolute left-0 bottom-0 w-full h-[2px] bg-white"
              layoutId="underline"
              transition={{ duration: 0.3 }}
            />
          )}
        </motion.span>
      </Link>
    </motion.div>
  );
}
