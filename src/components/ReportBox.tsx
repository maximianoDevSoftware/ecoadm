"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  XMarkIcon,
  TableCellsIcon,
  CalendarIcon,
  ChartBarIcon,
  FolderIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon as XIcon,
  ChevronDownIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { io } from "socket.io-client";
import { entregasTipo } from "@/types/entregasTypes";
import { useEntregas } from "@/contexts/EntregasContext";
import TableReport from "./reports/TableReport";
import ChartsReport from "./reports/ChartsReport";
import FilesReport from "./reports/FilesReport";
import PeriodReport from "./reports/PeriodReport";

interface ReportBoxProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

type TabType = "table" | "period" | "charts" | "files";

// Interface para célula em edição
interface EditingCell {
  id: string;
  field: keyof entregasTipo | "all";
  value: string;
}

export default function ReportBox({
  isOpen,
  onClose,
  isMobile,
}: ReportBoxProps) {
  const [activeTab, setActiveTab] = useState<TabType>("table");
  const [socket, setSocket] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { entregas } = useEntregas();
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPeriodReport, setIsLoadingPeriodReport] = useState(false);
  const [periodEntregas, setPeriodEntregas] = useState<entregasTipo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntregaId, setSelectedEntregaId] = useState<string | null>(null);
  const [formEntrega, setFormEntrega] = useState<entregasTipo | null>(null);
  const [isLoadingCharts, setIsLoadingCharts] = useState(false);
  const [chartEntregas, setChartEntregas] = useState<entregasTipo[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [filesEntregas, setFilesEntregas] = useState<entregasTipo[]>([]);

  // Estado para os filtros do período
  const [periodFilters, setPeriodFilters] = useState({
    dataInicial: "",
    dataFinal: "",
    valorMinimo: "",
    valorMaximo: "",
    entregador: "",
    pagamento: "",
  });

  const tabs = [
    {
      id: "table" as TabType,
      label: "Tabela Entregas",
      icon: TableCellsIcon,
    },
    {
      id: "period" as TabType,
      label: "Período de Entregas",
      icon: CalendarIcon,
    },
    {
      id: "charts" as TabType,
      label: "Gráficos",
      icon: ChartBarIcon,
    },
    {
      id: "files" as TabType,
      label: "Arquivos",
      icon: FolderIcon,
    },
  ];

  useEffect(() => {
    const newSocket = io("https://servidor-ecoclean-remaster-production.up.railway.app/");
    setSocket(newSocket);

    // Listener para o evento "Entregas do Dia"
    newSocket.on("Entregas do Dia", (entregas: entregasTipo[]) => {
      console.log("Entregas atualizadas no ReportBox", entregas);
    });

    // Listener para o evento "Relatorio Entregas"
    newSocket.on("Relatorio Entregas", (entregas: entregasTipo[]) => {
      console.log("Relatório completo de entregas recebido:", entregas);
      setPeriodEntregas(entregas);
      setChartEntregas(entregas);
      setFilesEntregas(entregas);
      setIsLoadingPeriodReport(false);
      setIsLoadingCharts(false);
      setIsLoadingFiles(false);
      setError(null);
    });

    // Listener para erros
    newSocket.on("error", (error: { message: string, detalhes: string }) => {
      console.error("Erro recebido do servidor:", error);
      setError(`Erro: ${error.message}`);
      setIsLoadingPeriodReport(false);
      setIsLoadingCharts(false);
    });

    return () => {
      newSocket.off("Entregas do Dia");
      newSocket.off("Relatorio Entregas");
      newSocket.off("error");
      newSocket.close();
    };
  }, []);

  // Efeito para emitir o evento quando a aba period é selecionada
  useEffect(() => {
    if (activeTab === "period" && socket) {
      setIsLoadingPeriodReport(true);
      setError(null);
      socket.emit("Relatorio Entregas");
    }
  }, [activeTab, socket]);

  // Efeito para emitir o evento quando a aba charts é selecionada
  useEffect(() => {
    if (activeTab === "charts" && socket) {
      setIsLoadingCharts(true);
      setError(null);
      socket.emit("Relatorio Entregas");
    }
  }, [activeTab, socket]);

  // Efeito para emitir o evento quando a aba files é selecionada
  useEffect(() => {
    if (activeTab === "files" && socket) {
      setIsLoadingFiles(true);
      setError(null);
      socket.emit("Relatorio Entregas");
    }
  }, [activeTab, socket]);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      // Pequeno timeout para mostrar o loading
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }
  }, [isOpen]);

  // Função para ordenar e limitar as entregas mais recentes
  const getRecentEntregas = (entregas: entregasTipo[]) => {
    return [...entregas]
      .sort((a, b) => {
        const dateA = new Date(a.dia[0], a.dia[1] - 1, a.dia[2]);
        const dateB = new Date(b.dia[0], b.dia[1] - 1, b.dia[2]);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 100);
  };

  // Função para filtrar as entregas
  const filteredEntregas = getRecentEntregas(entregas).filter((entrega) => {
    const entregaDate = new Date(
      entrega.dia[0],
      entrega.dia[1] - 1,
      entrega.dia[2]
    );
    const dataInicial = periodFilters.dataInicial
      ? new Date(periodFilters.dataInicial)
      : null;
    const dataFinal = periodFilters.dataFinal ? new Date(periodFilters.dataFinal) : null;
    const valor = parseFloat(entrega.valor.replace(",", "."));

    return (
      (!dataInicial || entregaDate >= dataInicial) &&
      (!dataFinal || entregaDate <= dataFinal) &&
      (!periodFilters.valorMinimo || valor >= parseFloat(periodFilters.valorMinimo)) &&
      (!periodFilters.valorMaximo || valor <= parseFloat(periodFilters.valorMaximo)) &&
      (!periodFilters.entregador || entrega.entregador === periodFilters.entregador) &&
      (!periodFilters.pagamento || entrega.pagamento === periodFilters.pagamento)
    );
  });

  // Ordenar as entregas por data (mais recente primeiro)
  const sortedPeriodEntregas = [...periodEntregas].sort((a, b) => {
    const dateA = new Date(a.dia[2], a.dia[1] - 1, a.dia[0]);
    const dateB = new Date(b.dia[2], b.dia[1] - 1, b.dia[0]);
    return dateB.getTime() - dateA.getTime();
  });

  // Função para renderizar célula editável
  const EditableCell = ({
    entrega,
    field,
    value,
    isEditing,
    canEdit = true,
  }: {
    entrega: entregasTipo;
    field: keyof entregasTipo;
    value: string;
    isEditing: boolean;
    canEdit?: boolean;
  }) => {
    const isCurrentlyEditing =
      editingCell?.id === entrega.id && editingCell?.field === field;

    const updateEntregaField = (
      entrega: entregasTipo,
      field: keyof entregasTipo,
      value: string
    ) => {
      const updatedEntrega = { ...entrega };

      if (field === "dia") {
        const [year, month, day] = value.split("-").map(Number);
        updatedEntrega.dia = [day, month, year];
      } else if (field === "coordenadas") {
        // Mantém as coordenadas inalteradas
        updatedEntrega.coordenadas = entrega.coordenadas;
      } else {
        // Atualiza campos simples de string
        (updatedEntrega as any)[field] = value;
      }

      return updatedEntrega;
    };

    if (!isCurrentlyEditing) {
      return (
        <div className="relative group flex items-center gap-2 w-full">
          <span className="text-slate-300 truncate">{value}</span>
          {(canEdit || field === "dia") && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (entrega.id) {
                  if (field === "dia") {
                    const [day, month, year] = entrega.dia;
                    const formattedDate = `${year}-${String(month).padStart(
                      2,
                      "0"
                    )}-${String(day).padStart(2, "0")}`;
                    setEditingCell({
                      id: entrega.id,
                      field,
                      value: formattedDate,
                    });
                  } else {
                    setEditingCell({
                      id: entrega.id,
                      field,
                      value: value.toString(),
                    });
                  }
                }
              }}
              className="opacity-0 group-hover:opacity-100 transition-all duration-200
                p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 
                text-blue-400 hover:text-blue-300 border border-blue-500/20
                hover:border-blue-500/30 shadow-lg shadow-blue-500/10
                backdrop-blur-sm flex-shrink-0"
            >
              <PencilSquareIcon className="h-3.5 w-3.5" />
            </motion.button>
          )}
        </div>
      );
    }

    return (
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="flex items-center gap-1"
      >
        {field === "dia" ? (
          <input
            type="date"
            value={editingCell?.value || ""}
            onChange={(e) => {
              if (editingCell) {
                setEditingCell({
                  ...editingCell,
                  value: e.target.value,
                });
              }
            }}
            className="w-full bg-slate-800/50 border border-blue-500/30 rounded-lg px-2 py-0.5
              text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            autoFocus
          />
        ) : (
          <input
            type="text"
            value={editingCell?.value || ""}
            onChange={(e) => {
              if (editingCell) {
                setEditingCell({
                  ...editingCell,
                  value: e.target.value,
                });
              }
            }}
            className="w-full bg-slate-800/50 border border-blue-500/30 rounded-lg px-2 py-0.5
              text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            autoFocus
          />
        )}
        <div className="flex gap-1 flex-shrink-0">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={async () => {
              if (!socket || !editingCell) return;
              setIsSaving(true);

              const updatedEntrega = updateEntregaField(
                entrega,
                field,
                editingCell.value
              );
              socket.emit("Atualizar Entrega", updatedEntrega);
              setEditingCell(null);
            }}
            className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
          >
            <CheckIcon className="h-3.5 w-3.5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setEditingCell(null)}
            className="p-1 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
          >
            <XIcon className="h-3.5 w-3.5" />
          </motion.button>
        </div>
      </motion.div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999] flex items-center justify-center"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl w-full max-w-5xl mx-4"
          >
            {/* Cabeçalho com Abas */}
            <div className="border-b border-white/10">
              <div className="flex items-center justify-between p-4">
                <h2 className="text-xl font-semibold text-slate-200">
                  Relatórios
                </h2>
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Abas */}
              <div className="flex px-4">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative
                      ${
                        activeTab === tab.id
                          ? "text-blue-400"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                  >
                    <tab.icon className="h-5 w-5" />
                    {tab.label}
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Conteúdo das Abas */}
            <div
              className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto
                [&::-webkit-scrollbar]:w-1.5
                [&::-webkit-scrollbar-track]:bg-transparent
                [&::-webkit-scrollbar-thumb]:bg-white/10
                [&::-webkit-scrollbar-thumb]:rounded-full
                [&::-webkit-scrollbar-thumb]:hover:bg-white/20
                hover:[&::-webkit-scrollbar]:w-2
                transition-all duration-300"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === "table" && (
                    <div className="text-slate-200">
                      <TableReport
                        entregas={filteredEntregas}
                        socket={socket}
                        isLoading={isLoading}
                      />
                    </div>
                  )}

                  {activeTab === "period" && (
                    <div className="flex-1 overflow-y-auto pr-2">
                      <PeriodReport 
                        entregas={periodEntregas} 
                        filters={periodFilters} 
                        setFilters={setPeriodFilters} 
                      />
                    </div>
                  )}

                  {activeTab === "charts" && (
                    <div className="text-slate-200">
                      {error ? (
                        <div className="flex items-center justify-center p-8">
                          <div className="bg-rose-500/10 text-rose-400 px-4 py-3 rounded-lg border border-rose-500/20 backdrop-blur-sm">
                            {error}
                          </div>
                        </div>
                      ) : (
                        <ChartsReport entregas={chartEntregas} isLoading={isLoadingCharts} />
                      )}
                    </div>
                  )}

                  {activeTab === "files" && (
                    <div className="text-slate-200">
                      {error ? (
                        <div className="flex items-center justify-center p-8">
                          <div className="bg-rose-500/10 text-rose-400 px-4 py-3 rounded-lg border border-rose-500/20 backdrop-blur-sm">
                            {error}
                          </div>
                        </div>
                      ) : (
                        <FilesReport entregas={filesEntregas} isLoading={isLoadingFiles} />
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

