"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  XMarkIcon,
  TruckIcon,
  PhoneIcon,
  PencilSquareIcon,
  UserIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ClipboardDocumentIcon,
  CheckCircleIcon,
  PlayIcon,
} from "@heroicons/react/24/outline";
import { useEntregas } from "@/contexts/EntregasContext";
import { entregasTipo } from "@/types/entregasTypes";
import { clientesTipo } from "@/types/clientesType";
import { io } from "socket.io-client";

export default function DeliveryBox({
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
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingClient, setIsEditingClient] = useState(false);
  const { entregas, setEntregas } = useEntregas();
  const [editFormData, setEditFormData] = useState<entregasTipo | null>(null);
  const [editClientFormData, setEditClientFormData] =
    useState<clientesTipo | null>(null);
  const [socket, setSocket] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [messageButtonStates, setMessageButtonStates] = useState<{
    [key: string]: boolean;
  }>({});

  useEffect(() => {
    const newSocket = io("https://web-production-0d584.up.railway.app/");
    setSocket(newSocket);

    // Listener para o evento "Atualizando entregas"
    newSocket.on("Atualizando entregas", (entregas: entregasTipo[]) => {
      setEntregas(entregas);
      setIsSaving(false);
      setIsEditing(false);
      setEditFormData(null);
    });

    // Listener para o evento "Atualizando clientes"
    newSocket.on("Atualizando clientes", () => {
      setIsSaving(false);
      setIsEditingClient(false);
      setEditClientFormData(null);
    });

    return () => {
      newSocket.close();
    };
  }, [setEntregas]);

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

  const availableUsers = [
    { name: "Marcos Roberto", value: "Marcos" },
    { name: "Uene Passos", value: "Uene" },
    { name: "Leo Henrique", value: "Leo" },
  ];

  // Filtra apenas entregas disponíveis
  const availableDeliveries = entregas.filter(
    (delivery) => delivery.status === "Disponível"
  );

  const handleSendMessage = (delivery: entregasTipo) => {
    if (!socket || !delivery.telefone) return;

    // Verifica se o primeiro caractere é um número
    if (!/^\d/.test(delivery.telefone)) {
      console.log("O contato não começa com um número");
      return;
    }

    // Formata o número do contato
    let contato = delivery.telefone;
    if (!contato.startsWith("55")) {
      contato = "55" + contato;
    }
    contato += "@c.us";

    // Objeto da mensagem
    const messageData = {
      contato,
      mensagem: `Olá, nosso entregador ${delivery.entregador} esta a caminho com seus produtos. \nEm breve ele deve chegar até você 😊`,
    };

    // Emite o evento de mensagem
    socket.emit("Enviar Mensagem", messageData);

    // Atualiza o estado do botão para mostrar a animação
    setMessageButtonStates((prev) => ({
      ...prev,
      [`cliente-${delivery.id || ""}`]: true,
    }));

    // Reseta o estado após 2 segundos
    setTimeout(() => {
      setMessageButtonStates((prev) => ({
        ...prev,
        [`cliente-${delivery.id || ""}`]: false,
      }));
    }, 2000);
  };

  const handleInformEntregador = (delivery: entregasTipo) => {
    if (!socket || !delivery.entregador) return;

    // Define o contato baseado no entregador
    let contato;
    switch (delivery.entregador) {
      case "Marcos":
        contato = "554187280741";
        break;
      case "Uene":
        contato = "554195762570";
        break;
      case "Leo":
        contato = "554187280742";
        break;
      default:
        console.log("Entregador não reconhecido");
        return;
    }
    contato += "@c.us";

    // Objeto da mensagem
    const messageData = {
      contato,
      mensagem: `Você tem uma entrega disponível para ${delivery.nome}`,
    };

    // Emite o evento de mensagem
    socket.emit("Enviar Mensagem", messageData);

    // Atualiza o estado do botão para mostrar a animação
    setMessageButtonStates((prev) => ({
      ...prev,
      [`entregador-${delivery.id || ""}`]: true,
    }));

    // Reseta o estado após 2 segundos
    setTimeout(() => {
      setMessageButtonStates((prev) => ({
        ...prev,
        [`entregador-${delivery.id || ""}`]: false,
      }));
    }, 2000);
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
            initial={{
              scale: 0.9,
              opacity: 0,
              y: 20,
            }}
            animate={{
              scale: 1,
              opacity: 1,
              y: 0,
            }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
            }}
            className={`bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl flex 
              ${
                isMobile
                  ? "flex-col h-[90vh] w-full mx-4"
                  : "max-w-6xl w-full h-[80vh]"
              } 
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
                    Entregas Disponíveis
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
                  {availableDeliveries.map((delivery) => (
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
                                  onClick={() => {
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
                                    } else if (
                                      button.label === "Informar Entregador" &&
                                      selectedDelivery
                                    ) {
                                      handleInformEntregador(selectedDelivery);
                                    }
                                  }}
                                  className={`relative group p-2 rounded-lg ${button.color} transition-all duration-200`}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  {button.label === "Informar Cliente" &&
                                  messageButtonStates[
                                    `cliente-${delivery.id || ""}`
                                  ] ? (
                                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                  ) : button.label === "Informar Entregador" &&
                                    messageButtonStates[
                                      `entregador-${delivery.id || ""}`
                                    ] ? (
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
                                      status: "Andamento",
                                    });
                                  }
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 
                                  text-amber-400 hover:text-amber-300 text-xs font-medium rounded-lg transition-all 
                                  duration-200 backdrop-blur-sm border border-amber-500/30 hover:border-amber-500/50"
                              >
                                <PlayIcon className="h-4 w-4" />
                                Em Andamento
                              </button>

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
                              {!isEditing ? (
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
                              ) : (
                                // Formulário de Edição
                                <div
                                  className="flex-1 overflow-y-auto pr-2 space-y-4
                                  [&::-webkit-scrollbar]:w-1
                                  [&::-webkit-scrollbar-track]:bg-transparent
                                  [&::-webkit-scrollbar-thumb]:bg-white/5
                                  [&::-webkit-scrollbar-thumb]:rounded-full
                                  [&::-webkit-scrollbar-thumb]:hover:bg-white/10
                                  hover:[&::-webkit-scrollbar]:w-1.5
                                  transition-all duration-300"
                                >
                                  <div>
                                    <label className="text-xs text-slate-400">
                                      Cliente
                                    </label>
                                    <input
                                      type="text"
                                      value={editFormData?.nome || ""}
                                      onChange={(e) =>
                                        setEditFormData((prev) => ({
                                          ...prev!,
                                          nome: e.target.value,
                                        }))
                                      }
                                      className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-xs text-slate-400">
                                      Telefone
                                    </label>
                                    <input
                                      type="text"
                                      value={editFormData?.telefone || ""}
                                      onChange={(e) =>
                                        setEditFormData((prev) => ({
                                          ...prev!,
                                          telefone: e.target.value,
                                        }))
                                      }
                                      className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-xs text-slate-400">
                                      Endereço
                                    </label>
                                    <input
                                      type="text"
                                      value={editFormData?.rua || ""}
                                      onChange={(e) =>
                                        setEditFormData((prev) => ({
                                          ...prev!,
                                          rua: e.target.value,
                                        }))
                                      }
                                      className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm"
                                      placeholder="Rua"
                                    />
                                    <input
                                      type="text"
                                      value={editFormData?.numero || ""}
                                      onChange={(e) =>
                                        setEditFormData((prev) => ({
                                          ...prev!,
                                          numero: e.target.value,
                                        }))
                                      }
                                      className="w-full mt-2 bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm"
                                      placeholder="Número"
                                    />
                                    <input
                                      type="text"
                                      value={editFormData?.bairro || ""}
                                      onChange={(e) =>
                                        setEditFormData((prev) => ({
                                          ...prev!,
                                          bairro: e.target.value,
                                        }))
                                      }
                                      className="w-full mt-2 bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm"
                                      placeholder="Bairro"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-xs text-slate-400">
                                      Volume
                                    </label>
                                    <select
                                      value={editFormData?.volume || ""}
                                      onChange={(e) =>
                                        setEditFormData((prev) => ({
                                          ...prev!,
                                          volume: e.target.value,
                                        }))
                                      }
                                      className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm"
                                    >
                                      <option value="Pequeno">Pequeno</option>
                                      <option value="Médio">Médio</option>
                                      <option value="Grande">Grande</option>
                                    </select>
                                  </div>

                                  <div>
                                    <label className="text-xs text-slate-400">
                                      Entregador
                                    </label>
                                    <select
                                      value={editFormData?.entregador || ""}
                                      onChange={(e) =>
                                        setEditFormData((prev) => ({
                                          ...prev!,
                                          entregador: e.target.value,
                                        }))
                                      }
                                      className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm"
                                    >
                                      {availableUsers.map((user) => (
                                        <option
                                          key={user.value}
                                          value={user.value}
                                        >
                                          {user.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div>
                                    <label className="text-xs text-slate-400">
                                      Valor
                                    </label>
                                    <input
                                      type="text"
                                      value={editFormData?.valor || ""}
                                      onChange={(e) =>
                                        setEditFormData((prev) => ({
                                          ...prev!,
                                          valor: e.target.value,
                                        }))
                                      }
                                      className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-xs text-slate-400">
                                      Pagamento
                                    </label>
                                    <select
                                      value={editFormData?.pagamento || ""}
                                      onChange={(e) =>
                                        setEditFormData((prev) => ({
                                          ...prev!,
                                          pagamento: e.target.value,
                                        }))
                                      }
                                      className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm"
                                    >
                                      <option value="PIX">PIX</option>
                                      <option value="Dinheiro">Dinheiro</option>
                                      <option value="Cartão">Cartão</option>
                                    </select>
                                  </div>

                                  <div>
                                    <label className="text-xs text-slate-400">
                                      Observações
                                    </label>
                                    <textarea
                                      value={editFormData?.observacoes || ""}
                                      onChange={(e) =>
                                        setEditFormData((prev) => ({
                                          ...prev!,
                                          observacoes: e.target.value,
                                        }))
                                      }
                                      className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm"
                                      rows={3}
                                    />
                                  </div>

                                  <div>
                                    <label className="text-xs text-slate-400">
                                      Coordenadas
                                    </label>
                                    <input
                                      type="text"
                                      value={`${
                                        editFormData?.coordenadas?.latitude ||
                                        ""
                                      }, ${
                                        editFormData?.coordenadas?.longitude ||
                                        ""
                                      }`}
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
                                      className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm font-mono"
                                    />
                                  </div>

                                  <div className="flex gap-2 pt-4">
                                    <button
                                      onClick={() => {
                                        if (socket && editFormData) {
                                          setIsSaving(true);
                                          socket.emit(
                                            "Atualizar Entrega",
                                            editFormData
                                          );
                                        }
                                      }}
                                      disabled={isSaving}
                                      className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 
                                        rounded-lg py-2 font-medium transition-colors"
                                    >
                                      {isSaving ? "Salvando..." : "Salvar"}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setIsEditing(false);
                                        setEditFormData(null);
                                      }}
                                      className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 
                                        rounded-lg py-2 font-medium transition-colors"
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                </div>
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

            {/* Painel de Detalhes (apenas para desktop) */}
            {!isMobile && (
              <div className="w-80 p-6 bg-slate-900/50 flex flex-col">
                {selectedDelivery ? (
                  <>
                    <h3 className="text-lg font-semibold text-slate-200 mb-6">
                      {isEditing
                        ? "Editar Entrega"
                        : isEditingClient
                        ? "Editar Cliente"
                        : "Detalhes da Entrega"}
                    </h3>

                    {isEditing ? (
                      // Formulário de Edição
                      <div
                        className="flex-1 overflow-y-auto pr-2 space-y-4
                        [&::-webkit-scrollbar]:w-1
                        [&::-webkit-scrollbar-track]:bg-transparent
                        [&::-webkit-scrollbar-thumb]:bg-white/5
                        [&::-webkit-scrollbar-thumb]:rounded-full
                        [&::-webkit-scrollbar-thumb]:hover:bg-white/10
                        hover:[&::-webkit-scrollbar]:w-1.5
                        transition-all duration-300"
                      >
                        <div>
                          <label className="text-xs text-slate-400">
                            Cliente
                          </label>
                          <input
                            type="text"
                            value={editFormData?.nome || ""}
                            onChange={(e) =>
                              setEditFormData((prev) => ({
                                ...prev!,
                                nome: e.target.value,
                              }))
                            }
                            className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-slate-400">
                            Telefone
                          </label>
                          <input
                            type="text"
                            value={editFormData?.telefone || ""}
                            onChange={(e) =>
                              setEditFormData((prev) => ({
                                ...prev!,
                                telefone: e.target.value,
                              }))
                            }
                            className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-slate-400">
                            Endereço
                          </label>
                          <input
                            type="text"
                            value={editFormData?.rua || ""}
                            onChange={(e) =>
                              setEditFormData((prev) => ({
                                ...prev!,
                                rua: e.target.value,
                              }))
                            }
                            className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm"
                            placeholder="Rua"
                          />
                          <input
                            type="text"
                            value={editFormData?.numero || ""}
                            onChange={(e) =>
                              setEditFormData((prev) => ({
                                ...prev!,
                                numero: e.target.value,
                              }))
                            }
                            className="w-full mt-2 bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm"
                            placeholder="Número"
                          />
                          <input
                            type="text"
                            value={editFormData?.bairro || ""}
                            onChange={(e) =>
                              setEditFormData((prev) => ({
                                ...prev!,
                                bairro: e.target.value,
                              }))
                            }
                            className="w-full mt-2 bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm"
                            placeholder="Bairro"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-slate-400">
                            Volume
                          </label>
                          <select
                            value={editFormData?.volume || ""}
                            onChange={(e) =>
                              setEditFormData((prev) => ({
                                ...prev!,
                                volume: e.target.value,
                              }))
                            }
                            className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm"
                          >
                            <option value="Pequeno">Pequeno</option>
                            <option value="Médio">Médio</option>
                            <option value="Grande">Grande</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-xs text-slate-400">
                            Entregador
                          </label>
                          <select
                            value={editFormData?.entregador || ""}
                            onChange={(e) =>
                              setEditFormData((prev) => ({
                                ...prev!,
                                entregador: e.target.value,
                              }))
                            }
                            className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm"
                          >
                            {availableUsers.map((user) => (
                              <option key={user.value} value={user.value}>
                                {user.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-xs text-slate-400">
                            Valor
                          </label>
                          <input
                            type="text"
                            value={editFormData?.valor || ""}
                            onChange={(e) =>
                              setEditFormData((prev) => ({
                                ...prev!,
                                valor: e.target.value,
                              }))
                            }
                            className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-slate-400">
                            Pagamento
                          </label>
                          <select
                            value={editFormData?.pagamento || ""}
                            onChange={(e) =>
                              setEditFormData((prev) => ({
                                ...prev!,
                                pagamento: e.target.value,
                              }))
                            }
                            className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm"
                          >
                            <option value="PIX">PIX</option>
                            <option value="Dinheiro">Dinheiro</option>
                            <option value="Cartão">Cartão</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-xs text-slate-400">
                            Observações
                          </label>
                          <textarea
                            value={editFormData?.observacoes || ""}
                            onChange={(e) =>
                              setEditFormData((prev) => ({
                                ...prev!,
                                observacoes: e.target.value,
                              }))
                            }
                            className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm"
                            rows={3}
                          />
                        </div>

                        <div>
                          <label className="text-xs text-slate-400">
                            Coordenadas
                          </label>
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
                            className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm font-mono"
                          />
                        </div>

                        <div className="flex gap-2 pt-4">
                          <button
                            onClick={() => {
                              if (socket && editFormData) {
                                setIsSaving(true);
                                socket.emit("Atualizar Entrega", editFormData);
                              }
                            }}
                            disabled={isSaving}
                            className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 
                              rounded-lg py-2 font-medium transition-colors"
                          >
                            {isSaving ? "Salvando..." : "Salvar"}
                          </button>
                          <button
                            onClick={() => {
                              setIsEditing(false);
                              setEditFormData(null);
                            }}
                            className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 
                              rounded-lg py-2 font-medium transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : isEditingClient ? (
                      // Formulário de Edição de Cliente
                      <div
                        className="flex-1 overflow-y-auto pr-2 space-y-4
                        [&::-webkit-scrollbar]:w-1
                        [&::-webkit-scrollbar-track]:bg-transparent
                        [&::-webkit-scrollbar-thumb]:bg-white/5
                        [&::-webkit-scrollbar-thumb]:rounded-full
                        [&::-webkit-scrollbar-thumb]:hover:bg-white/10
                        hover:[&::-webkit-scrollbar]:w-1.5
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
                            className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm"
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
                            className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm"
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
                            className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm"
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
                            className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm"
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
                            className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm"
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
                            className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-slate-400">
                            Coordenadas
                          </label>
                          <input
                            type="text"
                            value={`${
                              editClientFormData?.coordenadas?.latitude || ""
                            }, ${
                              editClientFormData?.coordenadas?.longitude || ""
                            }`}
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
                            className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm font-mono"
                          />
                        </div>

                        <div className="flex gap-2 pt-4">
                          <button
                            onClick={() => {
                              if (socket && editClientFormData) {
                                setIsSaving(true);
                                socket.emit(
                                  "Atualizar Cliente",
                                  editClientFormData
                                );
                                setIsEditingClient(false);
                                setEditClientFormData(null);
                              }
                            }}
                            disabled={isSaving}
                            className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 
                              rounded-lg py-2 font-medium transition-colors"
                          >
                            {isSaving ? "Salvando..." : "Salvar"}
                          </button>
                          <button
                            onClick={() => {
                              setIsEditingClient(false);
                              setEditClientFormData(null);
                            }}
                            className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 
                              rounded-lg py-2 font-medium transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Visualização dos Detalhes (código existente)
                      <div
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
                            {selectedDelivery.bairro} -{" "}
                            {selectedDelivery.cidade}
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
                            Valor
                          </label>
                          <p className="text-slate-200">
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
                      </div>
                    )}
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                    Selecione uma entrega para ver os detalhes
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
