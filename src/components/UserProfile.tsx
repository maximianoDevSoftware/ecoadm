"use client";

import { motion } from "framer-motion";
import { UserCircleIcon } from "@heroicons/react/24/outline";

interface UserProfileProps {
  name: string;
  status: "disponível" | "indisponível" | "ocupado";
  isExpanded: boolean;
}

const statusStyles = {
  disponível: {
    dot: "bg-emerald-500",
    border: "border-emerald-500/20",
    shadow: "shadow-emerald-500/20",
  },
  indisponível: {
    dot: "bg-rose-500",
    border: "border-rose-500/20",
    shadow: "shadow-rose-500/20",
  },
  ocupado: {
    dot: "bg-amber-500",
    border: "border-amber-500/20",
    shadow: "shadow-amber-500/20",
  },
};

export default function UserProfile({
  name,
  status,
  isExpanded,
}: UserProfileProps) {
  const currentStyle = statusStyles[status];

  return (
    <motion.div
      className={`bg-slate-900/40 backdrop-blur-sm border ${currentStyle.border} 
        rounded-lg p-3 mb-2 hover:bg-slate-900/50 transition-all duration-300
        shadow-lg ${currentStyle.shadow}`}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <UserCircleIcon className="h-10 w-10 text-slate-300" />
          <div
            className={`absolute bottom-0 right-0 h-2.5 w-2.5 ${currentStyle.dot} 
              rounded-full border-2 border-slate-900/80`}
          />
        </div>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="overflow-hidden"
          >
            <p className="text-slate-200 font-medium text-sm">{name}</p>
            <p className="text-slate-400 text-xs capitalize">{status}</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
