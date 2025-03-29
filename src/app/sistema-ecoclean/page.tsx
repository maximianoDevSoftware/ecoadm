"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import UsersContainer from "@/components/UsersContainer";
import { io } from "socket.io-client";
import { useUsers } from "@/contexts/UsersContext";
import { usuarioTipo } from "@/types/userTypes";
import { motion, AnimatePresence } from "framer-motion";
import { UserGroupIcon } from "@heroicons/react/24/outline";

const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => null,
});

export default function SistemaEcoclean() {
  const [isMobile, setIsMobile] = useState(false);
  const { setUsers } = useUsers();
  const [socket, setSocket] = useState<any>(null);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    // Inicializa a conexão socket
    const socketInstance = io("https://servidor-ecoclean-remaster-production.up.railway.app/");
    setSocket(socketInstance);

    // Listener para o evento "Atualizando todos entregadores"
    socketInstance.on("Atualizando todos entregadores", (entregadores: usuarioTipo[]) => {
      console.log("Recebendo atualização dos entregadores:", entregadores);

      // Filtra apenas os entregadores que nos interessam (Leo, Marcos, Uene)
      const entregadoresRelevantes = entregadores.filter(entregador => 
        ["Leo", "Marcos", "Uene"].includes(entregador.userName)
      );

      // Atualiza o estado dos usuários com os dados recebidos
      setUsers(entregadoresRelevantes);

      // Mostra a notificação
      setShowNotification(true);

      // Remove a notificação após 5 segundos
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    });

    // Cleanup
    return () => {
      socketInstance.off("Atualizando todos entregadores");
      socketInstance.disconnect();
    };
  }, [setUsers]);

  return (
    <div className="fixed inset-0">
      {/* Notificação Elegante */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: -20 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 25
            }}
            className="fixed top-6 right-6 z-[99999]"
          >
            <motion.div
              className="relative p-3 bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 
                rounded-full shadow-lg shadow-emerald-500/10 group hover:bg-emerald-500/20 
                transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <UserGroupIcon className="h-6 w-6 text-emerald-400" />
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-emerald-400 rounded-full"
              />
              
              {/* Tooltip */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 
                group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className="px-3 py-1.5 bg-slate-900/95 text-emerald-400 text-sm font-medium rounded-lg 
                  whitespace-nowrap backdrop-blur-sm border border-emerald-500/20 shadow-xl">
                  Entregadores atualizados
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 z-0">
        <Map />
      </div>
      <Sidebar isMobile={isMobile} />
      <UsersContainer />
    </div>
  );
}
