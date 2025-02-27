"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useUsers } from "@/contexts/UsersContext";
import { useEffect, useState } from "react";

export default function UsersContainer() {
  const { users } = useUsers();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Função para atualizar o estado mobile
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // Definir estado inicial
    handleResize();

    // Adicionar listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    console.log("Users atualizados no container:", users);
  }, [users]);

  const getUser = (userName: string) => {
    const user = users.find(
      (u) => u.userName?.toLowerCase() === userName.toLowerCase()
    );
    console.log(`Buscando usuário ${userName}:`, user);
    return user;
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "disponível":
        return {
          dot: "bg-emerald-500",
          text: "text-emerald-400",
          border: "border-emerald-500/20",
          background: "bg-emerald-500/5",
          glow: "shadow-emerald-500/20",
          ring: "ring-emerald-500/20",
        };
      case "indisponível":
        return {
          dot: "bg-rose-500",
          text: "text-rose-400",
          border: "border-rose-500/20",
          background: "bg-rose-500/5",
          glow: "shadow-rose-500/20",
          ring: "ring-rose-500/20",
        };
      case "ocupado":
        return {
          dot: "bg-amber-500",
          text: "text-amber-400",
          border: "border-amber-500/20",
          background: "bg-amber-500/5",
          glow: "shadow-amber-500/20",
          ring: "ring-amber-500/20",
        };
      default:
        return {
          dot: "bg-slate-500",
          text: "text-slate-400",
          border: "border-slate-500/20",
          background: "bg-slate-500/5",
          glow: "shadow-slate-500/20",
          ring: "ring-slate-500/20",
        };
    }
  };

  // Usuários específicos que queremos mostrar
  const targetUsers = ["Marcos", "Uene", "Leo"];

  const getUserInitialColor = (userName: string) => {
    switch (userName) {
      case "Marcos":
        return "bg-blue-500";
      case "Uene":
        return "bg-purple-500";
      case "Leo":
        return "bg-emerald-500";
      default:
        return "bg-slate-500";
    }
  };

  // Se for mobile, não renderiza o componente
  if (isMobile) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed right-6 top-6 z-[9999] space-y-3 w-64"
    >
      <h3 className="text-slate-300 text-xs font-medium uppercase tracking-wider px-3 mb-4">
        Equipe Online ({users.length} usuários)
      </h3>

      {targetUsers.map((userName) => {
        const user = getUser(userName);
        const statusStyle = getStatusColor(user?.status || "offline");

        return (
          <motion.div
            key={userName}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30,
            }}
            whileHover={{ scale: 1.02 }}
            className={`bg-slate-800/60 backdrop-blur-md border ${statusStyle.border} 
              rounded-lg p-4 flex items-center justify-between shadow-lg ${statusStyle.glow}
              hover:shadow-xl transition-all duration-300 ${statusStyle.background}
              mix-blend-plus-lighter`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`relative w-10 h-10 rounded-full ${getUserInitialColor(
                  userName
                )} flex items-center justify-center text-white font-medium
                ring-2 ${
                  statusStyle.ring
                } shadow-lg transition-all duration-300`}
              >
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                  }}
                >
                  {userName[0]}
                </motion.span>
                <motion.div
                  className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 ${
                    statusStyle.dot
                  } rounded-full border-2 border-slate-900/80 
                  ${user?.status === "disponível" ? "animate-pulse" : ""}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                />
              </div>
              <div className="flex flex-col">
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-slate-200 font-medium"
                >
                  {user?.nome || userName}
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className={`text-sm ${statusStyle.text} capitalize`}
                >
                  {user?.status || "Offline"}
                </motion.span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
