"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserGroupIcon,
  ClockIcon,
  TruckIcon,
  DocumentChartBarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BuildingOffice2Icon,
} from "@heroicons/react/24/outline";
import DeliveryBox from "./DeliveryBox";
import InProgressBox from "./InProgressBox";
import GenerateDeliveryBox from "./GenerateDeliveryBox";
import ReportBox from "./ReportBox";
import { useUsers } from "@/contexts/UsersContext";

export default function Sidebar({ isMobile }: { isMobile: boolean }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDeliveryBoxOpen, setIsDeliveryBoxOpen] = useState(false);
  const [isInProgressBoxOpen, setIsInProgressBoxOpen] = useState(false);
  const [isGenerateDeliveryOpen, setIsGenerateDeliveryOpen] = useState(false);
  const [isReportBoxOpen, setIsReportBoxOpen] = useState(false);
  const { users } = useUsers();

  // Função auxiliar para obter a cor do usuário
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

  // Função auxiliar para obter cores baseadas no status
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "disponível":
        return {
          dot: "bg-emerald-500",
          text: "text-emerald-400",
          border: "border-emerald-500/20",
          background: "bg-emerald-500/5",
        };
      case "indisponível":
        return {
          dot: "bg-rose-500",
          text: "text-rose-400",
          border: "border-rose-500/20",
          background: "bg-rose-500/5",
        };
      case "ocupado":
        return {
          dot: "bg-amber-500",
          text: "text-amber-400",
          border: "border-amber-500/20",
          background: "bg-amber-500/5",
        };
      default:
        return {
          dot: "bg-slate-500",
          text: "text-slate-400",
          border: "border-slate-500/20",
          background: "bg-slate-500/5",
        };
    }
  };

  // Usuários específicos que queremos mostrar
  const targetUsers = ["Marcos", "Uene", "Leo"];

  const menuItems = [
    {
      icon: UserGroupIcon,
      label: "Disponíveis",
      id: "available",
      onClick: () => setIsDeliveryBoxOpen(true),
    },
    {
      icon: ClockIcon,
      label: "Andamento",
      id: "in-progress",
      onClick: () => setIsInProgressBoxOpen(true),
    },
    {
      icon: TruckIcon,
      label: "Gerar Entrega",
      id: "delivery",
      onClick: () => setIsGenerateDeliveryOpen(true),
    },
    {
      icon: DocumentChartBarIcon,
      label: "Relatório",
      id: "report",
      onClick: () => setIsReportBoxOpen(true),
    },
  ];

  return (
    <>
      <motion.div
        style={{ zIndex: 9999 }}
        initial={{ width: isExpanded ? "240px" : "64px" }}
        animate={{
          width: isExpanded ? "240px" : "64px",
        }}
        transition={{ duration: 0.3 }}
        className="fixed left-0 top-0 bottom-0 bg-slate-900/75 backdrop-blur-md border-r border-white/10 shadow-2xl flex flex-col"
      >
        {/* Botão de Expandir/Recolher para Desktop e Mobile */}
        <motion.button
          className={`absolute -right-3 bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-full p-1.5 hover:bg-slate-700/50 transition-colors
            ${isMobile ? "top-20" : "top-6"}`}
          onClick={() => setIsExpanded(!isExpanded)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {isExpanded ? (
            <ChevronLeftIcon className="h-4 w-4 text-slate-200" />
          ) : (
            <ChevronRightIcon className="h-4 w-4 text-slate-200" />
          )}
        </motion.button>

        <div className="pt-6 px-3 mb-8">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden">
            <motion.div
              className="relative w-full h-16"
              animate={{
                scale: isExpanded ? 1 : 0.95,
              }}
              transition={{ duration: 0.2 }}
            >
              <div className="absolute inset-0 bg-[url('/images/ecologo.jpg')] bg-cover bg-center" />
            </motion.div>
          </div>
        </div>

        <div className="flex-1 px-3">
          {menuItems.map((item) => (
            <motion.button
              key={item.id}
              className="flex items-center w-full p-3 mb-2 rounded-lg hover:bg-white/5 transition-colors"
              onClick={item.onClick}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <item.icon className="h-6 w-6 text-slate-300" />
              {isExpanded && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="ml-3 text-slate-200 font-medium tracking-wide"
                >
                  {item.label}
                </motion.span>
              )}
            </motion.button>
          ))}

          {/* Container de Usuários para Mobile */}
          {isMobile && isExpanded && (
            <div className="mt-6 border-t border-white/10 pt-6">
              <h3 className="text-slate-300 text-xs font-medium uppercase tracking-wider px-3 mb-4">
                Equipe Online ({users.length})
              </h3>
              <div className="space-y-2">
                {targetUsers.map((userName) => {
                  const user = users.find((u) => u.userName === userName);
                  const statusStyle = getStatusColor(user?.status || "offline");

                  return (
                    <motion.div
                      key={userName}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`bg-slate-800/60 backdrop-blur-md border ${statusStyle.border} 
                        rounded-lg p-3 flex items-center gap-3 ${statusStyle.background}`}
                    >
                      <div
                        className={`relative w-8 h-8 rounded-full ${getUserInitialColor(
                          userName
                        )} flex items-center justify-center text-white font-medium`}
                      >
                        {userName[0]}
                        <div
                          className={`absolute -bottom-1 -right-1 w-3 h-3 ${
                            statusStyle.dot
                          } rounded-full border-2 border-slate-900/80 
                          ${
                            user?.status === "disponível" ? "animate-pulse" : ""
                          }`}
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-200 text-sm font-medium">
                          {user?.nome || userName}
                        </span>
                        <span
                          className={`text-xs ${statusStyle.text} capitalize`}
                        >
                          {user?.status || "Offline"}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="px-3 pb-4">
          <motion.div
            className="border-t border-white/10 pt-4 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <BuildingOffice2Icon className="h-5 w-5 text-slate-400" />
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="ml-2 text-slate-400 text-sm font-medium"
              >
                R J Company
              </motion.span>
            )}
          </motion.div>
        </div>
      </motion.div>

      {isDeliveryBoxOpen && (
        <DeliveryBox
          isOpen={isDeliveryBoxOpen}
          onClose={() => setIsDeliveryBoxOpen(false)}
          isMobile={isMobile}
        />
      )}

      {isInProgressBoxOpen && (
        <InProgressBox
          isOpen={isInProgressBoxOpen}
          onClose={() => setIsInProgressBoxOpen(false)}
          isMobile={isMobile}
        />
      )}

      <GenerateDeliveryBox
        isOpen={isGenerateDeliveryOpen}
        onClose={() => setIsGenerateDeliveryOpen(false)}
        isMobile={isMobile}
      />

      <ReportBox
        isOpen={isReportBoxOpen}
        onClose={() => setIsReportBoxOpen(false)}
        isMobile={isMobile}
      />
    </>
  );
}
