"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  XMarkIcon,
  TableCellsIcon,
  CalendarIcon,
  ChartBarIcon,
  FolderIcon,
} from "@heroicons/react/24/outline";
import { io } from "socket.io-client";
import { entregasTipo } from "@/types/entregasTypes";
import { useEntregas } from "@/contexts/EntregasContext";

interface ReportBoxProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

type TabType = "table" | "period" | "charts" | "files";

export default function ReportBox({
  isOpen,
  onClose,
  isMobile,
}: ReportBoxProps) {
  const [activeTab, setActiveTab] = useState<TabType>("table");
  const [socket, setSocket] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { entregas } = useEntregas(); // Usando o contexto de entregas existente

  // Estados para os filtros
  const [filters, setFilters] = useState({
    dataInicial: "",
    dataFinal: "",
    valorMinimo: "",
    valorMaximo: "",
    entregador: "",
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
    const newSocket = io(
      "https://servidor-test-wts-efaaa800736e.herokuapp.com/"
    );
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

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
    const dataInicial = filters.dataInicial
      ? new Date(filters.dataInicial)
      : null;
    const dataFinal = filters.dataFinal ? new Date(filters.dataFinal) : null;
    const valor = parseFloat(entrega.valor.replace(",", "."));

    return (
      (!dataInicial || entregaDate >= dataInicial) &&
      (!dataFinal || entregaDate <= dataFinal) &&
      (!filters.valorMinimo || valor >= parseFloat(filters.valorMinimo)) &&
      (!filters.valorMaximo || valor <= parseFloat(filters.valorMaximo)) &&
      (!filters.entregador || entrega.entregador === filters.entregador)
    );
  });

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
                      <div className="rounded-lg border border-white/10 overflow-hidden">
                        {isLoading ? (
                          <div className="flex items-center justify-center p-8">
                            <div className="flex flex-col items-center gap-4">
                              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                              <p className="text-slate-400">
                                Carregando relatório...
                              </p>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="p-4 border-b border-white/10 flex justify-between items-center">
                              <p className="text-sm text-slate-400">
                                Exibindo as {filteredEntregas.length} entregas
                                mais recentes
                                {filteredEntregas.length === 100
                                  ? " (limitado a 100)"
                                  : ""}
                              </p>
                            </div>
                            {/* Versão Desktop */}
                            <div
                              className="hidden md:block overflow-x-auto
                              [&::-webkit-scrollbar]:h-1.5
                              [&::-webkit-scrollbar-track]:bg-transparent
                              [&::-webkit-scrollbar-thumb]:bg-white/10
                              [&::-webkit-scrollbar-thumb]:rounded-full
                              [&::-webkit-scrollbar-thumb]:hover:bg-white/20
                              hover:[&::-webkit-scrollbar]:h-2
                              transition-all duration-300
                              pb-2"
                            >
                              <table className="w-full min-w-[1200px]">
                                <thead>
                                  <tr className="bg-slate-800/50">
                                    <th className="sticky left-0 bg-slate-800/50 px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                      Nome
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                      Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                      Data
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                      Valor
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                      Pagamento
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                      Entregador
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                      Telefone
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                      Endereço
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                      Volume
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                      Observações
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                  {filteredEntregas.map((entrega) => (
                                    <tr
                                      key={entrega.id}
                                      className="hover:bg-slate-800/50 transition-colors"
                                    >
                                      <td className="sticky left-0 bg-slate-900/90 backdrop-blur-sm px-6 py-4 whitespace-nowrap text-sm">
                                        {entrega.nome}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span
                                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                            ${
                                              entrega.status === "Disponível"
                                                ? "bg-blue-400/10 text-blue-400"
                                                : entrega.status === "Andamento"
                                                ? "bg-amber-400/10 text-amber-400"
                                                : "bg-emerald-400/10 text-emerald-400"
                                            }`}
                                        >
                                          {entrega.status}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                        {entrega.dia.join("/")}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className="text-emerald-400">
                                          R$ {entrega.valor}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                        {entrega.pagamento}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                        {entrega.entregador}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                        {entrega.telefone}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                        {`${entrega.rua}, ${entrega.numero} - ${entrega.bairro}, ${entrega.cidade}`}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                        {entrega.volume}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                        {entrega.observacoes || "-"}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* Versão Mobile */}
                            <div className="md:hidden">
                              <div className="space-y-4 p-4">
                                {filteredEntregas.map((entrega) => (
                                  <div
                                    key={entrega.id}
                                    className="bg-slate-800/50 rounded-lg border border-white/10 p-4 space-y-3"
                                  >
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <h3 className="font-medium text-slate-200">
                                          {entrega.nome}
                                        </h3>
                                        <p className="text-sm text-slate-400">
                                          {entrega.dia.join("/")}
                                        </p>
                                      </div>
                                      <span
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                          ${
                                            entrega.status === "Disponível"
                                              ? "bg-blue-400/10 text-blue-400"
                                              : entrega.status === "Andamento"
                                              ? "bg-amber-400/10 text-amber-400"
                                              : "bg-emerald-400/10 text-emerald-400"
                                          }`}
                                      >
                                        {entrega.status}
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                      <div>
                                        <p className="text-slate-400">Valor</p>
                                        <p className="text-emerald-400">
                                          R$ {entrega.valor}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-slate-400">
                                          Pagamento
                                        </p>
                                        <p className="text-slate-200">
                                          {entrega.pagamento}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-slate-400">
                                          Entregador
                                        </p>
                                        <p className="text-slate-200">
                                          {entrega.entregador}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-slate-400">Volume</p>
                                        <p className="text-slate-200">
                                          {entrega.volume}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      <div>
                                        <p className="text-slate-400 text-sm">
                                          Telefone
                                        </p>
                                        <p className="text-slate-200">
                                          {entrega.telefone}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-slate-400 text-sm">
                                          Endereço
                                        </p>
                                        <p className="text-slate-200">
                                          {entrega.rua}, {entrega.numero}
                                          <br />
                                          {entrega.bairro}, {entrega.cidade}
                                        </p>
                                      </div>
                                      {entrega.observacoes && (
                                        <div>
                                          <p className="text-slate-400 text-sm">
                                            Observações
                                          </p>
                                          <p className="text-slate-200">
                                            {entrega.observacoes}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === "period" && (
                    <div className="space-y-6">
                      {/* Formulário de Filtros */}
                      <div className="bg-slate-800/50 rounded-lg border border-white/10 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">
                              Data Inicial
                            </label>
                            <input
                              type="date"
                              value={filters.dataInicial}
                              onChange={(e) =>
                                setFilters({
                                  ...filters,
                                  dataInicial: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 bg-slate-900/50 border border-white/10 rounded-lg
                                focus:outline-none focus:border-blue-500 text-slate-200"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">
                              Data Final
                            </label>
                            <input
                              type="date"
                              value={filters.dataFinal}
                              onChange={(e) =>
                                setFilters({
                                  ...filters,
                                  dataFinal: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 bg-slate-900/50 border border-white/10 rounded-lg
                                focus:outline-none focus:border-blue-500 text-slate-200"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">
                              Entregador
                            </label>
                            <select
                              value={filters.entregador}
                              onChange={(e) =>
                                setFilters({
                                  ...filters,
                                  entregador: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 bg-slate-900/50 border border-white/10 rounded-lg
                                focus:outline-none focus:border-blue-500 text-slate-200"
                            >
                              <option value="">Todos</option>
                              <option value="João Silva">João Silva</option>
                              <option value="Maria Santos">Maria Santos</option>
                              <option value="Pedro Oliveira">
                                Pedro Oliveira
                              </option>
                              <option value="Ana Costa">Ana Costa</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">
                              Valor Mínimo
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-2 text-slate-400">
                                R$
                              </span>
                              <input
                                type="number"
                                value={filters.valorMinimo}
                                onChange={(e) =>
                                  setFilters({
                                    ...filters,
                                    valorMinimo: e.target.value,
                                  })
                                }
                                className="w-full pl-8 pr-3 py-2 bg-slate-900/50 border border-white/10 rounded-lg
                                  focus:outline-none focus:border-blue-500 text-slate-200"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">
                              Valor Máximo
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-2 text-slate-400">
                                R$
                              </span>
                              <input
                                type="number"
                                value={filters.valorMaximo}
                                onChange={(e) =>
                                  setFilters({
                                    ...filters,
                                    valorMaximo: e.target.value,
                                  })
                                }
                                className="w-full pl-8 pr-3 py-2 bg-slate-900/50 border border-white/10 rounded-lg
                                  focus:outline-none focus:border-blue-500 text-slate-200"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Tabela Filtrada */}
                      <div className="rounded-lg border border-white/10 overflow-hidden">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-slate-800/50">
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                Nome
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                Data
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                Valor
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                Pagamento
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {filteredEntregas.map((entrega) => (
                              <tr
                                key={entrega.id}
                                className="hover:bg-slate-800/50 transition-colors"
                              >
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  {entrega.nome}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                      ${
                                        entrega.status === "Disponível"
                                          ? "bg-blue-400/10 text-blue-400"
                                          : entrega.status === "Andamento"
                                          ? "bg-amber-400/10 text-amber-400"
                                          : "bg-emerald-400/10 text-emerald-400"
                                      }`}
                                  >
                                    {entrega.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                  {entrega.dia.join("/")}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <span className="text-emerald-400">
                                    R$ {entrega.valor}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                  {entrega.pagamento}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {activeTab === "charts" && (
                    <div className="text-slate-200">
                      {/* Conteúdo dos Gráficos */}
                      <p>Conteúdo dos Gráficos</p>
                    </div>
                  )}

                  {activeTab === "files" && (
                    <div className="text-slate-200">
                      {/* Conteúdo dos Arquivos */}
                      <p>Conteúdo dos Arquivos</p>
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
