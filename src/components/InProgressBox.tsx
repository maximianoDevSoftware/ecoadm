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
} from "@heroicons/react/24/outline";
import { useEntregas } from "@/contexts/EntregasContext";
import { entregasTipo } from "@/types/entregasTypes";
import { io } from "socket.io-client";

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
  const [sentMessages, setSentMessages] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [editingDelivery, setEditingDelivery] = useState<entregasTipo | null>(
    null
  );

  const actionButtons = [
    {
      icon: CheckCircleIcon,
      label: "Confirmar Conclusão",
      color: "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20",
    },
    {
      icon: PhoneIcon,
      label: "Contatar Entregador",
      color: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
    },
    {
      icon: MapPinIcon,
      label: "Ver Localização",
      color: "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20",
    },
    {
      icon: ExclamationCircleIcon,
      label: "Reportar Problema",
      color: "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20",
    },
  ];

  // Filtra apenas entregas em andamento
  const inProgressDeliveries = entregas.filter(
    (delivery) => delivery.status === "Andamento"
  );

  useEffect(() => {
    const newSocket = io(
      "https://servidor-test-wts-efaaa800736e.herokuapp.com/"
    );
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

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
                                      setEditingDelivery(delivery);
                                      setIsEditing(true);
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
                                <div className="p-4">
                                  <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-white">
                                      Editar Entrega
                                    </h2>
                                    <button
                                      onClick={() => setIsEditing(false)}
                                      className="text-slate-400 hover:text-slate-200 transition-colors"
                                    >
                                      <XMarkIcon className="h-6 w-6" />
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium text-slate-300 mb-1">
                                        Nome do Cliente
                                      </label>
                                      <input
                                        type="text"
                                        defaultValue={delivery.nome}
                                        onChange={(e) =>
                                          setEditingDelivery({
                                            ...delivery,
                                            nome: e.target.value,
                                          })
                                        }
                                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-sm font-medium text-slate-300 mb-1">
                                        Telefone
                                      </label>
                                      <input
                                        type="text"
                                        defaultValue={delivery.telefone}
                                        onChange={(e) =>
                                          setEditingDelivery({
                                            ...delivery,
                                            telefone: e.target.value,
                                          })
                                        }
                                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-sm font-medium text-slate-300 mb-1">
                                        Cidade
                                      </label>
                                      <input
                                        type="text"
                                        defaultValue={delivery.cidade}
                                        onChange={(e) =>
                                          setEditingDelivery({
                                            ...delivery,
                                            cidade: e.target.value,
                                          })
                                        }
                                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-sm font-medium text-slate-300 mb-1">
                                        Bairro
                                      </label>
                                      <input
                                        type="text"
                                        defaultValue={delivery.bairro}
                                        onChange={(e) =>
                                          setEditingDelivery({
                                            ...delivery,
                                            bairro: e.target.value,
                                          })
                                        }
                                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-sm font-medium text-slate-300 mb-1">
                                        Rua
                                      </label>
                                      <input
                                        type="text"
                                        defaultValue={delivery.rua}
                                        onChange={(e) =>
                                          setEditingDelivery({
                                            ...delivery,
                                            rua: e.target.value,
                                          })
                                        }
                                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-sm font-medium text-slate-300 mb-1">
                                        Número
                                      </label>
                                      <input
                                        type="text"
                                        defaultValue={delivery.numero}
                                        onChange={(e) =>
                                          setEditingDelivery({
                                            ...delivery,
                                            numero: e.target.value,
                                          })
                                        }
                                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-sm font-medium text-slate-300 mb-1">
                                        Valor
                                      </label>
                                      <input
                                        type="text"
                                        defaultValue={delivery.valor}
                                        onChange={(e) =>
                                          setEditingDelivery({
                                            ...delivery,
                                            valor: e.target.value,
                                          })
                                        }
                                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-sm font-medium text-slate-300 mb-1">
                                        Forma de Pagamento
                                      </label>
                                      <select
                                        defaultValue={delivery.pagamento}
                                        onChange={(e) =>
                                          setEditingDelivery({
                                            ...delivery,
                                            pagamento: e.target.value,
                                          })
                                        }
                                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                                      >
                                        <option value="PIX">PIX</option>
                                        <option value="Dinheiro">
                                          Dinheiro
                                        </option>
                                        <option value="Cartão">Cartão</option>
                                      </select>
                                    </div>

                                    <div>
                                      <label className="block text-sm font-medium text-slate-300 mb-1">
                                        Entregador
                                      </label>
                                      <select
                                        defaultValue={delivery.entregador}
                                        onChange={(e) =>
                                          setEditingDelivery({
                                            ...delivery,
                                            entregador: e.target.value,
                                          })
                                        }
                                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                                      >
                                        <option value="Marcos">Marcos</option>
                                        <option value="Uene">Uene</option>
                                        <option value="Leo">Leo</option>
                                      </select>
                                    </div>

                                    <div>
                                      <label className="block text-sm font-medium text-slate-300 mb-1">
                                        Volume
                                      </label>
                                      <select
                                        defaultValue={delivery.volume}
                                        onChange={(e) =>
                                          setEditingDelivery({
                                            ...delivery,
                                            volume: e.target.value,
                                          })
                                        }
                                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                                      >
                                        <option value="Pequeno">Pequeno</option>
                                        <option value="Médio">Médio</option>
                                        <option value="Grande">Grande</option>
                                      </select>
                                    </div>

                                    <div className="col-span-2">
                                      <label className="block text-sm font-medium text-slate-300 mb-1">
                                        Observações
                                      </label>
                                      <textarea
                                        defaultValue={delivery.observacoes}
                                        onChange={(e) =>
                                          setEditingDelivery({
                                            ...delivery,
                                            observacoes: e.target.value,
                                          })
                                        }
                                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 resize-none h-24"
                                      />
                                    </div>
                                  </div>

                                  <div className="mt-6 flex justify-end space-x-3">
                                    <button
                                      onClick={() => setIsEditing(false)}
                                      className="px-4 py-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors"
                                    >
                                      Cancelar
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (socket && editingDelivery) {
                                          socket.emit(
                                            "Atualizar Entrega",
                                            editingDelivery
                                          );
                                          setIsEditing(false);
                                        }
                                      }}
                                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                                    >
                                      Salvar Alterações
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
                      Detalhes da Entrega
                    </h3>

                    <div
                      className="space-y-4 overflow-y-auto pr-2
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
                        <label className="text-xs text-slate-400">Data</label>
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
                        <label className="text-xs text-slate-400">Volume</label>
                        <p className="text-slate-200">
                          {selectedDelivery.volume}
                        </p>
                      </div>

                      <div>
                        <label className="text-xs text-slate-400">Valor</label>
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
