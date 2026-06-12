"use client";

import { motion } from "framer-motion";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ y: 15, opacity: 0, filter: "blur(4px)" }}
      animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="min-h-full"
    >
      {children}
    </motion.div>
  );
}
