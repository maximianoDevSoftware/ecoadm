"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  XMarkIcon,
  CheckCircleIcon,
  PhoneIcon,
  MapPinIcon,
  ExclamationCircleIcon,
  PencilSquareIcon,
  ChatBubbleLeftIcon,
  ArrowUturnLeftIcon,
  TruckIcon,
  UserIcon,
  CalendarDaysIcon,
  EyeIcon,
  ArchiveBoxXMarkIcon,
  ClipboardDocumentIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";
import { useEntregas } from "@/contexts/EntregasContext";
import { entregasTipo } from "@/types/entregasTypes";
import { io } from "socket.io-client";
import { useClientes } from "@/contexts/ClientesContext";
import { clientesTipo } from "@/types/clientesType";

// Função para buscar coordenadas (fora do componente)
const getCoordinates = async ({
  rua,
  numero,
  bairro,
  cidade,
}: {
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
}) => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?street=${encodeURIComponent(
      `${rua} ${numero}`
    )}&city=${encodeURIComponent(cidade)}&format=json`
  );

  const data = await response.json();
  if (!data || data.length === 0) {
    throw new Error("Endereço não encontrado");
  }

  return {
    latitude: parseFloat(data[0].lat),
    longitude: parseFloat(data[0].lon),
  };
};

export default function InProgressBox({
  isOpen,
  onClose,
  isMobile,
}: {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}) {
  const [selectedDelivery, setSelectedDelivery] = useState<entregasTipo | null>(
    null
  );
  const { entregas } = useEntregas();
  const [socket, setSocket] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [sentMessages, setSentMessages] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [editingDelivery, setEditingDelivery] = useState<entregasTipo | null>(
    null
  );
  const [editFormData, setEditFormData] = useState<entregasTipo | null>(null);
  const [editClientFormData, setEditClientFormData] = useState<clientesTipo | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { setClientes } = useClientes();

  const actionButtons = [
    {
      icon: TruckIcon,
      label: "Informar Entregador",
      color: "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20",
    },
    {
      icon: PhoneIcon,
      label: "Informar Cliente",
      color: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
    },
    {
      icon: PencilSquareIcon,
      label: "Editar Entrega",
      color: "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20",
    },
    {
      icon: UserIcon,
      label: "Editar Cliente",
      color: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20",
    },
  ];

  // Filtra apenas entregas em andamento
  const inProgressDeliveries = entregas.filter(
    (delivery) => delivery.status === "Andamento"
  );

  useEffect(() => {
    console.log("Iniciando a conexão socket no InProgressBox");
    const newSocket = io("https://servidor-ecoclean-remaster-production.up.railway.app/");
    setSocket(newSocket);

    // Listener para o evento "Entregas do Dia"
    newSocket.on("Entregas do Dia", (updatedEntregas: entregasTipo[]) => {
      // Atualizar o contexto de entregas se você tiver acesso ao setEntregas
      console.log("Entregas atualizadas", updatedEntregas);
      
      // Atualiza o selectedDelivery quando as entregas são atualizadas
      if (selectedDelivery) {
        const updatedSelectedDelivery = updatedEntregas.find(
          (entrega) => entrega.id === selectedDelivery.id
        );
        if (updatedSelectedDelivery) {
          setSelectedDelivery(updatedSelectedDelivery);
        }
      }
      
      setIsSaving(false);
      setIsEditing(false);
      setIsEditingClient(false);
      setEditFormData(null);
      setEditClientFormData(null);
    });
    
    // Listener para o evento "Buscar Clientes"
    newSocket.on("Buscar Clientes", (clientes) => {
      console.log("Clientes recebidos via Buscar Clientes no InProgressBox:", clientes);
      if (clientes && Array.isArray(clientes)) {
        setClientes(clientes);
      }
    });
    
    // Listener para o evento "Atualizar Cliente"
    newSocket.on("Atualizar Cliente", (clientes) => {
      console.log("Clientes atualizados recebidos via Atualizar Cliente no InProgressBox:", clientes);
      console.log("Tipo de dados recebido:", typeof clientes, Array.isArray(clientes) ? "É um array" : "Não é um array");
      
      // Se não for um array ou for indefinido, registra o erro e não atualiza o estado
      if (!clientes || typeof clientes !== 'object' || !Array.isArray(clientes)) {
        console.error("Dados de clientes inválidos recebidos:", clientes);
        return;
      }
      
      setClientes(clientes);
    });

    return () => {
      newSocket.off("Entregas do Dia");
      newSocket.off("Buscar Clientes");
      newSocket.off("Atualizar Cliente");
      newSocket.disconnect();
    };
  }, [setClientes]);

  const handleSendMessage = (delivery: entregasTipo) => {
    if (socket && delivery.telefone) {
      let contato = delivery.telefone;
      if (!/^\d/.test(contato)) {
        console.log("O contato não começa com um número");
        return;
      }
      if (!contato.startsWith("55")) {
        contato = "55" + contato;
      }
      contato += "@c.us";

      const messageData = {
        contato,
        mensagem: `Olá, nosso entregador ${delivery.entregador} esta a caminho com seus produtos. \nEm breve ele deve chegar até você 😊`,
      };

      socket.emit("Enviar Mensagem", messageData);

      // Atualiza o estado para esta entrega específica
      setSentMessages((prev) => ({
        ...prev,
        [delivery.id!]: true,
      }));

      // Remove o ícone de check após 2 segundos
      setTimeout(() => {
        setSentMessages((prev) => ({
          ...prev,
          [delivery.id!]: false,
        }));
      }, 2000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999] flex items-center justify-center"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl flex 
              ${isMobile ? "flex-col h-[90vh]" : "max-w-6xl w-full h-[80vh]"} 
              overflow-hidden`}
          >
            {/* Lista de Entregas */}
            <div
              className={`flex-1 flex flex-col ${
                !isMobile && "border-r border-white/10"
              }`}
            >
              <div className="p-6 pb-3 border-b border-white/10">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-slate-200">
                    Entregas em Andamento
                  </h2>
                  <button
                    onClick={onClose}
                    className="text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div
                className={`flex-1 overflow-y-auto px-6 py-6
                ${isMobile ? "max-h-[75vh]" : ""}
                [&::-webkit-scrollbar]:w-1.5
                [&::-webkit-scrollbar-track]:bg-transparent
                [&::-webkit-scrollbar-thumb]:bg-white/10
                [&::-webkit-scrollbar-thumb]:rounded-full
                [&::-webkit-scrollbar-thumb]:hover:bg-white/20
                hover:[&::-webkit-scrollbar]:w-2
                transition-all duration-300`}
              >
                <div className="space-y-3 pr-2">
                  {inProgressDeliveries.map((delivery) => (
                    <div
                      key={delivery.id}
                      className={`rounded-lg border border-white/10 bg-white/5 overflow-hidden
                        ${
                          selectedDelivery?.id === delivery.id
                            ? "bg-white/10"
                            : "hover:bg-white/10"
                        }
                        transition-colors relative`}
                    >
                      <div
                        onClick={() => {
                          if (selectedDelivery?.id === delivery.id) {
                            // Se já está selecionada, desseleciona
                            setSelectedDelivery(null);
                          } else {
                            // Se não está selecionada, seleciona
                            setSelectedDelivery(delivery);
                            setIsEditing(false);
                            setIsEditingClient(false);
                          }
                        }}
                        className="p-4 cursor-pointer"
                      >
                        <h3 className="text-slate-200 font-medium mb-2">
                          {delivery.nome}
                        </h3>
                        <p className="text-slate-400 text-sm mb-2">
                          {delivery.rua}, {delivery.numero} - {delivery.bairro}
                        </p>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">
                            {delivery.dia.join("/")}
                          </span>
                          <span className="text-slate-300 font-medium">
                            R$ {delivery.valor}
                          </span>
                        </div>
                      </div>

                      {/* Botões e Detalhes para Mobile e Desktop */}
                      {selectedDelivery?.id === delivery.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-white/10"
                        >
                          {/* Botões de Ação */}
                          <div className="bg-slate-900/95 backdrop-blur-sm">
                            <div className="p-3 flex justify-center gap-3 border-b border-white/10">
                              {actionButtons.map((button, index) => (
                                <motion.button
                                  key={index}
                                  onClick={(e) => {
                                    if (button.label === "Editar Entrega") {
                                      setEditFormData({
                                        ...delivery,
                                        dia: [...delivery.dia],
                                      });
                                      setIsEditing(true);
                                      setIsEditingClient(false);
                                    } else if (
                                      button.label === "Editar Cliente"
                                    ) {
                                      setEditClientFormData({
                                        nome: delivery.nome,
                                        telefone: delivery.telefone || "",
                                        cidade: delivery.cidade,
                                        bairro: delivery.bairro,
                                        rua: delivery.rua,
                                        numero: delivery.numero,
                                        coordenadas: delivery.coordenadas,
                                      });
                                      setIsEditingClient(true);
                                      setIsEditing(false);
                                    } else if (
                                      button.label === "Informar Cliente" &&
                                      selectedDelivery
                                    ) {
                                      handleSendMessage(selectedDelivery);
                                    }
                                  }}
                                  className={`relative group p-2 rounded-lg ${button.color} transition-all duration-200`}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  {button.label === "Informar Cliente" &&
                                  sentMessages[delivery.id || ""] ? (
                                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                  ) : (
                                    <button.icon className="h-5 w-5" />
                                  )}

                                  {/* Tooltip */}
                                  <div
                                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 
                                    group-hover:opacity-100 transition-all duration-200 z-50 pointer-events-none"
                                  >
                                    <div
                                      className="px-3 py-1.5 bg-slate-900/95 text-slate-200 text-sm font-medium rounded-lg
                                      whitespace-nowrap backdrop-blur-sm border border-white/10 shadow-xl
                                      translate-y-2 group-hover:-translate-y-0 transition-all"
                                    >
                                      {button.label}
                                    </div>
                                  </div>
                                </motion.button>
                              ))}
                            </div>

                            {/* Botões de Status */}
                            <div className="p-3 flex justify-between gap-2 border-b border-white/10">
                              <button
                                onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation();
                                  if (socket?.connected) {
                                    socket.emit("Atualizar Entrega", {
                                      ...delivery,
                                      status: "Disponível",
                                    });
                                  }
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 
                                  text-amber-400 hover:text-amber-300 text-xs font-medium rounded-lg transition-all 
                                  duration-200 backdrop-blur-sm border border-amber-500/30 hover:border-amber-500/50"
                              >
                                <ArrowUturnLeftIcon className="h-4 w-4" />
                                Retornar para Disponível
                              </button>

                              {/* Botão de Status de Pagamento */}
                              <select
                                value={delivery.statusPagamento || "Aguardando"}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                  e.stopPropagation();
                                  if (socket?.connected) {
                                    const updatedDelivery = {
                                      ...delivery,
                                      statusPagamento: e.target.value,
                                    };
                                    socket.emit("Atualizar Entrega", updatedDelivery);
                                    
                                    // Atualiza o selectedDelivery imediatamente para refletir a mudança na UI
                                    if (selectedDelivery && selectedDelivery.id === delivery.id) {
                                      setSelectedDelivery(updatedDelivery);
                                    }
                                  }
                                }}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all 
                                  duration-300 backdrop-blur-sm cursor-pointer
                                  ${
                                    delivery.statusPagamento === "Confirmado"
                                      ? "bg-green-500/20 text-green-400 border border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                                      : "bg-blue-500/20 text-blue-400 border border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                  }
                                  focus:outline-none focus:ring-2 focus:ring-blue-500/50
                                  hover:bg-opacity-30 active:scale-[0.98]
                                  [&>option]:bg-slate-800/95 [&>option]:backdrop-blur-xl [&>option]:text-slate-200
                                  [&>option:hover]:bg-slate-700`}
                                style={{
                                  WebkitAppearance: "none",
                                  MozAppearance: "none",
                                  appearance: "none",
                                  backgroundImage: "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2380AFFF' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E\")",
                                  backgroundPosition: "right 0.5rem center",
                                  backgroundRepeat: "no-repeat",
                                  backgroundSize: "1.5em 1.5em",
                                  paddingRight: "2.5rem"
                                }}
                              >
                                <option value="Aguardando">Aguardando Pagamento</option>
                                <option value="Confirmado">Pagamento Confirmado</option>
                              </select>

                              <button
                                onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation();
                                  if (socket && delivery.telefone) {
                                    socket.emit("Atualizar Entrega", {
                                      ...delivery,
                                      status: "Concluída",
                                    });

                                    let contato = delivery.telefone;
                                    if (!/^\d/.test(contato)) {
                                      console.log(
                                        "O contato não começa com um número"
                                      );
                                      return;
                                    }
                                    if (!contato.startsWith("55")) {
                                      contato = "55" + contato;
                                    }
                                    contato += "@c.us";

                                    const messageData = {
                                      contato,
                                      mensagem:
                                        "Seus produtos foram entregues no endereço.\nObrigado pela preferência! 😊",
                                    };
                                    socket.emit("Enviar Mensagem", messageData);
                                  }
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 
                                  text-indigo-400 hover:text-indigo-300 text-xs font-medium rounded-lg transition-all 
                                  duration-200 backdrop-blur-sm border border-indigo-500/30 hover:border-indigo-500/50"
                              >
                                <CheckCircleIcon className="h-4 w-4" />
                                Finalizar Entrega
                              </button>
                            </div>
                          </div>

                          {/* Detalhes da Entrega */}
                          {isMobile && (
                            <div className="p-4 space-y-4">
                              {!isEditing && !isEditingClient && (
                                <>
                                  <div>
                                    <label className="text-xs text-slate-400">
                                      Cliente
                                    </label>
                                    <p className="text-slate-200">
                                      {delivery.nome}
                                    </p>
                                  </div>

                                  <div>
                                    <label className="text-xs text-slate-400">
                                      Telefone
                                    </label>
                                    <p className="text-slate-200">
                                      {delivery.telefone}
                                    </p>
                                  </div>

                                  <div>
                                    <label className="text-xs text-slate-400">
                                      Endereço
                                    </label>
                                    <p className="text-slate-200">
                                      {delivery.rua}, {delivery.numero}
                                      <br />
                                      {delivery.bairro} - {delivery.cidade}
                                    </p>
                                  </div>

                                  <div>
                                    <label className="text-xs text-slate-400">
                                      Volume
                                    </label>
                                    <p className="text-slate-200">
                                      {delivery.volume}
                                    </p>
                                  </div>

                                  <div>
                                    <label className="text-xs text-slate-400">
                                      Data da Entrega
                                    </label>
                                    <p className="text-slate-200">
                                      {delivery.dia.join("/")}
                                    </p>
                                  </div>

                                  <div>
                                    <label className="text-xs text-slate-400">
                                      Entregador
                                    </label>
                                    <p className="text-slate-200">
                                      {delivery.entregador}
                                    </p>
                                  </div>

                                  <div>
                                    <label className="text-xs text-slate-400">
                                      Valor
                                    </label>
                                    <p className="text-slate-200">
                                      R$ {delivery.valor}
                                    </p>
                                  </div>

                                  <div>
                                    <label className="text-xs text-slate-400">
                                      Pagamento
                                    </label>
                                    <p className="text-slate-200">
                                      {delivery.pagamento}
                                    </p>
                                  </div>

                                  <div>
                                    <label className="text-xs text-slate-400">
                                      Status de Pagamento
                                    </label>
                                    <p className="text-slate-200">
                                      {delivery.statusPagamento === "Confirmado" ? (
                                        <span className="text-green-400 font-medium relative inline-block">
                                          <span className="absolute inset-0 bg-green-400/10 rounded-md blur-md"></span>
                                          <span className="relative z-10">Confirmado</span>
                                        </span>
                                      ) : (
                                        <span className="text-amber-400 font-medium relative inline-block">
                                          <span className="absolute inset-0 bg-amber-400/10 rounded-md blur-md"></span>
                                          <span className="relative z-10">Aguardando</span>
                                        </span>
                                      )}
                                    </p>
                                  </div>

                                  {delivery.observacoes && (
                                    <div>
                                      <label className="text-xs text-slate-400">
                                        Observações
                                      </label>
                                      <p className="text-slate-200">
                                        {delivery.observacoes}
                                      </p>
                                    </div>
                                  )}
                                </>
                              )}

                              {/* Formulário de edição de cliente para mobile */}
                              {isEditingClient && (
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  transition={{ duration: 0.2 }}
                                  className="flex-1 overflow-y-auto pr-2 space-y-4 mt-4
                                  [&::-webkit-scrollbar]:w-1.5
                                  [&::-webkit-scrollbar-track]:bg-transparent
                                  [&::-webkit-scrollbar-thumb]:bg-white/10
                                  [&::-webkit-scrollbar-thumb]:rounded-full
                                  [&::-webkit-scrollbar-thumb]:hover:bg-white/20
                                  hover:[&::-webkit-scrollbar]:w-2
                                  transition-all duration-300"
                                >
                                    <div>
                                    <label className="text-xs text-slate-400">Nome</label>
                                      <input
                                        type="text"
                                      value={editClientFormData?.nome || ""}
                                        onChange={(e) =>
                                        setEditClientFormData((prev) => ({
                                          ...prev!,
                                            nome: e.target.value,
                                        }))
                                        }
                                      className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 
                                        focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm shadow-inner shadow-black/10"
                                      />
                                    </div>

                                    <div>
                                    <label className="text-xs text-slate-400">
                                        Telefone
                                      </label>
                                      <input
                                        type="text"
                                      value={editClientFormData?.telefone || ""}
                                        onChange={(e) =>
                                        setEditClientFormData((prev) => ({
                                          ...prev!,
                                            telefone: e.target.value,
                                        }))
                                        }
                                      className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 
                                        text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 
                                        focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm shadow-inner shadow-black/10"
                                      />
                                    </div>

                                    <div>
                                    <label className="text-xs text-slate-400">
                                        Cidade
                                      </label>
                                      <input
                                        type="text"
                                      value={editClientFormData?.cidade || ""}
                                        onChange={(e) =>
                                        setEditClientFormData((prev) => ({
                                          ...prev!,
                                            cidade: e.target.value,
                                        }))
                                        }
                                      className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 
                                        focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm shadow-inner shadow-black/10"
                                      />
                                    </div>

                                    <div>
                                    <label className="text-xs text-slate-400">
                                        Bairro
                                      </label>
                                      <input
                                        type="text"
                                      value={editClientFormData?.bairro || ""}
                                        onChange={(e) =>
                                        setEditClientFormData((prev) => ({
                                          ...prev!,
                                            bairro: e.target.value,
                                        }))
                                        }
                                      className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 
                                        focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm shadow-inner shadow-black/10"
                                      />
                                    </div>

                                    <div>
                                    <label className="text-xs text-slate-400">Rua</label>
                                      <input
                                        type="text"
                                      value={editClientFormData?.rua || ""}
                                        onChange={(e) =>
                                        setEditClientFormData((prev) => ({
                                          ...prev!,
                                            rua: e.target.value,
                                        }))
                                        }
                                      className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 
                                        focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm shadow-inner shadow-black/10"
                                      />
                                    </div>

                                    <div>
                                    <label className="text-xs text-slate-400">
                                        Número
                                      </label>
                                      <input
                                        type="text"
                                      value={editClientFormData?.numero || ""}
                                        onChange={(e) =>
                                        setEditClientFormData((prev) => ({
                                          ...prev!,
                                            numero: e.target.value,
                                        }))
                                        }
                                      className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 
                                        focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm shadow-inner shadow-black/10"
                                      />
                                    </div>

                                    <div>
                                    <label className="text-xs text-slate-400">
                                      Coordenadas
                                      </label>
                                      <div className="space-y-2">
                                        <button
                                          type="button"
                                          onClick={async () => {
                                            if (
                                              !editClientFormData?.rua ||
                                              !editClientFormData?.numero ||
                                              !editClientFormData?.bairro ||
                                              !editClientFormData?.cidade
                                            ) {
                                              alert("Preencha o endereço completo primeiro");
                                              return;
                                            }

                                            try {
                                              const coordinates = await getCoordinates({
                                                rua: editClientFormData.rua,
                                                numero: editClientFormData.numero,
                                                bairro: editClientFormData.bairro,
                                                cidade: editClientFormData.cidade,
                                              });

                                              setEditClientFormData((prev) => ({
                                                ...prev!,
                                                coordenadas: coordinates,
                                              }));
                                            } catch (error) {
                                              alert(
                                                "Não foi possível encontrar as coordenadas para este endereço"
                                              );
                                            }
                                          }}
                                          className="w-full px-4 py-3 bg-blue-600/20 hover:bg-blue-600/30 
                                            text-blue-400 rounded-lg transition-all flex items-center justify-center gap-2
                                            disabled:opacity-50 disabled:cursor-not-allowed border border-blue-500/20 hover:border-blue-500/30"
                                        >
                                          <GlobeAltIcon className="h-5 w-5" />
                                          Gerar Localização Online
                                        </button>
                                        <input
                                          type="text"
                                          value={`${editClientFormData?.coordenadas?.latitude || ""}, ${editClientFormData?.coordenadas?.longitude || ""}`}
                                          onChange={(e) => {
                                            const [lat, lng] = e.target.value
                                              .split(",")
                                              .map((v) => v.trim());
                                            setEditClientFormData((prev) => ({
                                              ...prev!,
                                              coordenadas: {
                                                latitude: parseFloat(lat) || 0,
                                                longitude: parseFloat(lng) || 0,
                                              },
                                            }));
                                          }}
                                          placeholder="-25.838523944195668, -48.53857383068678"
                                          className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm shadow-inner shadow-black/10"
                                      />
                                    </div>
                                  </div>

                                    <div className="flex gap-2 pt-4">
                                      <motion.button
                                      onClick={() => {
                                          if (socket && editClientFormData) {
                                            setIsSaving(true);
                                            
                                            // Atraso pequeno para permitir a animação e feedback visual
                                            setTimeout(() => {
                                              console.log("Enviando cliente atualizado:", editClientFormData);
                                          socket.emit(
                                                "Atualizar Cliente",
                                                editClientFormData
                                              );
                                              // Limpa o painel de detalhes após salvar com transição mais suave
                                              setTimeout(() => {
                                                setSelectedDelivery(null);
                                                setIsEditingClient(false);
                                                setEditClientFormData(null);
                                                setIsSaving(false);
                                              }, 300);
                                            }, 300);
                                          }
                                        }}
                                        disabled={isSaving}
                                        whileHover={!isSaving ? { scale: 1.02 } : {}}
                                        whileTap={!isSaving ? { scale: 0.98 } : {}}
                                        className={`flex-1 ${
                                          isSaving ? 'bg-purple-500/20' : 'bg-purple-500/10 hover:bg-purple-500/20'
                                        } text-purple-500 
                                          rounded-lg py-2 font-medium transition-all duration-300 shadow-lg shadow-purple-500/10
                                          hover:shadow-purple-500/20 backdrop-blur-sm border border-purple-500/30
                                          hover:border-purple-500/50 ${isSaving ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                      >
                                        {isSaving ? (
                                          <motion.span 
                                            className="flex items-center justify-center gap-2"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.2 }}
                                          >
                                            <svg className="animate-spin h-4 w-4 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span className="text-purple-400">Atualizando cliente...</span>
                                          </motion.span>
                                        ) : (
                                          <span>Salvar</span>
                                        )}
                                      </motion.button>
                                      <motion.button
                                        onClick={() => {
                                          setIsEditingClient(false);
                                          setEditClientFormData(null);
                                        }}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 
                                          rounded-lg py-2 font-medium transition-all duration-300 shadow-lg shadow-rose-500/10
                                          hover:shadow-rose-500/20 backdrop-blur-sm border border-rose-500/30
                                          hover:border-rose-500/50 cursor-pointer"
                                      >
                                        <span>Cancelar</span>
                                      </motion.button>
                                  </div>
                                </motion.div>
                              )}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Painel de Detalhes (à direita) */}
            {!isMobile && selectedDelivery && (
              <div className="w-1/3 p-6 overflow-hidden flex flex-col">
                <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                  {isEditing ? (
                    <PencilSquareIcon className="h-5 w-5 text-amber-500" />
                  ) : isEditingClient ? (
                    <UserIcon className="h-5 w-5 text-purple-500" />
                  ) : (
                    <ClipboardDocumentIcon className="h-5 w-5 text-slate-400" />
                  )}
                  <span>
                    {isEditing
                      ? "Editar Entrega"
                      : isEditingClient
                      ? "Editar Cliente"
                      : "Detalhes da Entrega"}
                  </span>
                    </h3>

                {/* Visualização dos detalhes quando não está editando */}
                {!isEditing && !isEditingClient && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 overflow-y-auto pr-2 space-y-4
                      [&::-webkit-scrollbar]:w-1.5
                      [&::-webkit-scrollbar-track]:bg-transparent
                      [&::-webkit-scrollbar-thumb]:bg-white/10
                      [&::-webkit-scrollbar-thumb]:rounded-full
                      [&::-webkit-scrollbar-thumb]:hover:bg-white/20
                      hover:[&::-webkit-scrollbar]:w-2
                      transition-all duration-300"
                    >
                      <div>
                        <label className="text-xs text-slate-400">
                          Cliente
                        </label>
                        <p className="text-slate-200">
                          {selectedDelivery.nome}
                        </p>
                      </div>

                      <div>
                        <label className="text-xs text-slate-400">
                          Telefone
                        </label>
                        <p className="text-slate-200">
                          {selectedDelivery.telefone}
                        </p>
                      </div>

                      <div>
                        <label className="text-xs text-slate-400">
                          Endereço
                        </label>
                        <p className="text-slate-200">
                          {selectedDelivery.rua}, {selectedDelivery.numero}
                          <br />
                          {selectedDelivery.bairro} - {selectedDelivery.cidade}
                        </p>
                      </div>

                      <div>
                      <label className="text-xs text-slate-400">
                        Data da Entrega
                      </label>
                        <p className="text-slate-200">
                          {selectedDelivery.dia.join("/")}
                        </p>
                      </div>

                      <div>
                        <label className="text-xs text-slate-400">
                          Entregador
                        </label>
                        <p className="text-slate-200">
                          {selectedDelivery.entregador}
                        </p>
                      </div>

                      <div>
                      <label className="text-xs text-slate-400">
                        Volume
                      </label>
                        <p className="text-slate-200">
                          {selectedDelivery.volume}
                        </p>
                      </div>

                      <div>
                      <label className="text-xs text-slate-400">
                        Valor
                      </label>
                      <p className="text-emerald-400 font-medium">
                          R$ {selectedDelivery.valor}
                        </p>
                      </div>

                      <div>
                        <label className="text-xs text-slate-400">
                          Pagamento
                        </label>
                        <p className="text-slate-200">
                          {selectedDelivery.pagamento}
                        </p>
                      </div>

                    <div>
                      <label className="text-xs text-slate-400">
                        Status de Pagamento
                      </label>
                      <p className="text-slate-200">
                        {selectedDelivery.statusPagamento === "Confirmado" ? (
                          <span className="text-green-400 font-medium relative inline-block">
                            <span className="absolute inset-0 bg-green-400/10 rounded-md blur-md"></span>
                            <span className="relative z-10">Confirmado</span>
                          </span>
                        ) : (
                          <span className="text-amber-400 font-medium relative inline-block">
                            <span className="absolute inset-0 bg-amber-400/10 rounded-md blur-md"></span>
                            <span className="relative z-10">Aguardando</span>
                          </span>
                        )}
                        </p>
                      </div>

                      {selectedDelivery.observacoes && (
                        <div>
                          <label className="text-xs text-slate-400">
                            Observações
                          </label>
                          <p className="text-slate-200">
                            {selectedDelivery.observacoes}
                          </p>
                        </div>
                      )}
                    
                    <div>
                      <label className="text-xs text-slate-400">
                        Coordenadas
                      </label>
                      <p className="text-slate-200 font-mono text-xs">
                        {selectedDelivery.coordenadas?.latitude}, {selectedDelivery.coordenadas?.longitude}
                      </p>
                    </div>
                  </motion.div>
                )}
                
                {isEditing && !isEditingClient && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 overflow-y-auto pr-2 space-y-4
                      [&::-webkit-scrollbar]:w-1.5
                      [&::-webkit-scrollbar-track]:bg-transparent
                      [&::-webkit-scrollbar-thumb]:bg-white/10
                      [&::-webkit-scrollbar-thumb]:rounded-full
                      [&::-webkit-scrollbar-thumb]:hover:bg-white/20
                      hover:[&::-webkit-scrollbar]:w-2
                      transition-all duration-300"
                  >
                    <div>
                      <label className="text-xs text-slate-400">Cliente</label>
                      <input
                        type="text"
                        value={editFormData?.nome || ""}
                        onChange={(e) =>
                          setEditFormData((prev) => ({
                            ...prev!,
                            nome: e.target.value,
                          }))
                        }
                        className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-300 backdrop-blur-sm shadow-inner shadow-black/10"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400">Telefone</label>
                      <input
                        type="text"
                        value={editFormData?.telefone || ""}
                        onChange={(e) =>
                          setEditFormData((prev) => ({
                            ...prev!,
                            telefone: e.target.value,
                          }))
                        }
                        className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-300 backdrop-blur-sm shadow-inner shadow-black/10"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-400">Cidade</label>
                        <input
                          type="text"
                          value={editFormData?.cidade || ""}
                          onChange={(e) =>
                            setEditFormData((prev) => ({
                              ...prev!,
                              cidade: e.target.value,
                            }))
                          }
                          className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-300 backdrop-blur-sm shadow-inner shadow-black/10"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-slate-400">Bairro</label>
                        <input
                          type="text"
                          value={editFormData?.bairro || ""}
                          onChange={(e) =>
                            setEditFormData((prev) => ({
                              ...prev!,
                              bairro: e.target.value,
                            }))
                          }
                          className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-300 backdrop-blur-sm shadow-inner shadow-black/10"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-400">Rua</label>
                        <input
                          type="text"
                          value={editFormData?.rua || ""}
                          onChange={(e) =>
                            setEditFormData((prev) => ({
                              ...prev!,
                              rua: e.target.value,
                            }))
                          }
                          className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-300 backdrop-blur-sm shadow-inner shadow-black/10"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-slate-400">Número</label>
                        <input
                          type="text"
                          value={editFormData?.numero || ""}
                          onChange={(e) =>
                            setEditFormData((prev) => ({
                              ...prev!,
                              numero: e.target.value,
                            }))
                          }
                          className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-300 backdrop-blur-sm shadow-inner shadow-black/10"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400">Volume</label>
                      <input
                        type="text"
                        value={editFormData?.volume || ""}
                        onChange={(e) =>
                          setEditFormData((prev) => ({
                            ...prev!,
                            volume: e.target.value,
                          }))
                        }
                        className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-300 backdrop-blur-sm shadow-inner shadow-black/10"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-400">Data (DD/MM/YYYY)</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="1"
                            max="31"
                            value={editFormData?.dia?.[0] || ""}
                            onChange={(e) =>
                              setEditFormData((prev) => ({
                                ...prev!,
                                dia: [
                                  parseInt(e.target.value) || prev!.dia[0],
                                  prev!.dia[1],
                                  prev!.dia[2],
                                ],
                              }))
                            }
                            className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-300 backdrop-blur-sm shadow-inner shadow-black/10 
                            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <input
                            type="number"
                            min="1"
                            max="12"
                            value={editFormData?.dia?.[1] || ""}
                            onChange={(e) =>
                              setEditFormData((prev) => ({
                                ...prev!,
                                dia: [
                                  prev!.dia[0],
                                  parseInt(e.target.value) || prev!.dia[1],
                                  prev!.dia[2],
                                ],
                              }))
                            }
                            className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-300 backdrop-blur-sm shadow-inner shadow-black/10
                            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <input
                            type="number"
                            min="2023"
                            max="2030"
                            value={editFormData?.dia?.[2] || ""}
                            onChange={(e) =>
                              setEditFormData((prev) => ({
                                ...prev!,
                                dia: [
                                  prev!.dia[0],
                                  prev!.dia[1],
                                  parseInt(e.target.value) || prev!.dia[2],
                                ],
                              }))
                            }
                            className="w-full min-w-[70px] bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-300 backdrop-blur-sm shadow-inner shadow-black/10
                            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-slate-400">Hora</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="0"
                            max="23"
                            value={editFormData?.horario?.[0] || ""}
                            onChange={(e) =>
                              setEditFormData((prev) => ({
                                ...prev!,
                                horario: [
                                  parseInt(e.target.value) || 0,
                                  prev?.horario?.[1] || 0,
                                ],
                              }))
                            }
                            className="w-full min-w-[60px] bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-300 backdrop-blur-sm shadow-inner shadow-black/10
                            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <input
                            type="number"
                            min="0"
                            max="59"
                            value={editFormData?.horario?.[1] || ""}
                            onChange={(e) =>
                              setEditFormData((prev) => ({
                                ...prev!,
                                horario: [
                                  prev?.horario?.[0] || 0,
                                  parseInt(e.target.value) || 0,
                                ],
                              }))
                            }
                            className="w-full min-w-[60px] bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-300 backdrop-blur-sm shadow-inner shadow-black/10
                            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400">Entregador</label>
                      <select
                        value={editFormData?.entregador || ""}
                        onChange={(e) =>
                          setEditFormData((prev) => ({
                            ...prev!,
                            entregador: e.target.value,
                          }))
                        }
                        className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-300 backdrop-blur-sm shadow-inner shadow-black/10"
                      >
                        <option value="Marcos">Marcos Roberto</option>
                        <option value="Uene">Uene Passos</option>
                        <option value="Leo">Leo Henrique</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400">Valor</label>
                      <input
                        type="text"
                        value={editFormData?.valor || ""}
                        onChange={(e) =>
                          setEditFormData((prev) => ({
                            ...prev!,
                            valor: e.target.value,
                          }))
                        }
                        className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-300 backdrop-blur-sm shadow-inner shadow-black/10"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-400">Pagamento</label>
                        <select
                          value={editFormData?.pagamento || ""}
                          onChange={(e) =>
                            setEditFormData((prev) => ({
                              ...prev!,
                              pagamento: e.target.value,
                            }))
                          }
                          className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-300 backdrop-blur-sm shadow-inner shadow-black/10"
                        >
                          <option value="Dinheiro">Dinheiro</option>
                          <option value="PIX">PIX</option>
                          <option value="Cartão de Crédito">Cartão de Crédito</option>
                          <option value="Cartão de Débito">Cartão de Débito</option>
                          <option value="Transferência Bancária">Transferência Bancária</option>
                          <option value="Boleto">Boleto</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs text-slate-400">Status do Pagamento</label>
                        <select
                          value={editFormData?.statusPagamento || ""}
                          onChange={(e) =>
                            setEditFormData((prev) => ({
                              ...prev!,
                              statusPagamento: e.target.value,
                            }))
                          }
                          className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-300 backdrop-blur-sm shadow-inner shadow-black/10"
                        >
                          <option value="Aguardando">Aguardando</option>
                          <option value="Confirmado">Confirmado</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400">Observações</label>
                      <textarea
                        value={editFormData?.observacoes || ""}
                        onChange={(e) =>
                          setEditFormData((prev) => ({
                            ...prev!,
                            observacoes: e.target.value,
                          }))
                        }
                        className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-300 backdrop-blur-sm shadow-inner shadow-black/10"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400">Coordenadas</label>
                      <input
                        type="text"
                        value={`${
                          editFormData?.coordenadas?.latitude || ""
                        }, ${editFormData?.coordenadas?.longitude || ""}`}
                        onChange={(e) => {
                          const [lat, lng] = e.target.value
                            .split(",")
                            .map((v) => v.trim());
                          setEditFormData((prev) => ({
                            ...prev!,
                            coordenadas: {
                              latitude: parseFloat(lat) || 0,
                              longitude: parseFloat(lng) || 0,
                            },
                          }));
                        }}
                        placeholder="-25.838523944195668, -48.53857383068678"
                        className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-300 backdrop-blur-sm shadow-inner shadow-black/10"
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <motion.button
                        onClick={() => {
                          if (socket && editFormData) {
                            setIsSaving(true);
                            
                            // Atraso pequeno para permitir a animação e feedback visual
                            setTimeout(() => {
                              console.log("Enviando entrega atualizada:", editFormData);
                              socket.emit("Atualizar Entrega", editFormData);
                              // Limpa o painel de detalhes após salvar com transição mais suave
                              setTimeout(() => {
                                setSelectedDelivery(null);
                                setIsEditing(false);
                                setEditFormData(null);
                                setIsSaving(false);
                              }, 300);
                            }, 300);
                          }
                        }}
                        disabled={isSaving}
                        whileHover={!isSaving ? { scale: 1.02 } : {}}
                        whileTap={!isSaving ? { scale: 0.98 } : {}}
                        className={`flex-1 ${
                          isSaving ? 'bg-amber-500/20' : 'bg-amber-500/10 hover:bg-amber-500/20'
                        } text-amber-500 
                          rounded-lg py-2 font-medium transition-all duration-300 shadow-lg shadow-amber-500/10
                          hover:shadow-amber-500/20 backdrop-blur-sm border border-amber-500/30
                          hover:border-amber-500/50 ${isSaving ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {isSaving ? (
                          <motion.span 
                            className="flex items-center justify-center gap-2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            <svg className="animate-spin h-4 w-4 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-amber-400">Atualizando entrega...</span>
                          </motion.span>
                        ) : (
                          <span>Salvar</span>
                        )}
                      </motion.button>
                      <motion.button
                        onClick={() => {
                          setIsEditing(false);
                          setEditFormData(null);
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 
                          rounded-lg py-2 font-medium transition-all duration-300 shadow-lg shadow-rose-500/10
                          hover:shadow-rose-500/20 backdrop-blur-sm border border-rose-500/30
                          hover:border-rose-500/50 cursor-pointer"
                      >
                        <span>Cancelar</span>
                      </motion.button>
                  </div>
                  </motion.div>
                )}
                
                {/* Formulário de Edição do Cliente */}
                {!isEditing && isEditingClient && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 overflow-y-auto pr-2 space-y-4
                      [&::-webkit-scrollbar]:w-1.5
                      [&::-webkit-scrollbar-track]:bg-transparent
                      [&::-webkit-scrollbar-thumb]:bg-white/10
                      [&::-webkit-scrollbar-thumb]:rounded-full
                      [&::-webkit-scrollbar-thumb]:hover:bg-white/20
                      hover:[&::-webkit-scrollbar]:w-2
                      transition-all duration-300"
                  >
                    <div>
                      <label className="text-xs text-slate-400">Nome</label>
                      <input
                        type="text"
                        value={editClientFormData?.nome || ""}
                        onChange={(e) =>
                          setEditClientFormData((prev) => ({
                            ...prev!,
                            nome: e.target.value,
                          }))
                        }
                        className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm shadow-inner shadow-black/10"
                      />
              </div>

                    <div>
                      <label className="text-xs text-slate-400">
                        Telefone
                      </label>
                      <input
                        type="text"
                        value={editClientFormData?.telefone || ""}
                        onChange={(e) =>
                          setEditClientFormData((prev) => ({
                            ...prev!,
                            telefone: e.target.value,
                          }))
                        }
                        className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm shadow-inner shadow-black/10"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400">
                        Cidade
                      </label>
                      <input
                        type="text"
                        value={editClientFormData?.cidade || ""}
                        onChange={(e) =>
                          setEditClientFormData((prev) => ({
                            ...prev!,
                            cidade: e.target.value,
                          }))
                        }
                        className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm shadow-inner shadow-black/10"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400">
                        Bairro
                      </label>
                      <input
                        type="text"
                        value={editClientFormData?.bairro || ""}
                        onChange={(e) =>
                          setEditClientFormData((prev) => ({
                            ...prev!,
                            bairro: e.target.value,
                          }))
                        }
                        className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm shadow-inner shadow-black/10"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400">Rua</label>
                      <input
                        type="text"
                        value={editClientFormData?.rua || ""}
                        onChange={(e) =>
                          setEditClientFormData((prev) => ({
                            ...prev!,
                            rua: e.target.value,
                          }))
                        }
                        className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm shadow-inner shadow-black/10"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400">
                        Número
                      </label>
                      <input
                        type="text"
                        value={editClientFormData?.numero || ""}
                        onChange={(e) =>
                          setEditClientFormData((prev) => ({
                            ...prev!,
                            numero: e.target.value,
                          }))
                        }
                        className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm shadow-inner shadow-black/10"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400">
                        Coordenadas
                      </label>
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={async () => {
                            if (
                              !editClientFormData?.rua ||
                              !editClientFormData?.numero ||
                              !editClientFormData?.bairro ||
                              !editClientFormData?.cidade
                            ) {
                              alert("Preencha o endereço completo primeiro");
                              return;
                            }

                            try {
                              const coordinates = await getCoordinates({
                                rua: editClientFormData.rua,
                                numero: editClientFormData.numero,
                                bairro: editClientFormData.bairro,
                                cidade: editClientFormData.cidade,
                              });

                              setEditClientFormData((prev) => ({
                                ...prev!,
                                coordenadas: coordinates,
                              }));
                            } catch (error) {
                              alert(
                                "Não foi possível encontrar as coordenadas para este endereço"
                              );
                            }
                          }}
                          className="w-full px-4 py-3 bg-blue-600/20 hover:bg-blue-600/30 
                            text-blue-400 rounded-lg transition-all flex items-center justify-center gap-2
                            disabled:opacity-50 disabled:cursor-not-allowed border border-blue-500/20 hover:border-blue-500/30"
                        >
                          <GlobeAltIcon className="h-5 w-5" />
                          Gerar Localização Online
                        </button>
                        <input
                          type="text"
                          value={`${editClientFormData?.coordenadas?.latitude || ""}, ${editClientFormData?.coordenadas?.longitude || ""}`}
                          onChange={(e) => {
                            const [lat, lng] = e.target.value
                              .split(",")
                              .map((v) => v.trim());
                            setEditClientFormData((prev) => ({
                              ...prev!,
                              coordenadas: {
                                latitude: parseFloat(lat) || 0,
                                longitude: parseFloat(lng) || 0,
                              },
                            }));
                          }}
                          placeholder="-25.838523944195668, -48.53857383068678"
                          className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm shadow-inner shadow-black/10"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <motion.button
                        onClick={() => {
                          if (socket && editClientFormData) {
                            setIsSaving(true);
                            
                            // Atraso pequeno para permitir a animação e feedback visual
                            setTimeout(() => {
                              console.log("Enviando cliente atualizado:", editClientFormData);
                              socket.emit(
                                "Atualizar Cliente",
                                editClientFormData
                              );
                              // Limpa o painel de detalhes após salvar com transição mais suave
                              setTimeout(() => {
                                setSelectedDelivery(null);
                                setIsEditingClient(false);
                                setEditClientFormData(null);
                                setIsSaving(false);
                              }, 300);
                            }, 300);
                          }
                        }}
                        disabled={isSaving}
                        whileHover={!isSaving ? { scale: 1.02 } : {}}
                        whileTap={!isSaving ? { scale: 0.98 } : {}}
                        className={`flex-1 ${
                          isSaving ? 'bg-purple-500/20' : 'bg-purple-500/10 hover:bg-purple-500/20'
                        } text-purple-500 
                          rounded-lg py-2 font-medium transition-all duration-300 shadow-lg shadow-purple-500/10
                          hover:shadow-purple-500/20 backdrop-blur-sm border border-purple-500/30
                          hover:border-purple-500/50 ${isSaving ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {isSaving ? (
                          <motion.span 
                            className="flex items-center justify-center gap-2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            <svg className="animate-spin h-4 w-4 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-purple-400">Atualizando cliente...</span>
                          </motion.span>
                        ) : (
                          <span>Salvar</span>
                        )}
                      </motion.button>
                      <motion.button
                        onClick={() => {
                          setIsEditingClient(false);
                          setEditClientFormData(null);
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 
                          rounded-lg py-2 font-medium transition-all duration-300 shadow-lg shadow-rose-500/10
                          hover:shadow-rose-500/20 backdrop-blur-sm border border-rose-500/30
                          hover:border-rose-500/50 cursor-pointer"
                      >
                        <span>Cancelar</span>
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
