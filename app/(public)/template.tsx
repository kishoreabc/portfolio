"use client";

import { motion } from "motion/react";

export default function PublicTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="flex-1 flex flex-col w-full"
    >
      {children}
    </motion.div>
  );
}
