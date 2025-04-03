import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowPathIcon,
  FunnelIcon,
  ChevronDownIcon,
  PencilSquareIcon,
  ClockIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { entregasTipo } from "@/types/entregasTypes";
import { Socket } from "socket.io-client";
import { io } from "socket.io-client";

interface PeriodReportProps {
  entregas: entregasTipo[];
  filters: {
    dataInicial: string;
    dataFinal: string;
    valorMinimo: string;
    valorMaximo: string;
    entregador: string;
    pagamento: string;
  };
  setFilters: (filters: {
    dataInicial: string;
    dataFinal: string;
    valorMinimo: string;
    valorMaximo: string;
    entregador: string;
    pagamento: string;
  }) => void;
}

export default function PeriodReport({
  entregas,
  filters,
  setFilters,
}: PeriodReportProps) {
  const [filteredEntregas, setFilteredEntregas] = useState<entregasTipo[]>(entregas);
  const [selectedEntregaId, setSelectedEntregaId] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{ id: string; field: keyof entregasTipo | "all"; value: string } | null>(null);
  const [formEntrega, setFormEntrega] = useState<entregasTipo | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isLoadingEntregas, setIsLoadingEntregas] = useState(false);
  
  useEffect(() => {
    const socketInstance = io("https://servidor-ecoclean-remaster-production.up.railway.app/");
    setSocket(socketInstance);
    
    // Adicionar listener para receber relatório atualizado
    socketInstance.on("Relatorio Entregas", (novasEntregas: entregasTipo[]) => {
      console.log("Relatório de entregas atualizado recebido:", novasEntregas);
      setFilteredEntregas(novasEntregas);
      setIsLoadingEntregas(false);
    });
    
    return () => {
      socketInstance.off("Relatorio Entregas");
      socketInstance.disconnect();
    };
  }, []);

  useEffect(() => {
    setFilteredEntregas(entregas);
  }, [entregas]);

  const handleAtualizar = () => {
    if (socket) {
      setIsLoadingEntregas(true);
      socket.emit("Relatorio Entregas");
    }
  };

  const handleFilterEntregas = () => {
    let filtered = [...entregas];

    // Filtro de data inicial
    if (filters.dataInicial) {
      const [year, month, day] = filters.dataInicial.split('-').map(Number);
      filtered = filtered.filter(entrega => {
        if (!entrega.dia || entrega.dia.length < 3) return false;
        
        const entregaDate = new Date(entrega.dia[2], entrega.dia[1] - 1, entrega.dia[0]);
        const filterDate = new Date(year, month - 1, day);
        return entregaDate >= filterDate;
      });
    }

    // Filtro de data final
    if (filters.dataFinal) {
      const [year, month, day] = filters.dataFinal.split('-').map(Number);
      filtered = filtered.filter(entrega => {
        if (!entrega.dia || entrega.dia.length < 3) return false;
        
        const entregaDate = new Date(entrega.dia[2], entrega.dia[1] - 1, entrega.dia[0]);
        const filterDate = new Date(year, month - 1, day);
        return entregaDate <= filterDate;
      });
    }

    // Filtro de valor mínimo
    if (filters.valorMinimo) {
      const minValue = parseFloat(filters.valorMinimo.replace(',', '.'));
      filtered = filtered.filter(entrega => {
        const entregaValue = parseFloat(entrega.valor.replace(',', '.'));
        return !isNaN(entregaValue) && entregaValue >= minValue;
      });
    }

    // Filtro de valor máximo
    if (filters.valorMaximo) {
      const maxValue = parseFloat(filters.valorMaximo.replace(',', '.'));
      filtered = filtered.filter(entrega => {
        const entregaValue = parseFloat(entrega.valor.replace(',', '.'));
        return !isNaN(entregaValue) && entregaValue <= maxValue;
      });
    }

    // Filtro de entregador
    if (filters.entregador) {
      filtered = filtered.filter(entrega => entrega.entregador === filters.entregador);
    }

    // Filtro de forma de pagamento
    if (filters.pagamento) {
      filtered = filtered.filter(entrega => entrega.pagamento === filters.pagamento);
    }

    setFilteredEntregas(filtered);
  };

  const handleReset = () => {
    setFilters({
      dataInicial: "",
      dataFinal: "",
      valorMinimo: "",
      valorMaximo: "",
      entregador: "",
      pagamento: ""
    });
    setFilteredEntregas(entregas);
  };
  
  // Ordenar as entregas por data (mais recentes primeiro)
  const sortedEntregas = [...filteredEntregas].sort((a, b) => {
    const dateA = new Date(a.dia[2], a.dia[1] - 1, a.dia[0]);
    const dateB = new Date(b.dia[2], b.dia[1] - 1, b.dia[0]);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="space-y-6">
      {/* Formulário de Filtros */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-slate-800/50 rounded-lg border border-white/10 p-6 relative"
      >
        {/* Botão de Atualizar */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleAtualizar}
          disabled={isLoadingEntregas}
          className="absolute top-6 right-6 p-2 rounded-full text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 
            border border-blue-500/20 transition-all duration-300 shadow-lg shadow-blue-500/5 
            hover:shadow-blue-500/10 backdrop-blur-sm"
        >
          {isLoadingEntregas ? (
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ 
                duration: 1.5,
                repeat: Infinity,
                ease: "linear"
              }}
              className="w-5 h-5"
            >
              <svg className="w-5 h-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </motion.div>
          ) : (
            <ArrowPathIcon className="w-5 h-5" />
          )}
        </motion.button>

        <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
          <FunnelIcon className="h-4 w-4 text-blue-400" />
          Filtros de Pesquisa
        </h3>
        
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
                focus:outline-none focus:border-blue-500 text-slate-200 transition-all duration-200"
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
                focus:outline-none focus:border-blue-500 text-slate-200 transition-all duration-200"
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
                focus:outline-none focus:border-blue-500 text-slate-200 transition-all duration-200"
            >
              <option value="">Todos</option>
              <option value="Marcos">Marcos</option>
              <option value="Uene">Uene</option>
              <option value="Leo">Leo</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Valor Mínimo
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400">R$</span>
              <input
                type="text"
                value={filters.valorMinimo}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    valorMinimo: e.target.value,
                  })
                }
                placeholder="0,00"
                className="w-full pl-8 pr-3 py-2 bg-slate-900/50 border border-white/10 rounded-lg
                  focus:outline-none focus:border-blue-500 text-slate-200 transition-all duration-200"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Valor Máximo
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400">R$</span>
              <input
                type="text"
                value={filters.valorMaximo}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    valorMaximo: e.target.value,
                  })
                }
                placeholder="0,00"
                className="w-full pl-8 pr-3 py-2 bg-slate-900/50 border border-white/10 rounded-lg
                  focus:outline-none focus:border-blue-500 text-slate-200 transition-all duration-200"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Forma de Pagamento
            </label>
            <select
              value={filters.pagamento}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  pagamento: e.target.value,
                })
              }
              className="w-full px-3 py-2 bg-slate-900/50 border border-white/10 rounded-lg
                focus:outline-none focus:border-blue-500 text-slate-200 transition-all duration-200"
            >
              <option value="">Todas</option>
              <option value="PIX">PIX</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="Cartão">Cartão</option>
              <option value="Boleto">Boleto</option>
            </select>
          </div>
        </div>
        
        <div className="flex justify-end mt-6 gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleReset}
            className="px-4 py-2 bg-slate-700/50 text-slate-300 rounded-lg border border-white/5
              hover:bg-slate-700/80 transition-all duration-200 text-sm font-medium
              flex items-center gap-2 shadow-lg"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Limpar Filtros
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleFilterEntregas}
            className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30
              hover:bg-blue-500/30 transition-all duration-200 text-sm font-medium
              flex items-center gap-2 shadow-lg shadow-blue-500/10"
          >
            <FunnelIcon className="h-4 w-4" />
            Filtrar Resultados
          </motion.button>
        </div>
      </motion.div>

      <div className="space-y-3 pr-2">
        {filteredEntregas.length === 0 ? (
          <div className="bg-slate-800/50 rounded-lg border border-white/10 p-6 text-center text-slate-400">
            Nenhuma entrega encontrada com esses filtros.
          </div>
        ) : (
          <>
            <div className="bg-slate-800/50 rounded-lg border border-white/10 p-3 mb-2">
              <p className="text-sm text-slate-400">
                Exibindo {filteredEntregas.length} entregas 
                {filteredEntregas.length !== entregas.length && (
                  <span className="text-blue-400"> (filtradas de {entregas.length})</span>
                )}
              </p>
            </div>
            
            {sortedEntregas.map((entrega) => (
              <motion.div
                key={entrega.id}
                initial={false}
                animate={{ 
                  backgroundColor: selectedEntregaId === entrega.id ? "rgba(30, 41, 59, 0.5)" : "rgba(15, 23, 42, 0.5)"
                }}
                className="border border-white/10 rounded-lg overflow-hidden backdrop-blur-sm"
              >
                {/* Cabeçalho do Acordeão */}
                <motion.button
                  onClick={() => setSelectedEntregaId(selectedEntregaId === entrega.id ? null : (entrega.id || null))}
                  className="w-full px-4 py-3 flex items-center justify-between gap-4 hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex-shrink-0">
                      <div className={`w-2 h-2 rounded-full ${
                        entrega.status === "Disponível" ? "bg-blue-400" :
                        entrega.status === "Andamento" ? "bg-amber-400" :
                        "bg-emerald-400"
                      }`} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-slate-200 font-medium truncate">{entrega.nome}</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-400">{entrega.dia.join("/")}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      entrega.status === "Disponível" ? "bg-blue-400/10 text-blue-400" :
                      entrega.status === "Andamento" ? "bg-amber-400/10 text-amber-400" :
                      "bg-emerald-400/10 text-emerald-400"
                    }`}>
                      {entrega.status}
                    </span>
                    <motion.div
                      animate={{ rotate: selectedEntregaId === entrega.id ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="w-5 h-5 text-slate-400"
                    >
                      <ChevronDownIcon className="w-5 h-5" />
                    </motion.div>
                  </div>
                </motion.button>

                {/* Conteúdo Expandido */}
                <AnimatePresence>
                  {selectedEntregaId === entrega.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-white/10 overflow-hidden"
                    >
                      <div className="px-4 py-3 space-y-4">
                        {/* Visualização dos Detalhes */}
                        {!editingCell && (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-xs text-slate-400">Telefone</label>
                                <p className="text-slate-200">{entrega.telefone || "-"}</p>
                              </div>
                              <div>
                                <label className="text-xs text-slate-400">Valor</label>
                                <p className="text-emerald-400 font-medium">R$ {entrega.valor}</p>
                              </div>
                              <div>
                                <label className="text-xs text-slate-400">Pagamento</label>
                                <p className="text-slate-200">{entrega.pagamento}</p>
                              </div>
                              <div>
                                <label className="text-xs text-slate-400">Status Pagamento</label>
                                <p className="text-slate-200">{entrega.statusPagamento}</p>
                              </div>
                              <div>
                                <label className="text-xs text-slate-400">Entregador</label>
                                <p className="text-slate-200">{entrega.entregador}</p>
                              </div>
                              <div>
                                <label className="text-xs text-slate-400">Volume</label>
                                <p className="text-slate-200">{entrega.volume}</p>
                              </div>
                            </div>

                            <div>
                              <label className="text-xs text-slate-400">Endereço</label>
                              <p className="text-slate-200">
                                {entrega.rua}, {entrega.numero}<br />
                                {entrega.bairro} - {entrega.cidade}
                              </p>
                            </div>

                            {entrega.observacoes && (
                              <div>
                                <label className="text-xs text-slate-400">Observações</label>
                                <p className="text-slate-200">{entrega.observacoes}</p>
                              </div>
                            )}

                            <div className="pt-2">
                              <div className="flex items-center gap-2 text-xs text-slate-400">
                                <ClockIcon className="w-4 h-4" />
                                <span>
                                  Horário: {String(entrega.horario?.[0] || 0).padStart(2, '0')}:
                                  {String(entrega.horario?.[1] || 0).padStart(2, '0')}
                                </span>
                              </div>
                            </div>

                            {/* Botão Atualizar Entrega */}
                            <div className="flex justify-end pt-4 gap-2">
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                  if (socket && entrega.id) {
                                    socket.emit("Deletar Entrega", entrega);
                                    // Fechamos o acordeão após enviar o evento
                                    setSelectedEntregaId(null);
                                  }
                                }}
                                className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 
                                  rounded-lg transition-all duration-300 flex items-center gap-2 
                                  border border-rose-500/20 hover:border-rose-500/30"
                              >
                                <XMarkIcon className="w-4 h-4" />
                                <span>Remover Entrega</span>
                              </motion.button>
                              
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                  setFormEntrega({...entrega});
                                  setEditingCell({ id: entrega.id!, field: "all", value: "" });
                                }}
                                className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 
                                  rounded-lg transition-all duration-300 flex items-center gap-2 
                                  border border-blue-500/20 hover:border-blue-500/30"
                              >
                                <PencilSquareIcon className="w-4 h-4" />
                                <span>Atualizar Entrega</span>
                              </motion.button>
                            </div>
                          </>
                        )}

                        {/* Formulário de Edição */}
                        {editingCell?.id === entrega.id && formEntrega && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                          >
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-xs text-slate-400">Nome</label>
                                <input
                                  type="text"
                                  value={formEntrega.nome}
                                  onChange={(e) => {
                                    setFormEntrega({
                                      ...formEntrega,
                                      nome: e.target.value
                                    });
                                  }}
                                  className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 
                                    text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-slate-400">Telefone</label>
                                <input
                                  type="text"
                                  value={formEntrega.telefone || ""}
                                  onChange={(e) => {
                                    setFormEntrega({
                                      ...formEntrega,
                                      telefone: e.target.value
                                    });
                                  }}
                                  className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 
                                    text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-slate-400">Valor</label>
                                <input
                                  type="text"
                                  value={formEntrega.valor}
                                  onChange={(e) => {
                                    setFormEntrega({
                                      ...formEntrega,
                                      valor: e.target.value
                                    });
                                  }}
                                  className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 
                                    text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-slate-400">Pagamento</label>
                                <select
                                  value={formEntrega.pagamento}
                                  onChange={(e) => {
                                    setFormEntrega({
                                      ...formEntrega,
                                      pagamento: e.target.value
                                    });
                                  }}
                                  className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 
                                    text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                >
                                  <option value="PIX">PIX</option>
                                  <option value="Dinheiro">Dinheiro</option>
                                  <option value="Cartão">Cartão</option>
                                  <option value="Boleto">Boleto</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-xs text-slate-400">Status Pagamento</label>
                                <select
                                  value={formEntrega.statusPagamento || ""}
                                  onChange={(e) => {
                                    setFormEntrega({
                                      ...formEntrega,
                                      statusPagamento: e.target.value
                                    });
                                  }}
                                  className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 
                                    text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                >
                                  <option value="Aguardando">Aguardando</option>
                                  <option value="Confirmado">Confirmado</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-xs text-slate-400">Entregador</label>
                                <select
                                  value={formEntrega.entregador}
                                  onChange={(e) => {
                                    setFormEntrega({
                                      ...formEntrega,
                                      entregador: e.target.value
                                    });
                                  }}
                                  className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 
                                    text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                >
                                  <option value="Marcos">Marcos Roberto</option>
                                  <option value="Uene">Uene Passos</option>
                                  <option value="Leo">Leo Henrique</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-xs text-slate-400">Volume</label>
                                <select
                                  value={formEntrega.volume}
                                  onChange={(e) => {
                                    setFormEntrega({
                                      ...formEntrega,
                                      volume: e.target.value
                                    });
                                  }}
                                  className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 
                                    text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                >
                                  <option value="Pequeno">Pequeno</option>
                                  <option value="Médio">Médio</option>
                                  <option value="Grande">Grande</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="text-xs text-slate-400">Observações</label>
                              <textarea
                                value={formEntrega.observacoes || ""}
                                onChange={(e) => {
                                  setFormEntrega({
                                    ...formEntrega,
                                    observacoes: e.target.value
                                  });
                                }}
                                className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 
                                  text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 
                                  min-h-[80px] resize-none"
                              />
                            </div>

                            <div>
                              <label className="text-xs text-slate-400">Status</label>
                              <select
                                value={formEntrega.status || "Disponível"}
                                onChange={(e) => {
                                  setFormEntrega({
                                    ...formEntrega,
                                    status: e.target.value
                                  });
                                }}
                                className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 
                                  text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                              >
                                <option value="Disponível">Disponível</option>
                                <option value="Andamento">Andamento</option>
                                <option value="Concluída">Concluída</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-xs text-slate-400">Data da Entrega</label>
                              <input
                                type="date"
                                value={
                                  formEntrega.dia
                                    ? `${formEntrega.dia[2]}-${String(
                                        formEntrega.dia[1]
                                      ).padStart(2, "0")}-${String(
                                        formEntrega.dia[0]
                                      ).padStart(2, "0")}`
                                    : ""
                                }
                                onChange={(e) => {
                                  const [year, month, day] = e.target.value
                                    .split("-")
                                    .map(Number);
                                  if (year && month && day) {
                                    setFormEntrega({
                                      ...formEntrega,
                                      dia: [day, month, year],
                                    });
                                  }
                                }}
                                className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 
                                  text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                              />
                            </div>

                            <div>
                              <label className="text-xs text-slate-400">Status Mensagem</label>
                              <select
                                value={formEntrega.statusMensagem || ""}
                                onChange={(e) => {
                                  setFormEntrega({
                                    ...formEntrega,
                                    statusMensagem: e.target.value
                                  });
                                }}
                                className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 
                                  text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                              >
                                <option value="">Selecione</option>
                                <option value="Enviada">Enviada</option>
                                <option value="Não Enviada">Não Enviada</option>
                              </select>
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                  if (socket && formEntrega) {
                                    setIsSaving(true);
                                    socket.emit("Atualizar Entrega", formEntrega);
                                  }
                                  setEditingCell(null);
                                  setFormEntrega(null);
                                }}
                                className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 
                                  rounded-lg transition-all duration-300 flex items-center gap-2 
                                  border border-emerald-500/20 hover:border-emerald-500/30"
                              >
                                <CheckIcon className="w-4 h-4" />
                                <span>Salvar</span>
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                  setEditingCell(null);
                                  setFormEntrega(null);
                                }}
                                className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 
                                  rounded-lg transition-all duration-300 flex items-center gap-2 
                                  border border-rose-500/20 hover:border-rose-500/30"
                              >
                                <XMarkIcon className="w-4 h-4" />
                                <span>Cancelar</span>
                              </motion.button>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
