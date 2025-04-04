"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  XMarkIcon,
  UserIcon,
  UserPlusIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  TruckIcon,
  ClipboardDocumentIcon,
  CheckCircleIcon,
  GlobeAltIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { entregasTipo } from "@/types/entregasTypes";
import { mockClientes } from "@/mocks/clientes";
import { clientesTipo } from "@/types/clientesType";
import { useClientes } from "@/contexts/ClientesContext";
import { io, Socket } from "socket.io-client";
import { useEntregas } from "@/contexts/EntregasContext";

interface GenerateDeliveryBoxProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

// Função para buscar coordenadas (fora do componente)
async function getCoordinates(address: {
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
}) {
  const query = encodeURIComponent(
    `${address.rua}, ${address.numero} - ${address.bairro}, ${address.cidade}, PR, Brasil`
  );

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "Aplicativo-ADM/1.0",
        },
      }
    );

    const data = await response.json();

    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
    }
    throw new Error("Endereço não encontrado");
  } catch (error) {
    console.error("Erro ao buscar coordenadas:", error);
    throw error;
  }
}

export default function GenerateDeliveryBox({
  isOpen,
  onClose,
  isMobile,
}: GenerateDeliveryBoxProps) {
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<"existing" | "new" | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [hasLocation, setHasLocation] = useState(false);
  const [formData, setFormData] = useState<Partial<entregasTipo>>({
    dia: [
      new Date().getDate(),
      new Date().getMonth() + 1,
      new Date().getFullYear(),
    ],
    status: "Disponível",
    coordenadas: {
      latitude: 0,
      longitude: 0,
    },
    horario: [new Date().getHours(), new Date().getMinutes()],
    statusPagamento: "Aguardando",
    volume: "Pequeno",
  });
  const [isLoadingCoordinates, setIsLoadingCoordinates] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<clientesTipo | null>(
    null
  );
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setEntregas } = useEntregas();
  const { clientes, setClientes } = useClientes();
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Conectado ao servidor");
  const [fetchingStatus, setFetchingStatus] = useState(false);
  const [fetchingClients, setFetchingClients] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(false);

  // Filtra os clientes baseado no termo de busca
  const filteredClients = clientes.filter((client) =>
    client.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Função para selecionar um cliente
  const handleSelectClient = (client: clientesTipo) => {
    setSelectedClient(client);
    setFormData({
      ...formData,
      nome: client.nome,
      telefone: client.telefone,
      cidade: client.cidade,
      bairro: client.bairro,
      rua: client.rua,
      numero: client.numero,
      coordenadas: client.coordenadas,
    });
    setHasLocation(true); // Como já temos as coordenadas do cliente
  };

  const deliveryOptions = [
    {
      icon: UserIcon,
      title: "Entrega para Cliente",
      description: "Gerar entrega para um cliente já cadastrado",
      animation: { x: [-100, 0] },
      exitAnimation: { x: -100, opacity: 0 },
    },
    {
      icon: UserPlusIcon,
      title: "Entrega para novo Cliente",
      description: "Cadastrar novo cliente e gerar entrega",
      animation: { x: [100, 0] },
      exitAnimation: { x: 100, opacity: 0 },
    },
  ];

  const availableUsers = [
    { name: "Marcos Roberto", value: "Marcos" },
    { name: "Uene Passos", value: "Uene" },
    { name: "Leo Henrique", value: "Leo" },
  ];

  const handleExistingClient = () => {
    setFormType("existing");
    setShowForm(true);
  };

  const handleNewClient = () => {
    setFormType("new");
    setShowForm(true);
  };

  const formatCurrency = (value: string) => {
    // Remove tudo que não for número
    const numbers = value.replace(/\D/g, "");

    // Converte para número e divide por 100 para ter os centavos
    const amount = parseFloat(numbers) / 100;

    // Formata o número com duas casas decimais
    return amount.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");

    setFormData({
      ...formData,
      valor: formatCurrency(value),
    });
  };

  const resetForm = () => {
    setShowForm(false);
    setFormType(null);
    setSelectedClient(null);
    setHasLocation(false);
    setSearchTerm("");
    setFormData({
      dia: [
        new Date().getDate(),
        new Date().getMonth() + 1,
        new Date().getFullYear(),
      ],
      status: "Disponível",
      coordenadas: {
        latitude: 0,
        longitude: 0,
      },
      horario: [new Date().getHours(), new Date().getMinutes()],
      statusPagamento: "Aguardando",
      volume: "Pequeno",
    });
  };

  useEffect(() => {
    let isSubscribed = true;

    // Verifica se já existe uma conexão
    if (socket) return;

    // Inicializa a conexão socket
    const socketInstance = io("https://servidor-ecoclean-remaster-production.up.railway.app/", {
      transports: ["websocket"],
    });

    setSocket(socketInstance);

    // Gerencia eventos de conexão
    socketInstance.on("connect", () => {
      console.log("Conectado ao servidor Socket.IO");

      // Emite as requisições iniciais
      socketInstance.emit("Entregas do Dia");
      socketInstance.emit("Buscar Clientes");
    });

    // Configuração dos listeners
    socketInstance.on("Entregas do Dia", (entregas: entregasTipo[]) => {
      console.log("Entregas do dia recebidas:", entregas);
      setEntregas(entregas);
      setIsSubmitting(false);
      resetForm(); // Reseta o formulário quando receber atualizações das entregas
    });

    socketInstance.on("Buscar Clientes", (clientes: clientesTipo[]) => {
      console.log("Clientes recebidos:", clientes);
      if (clientes && Array.isArray(clientes)) {
        setClientes(clientes);
      }
    });

    socketInstance.on("Atualizar Cliente", (clientes: clientesTipo[]) => {
      console.log("Clientes atualizados recebidos via Atualizar Cliente:", clientes);
      if (clientes && Array.isArray(clientes)) {
        setClientes(clientes);
        // Reseta o estado de edição após atualizar os clientes
        setIsEditingClient(false);
      }
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Erro na conexão socket:", error);
      alert(
        "Erro ao conectar com o servidor. Verifique se o servidor está rodando em https://servidor-ecoclean-remaster-production.up.railway.app"
      );
    });

    // Cleanup
    return () => {
      isSubscribed = false;
      if (socketInstance) {
        socketInstance.off("connect");
        socketInstance.off("connect_error");
        socketInstance.off("Entregas do Dia");
        socketInstance.off("Buscar Clientes");
        socketInstance.off("Atualizar Cliente");
        socketInstance.disconnect();
      }
    };
  }, [setEntregas, setClientes]); // Dependências necessárias

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket) return;

    // Validação dos campos obrigatórios
    const requiredFields = {
      nome: formData.nome,
      cidade: formData.cidade,
      bairro: formData.bairro,
      rua: formData.rua,
      numero: formData.numero,
      valor: formData.valor,
      pagamento: formData.pagamento,
      entregador: formData.entregador,
      volume: formData.volume,
    };

    // Verifica se algum campo obrigatório está vazio
    const emptyFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (emptyFields.length > 0) {
      alert(
        `Por favor, preencha os seguintes campos: ${emptyFields.join(", ")}`
      );
      return;
    }

    // Verifica se as coordenadas são válidas
    if (
      !formData.coordenadas ||
      (formData.coordenadas.latitude === 0 &&
        formData.coordenadas.longitude === 0)
    ) {
      alert("Por favor, defina a localização da entrega");
      return;
    }

    setIsSubmitting(true);

    // Prepara o objeto de entrega com os dados do formulário
    const novaEntrega: entregasTipo = {
      dia: formData.dia || [
        new Date().getDate(),
        new Date().getMonth() + 1,
        new Date().getFullYear(),
      ],
      nome: formData.nome!,
      status: "Disponível",
      telefone: formData.telefone || undefined,
      cidade: formData.cidade!,
      bairro: formData.bairro!,
      rua: formData.rua!,
      numero: formData.numero!,
      coordenadas: formData.coordenadas!,
      valor: formData.valor!,
      pagamento: formData.pagamento!,
      entregador: formData.entregador!,
      volume: formData.volume!,
      observacoes: formData.observacoes,
      horario: formData.horario || [new Date().getHours(), new Date().getMinutes()],
      statusPagamento: formData.statusPagamento || "Aguardando",
      statusMensagem: "Não Enviado",
    };

    // Log para debug
    console.log("Enviando nova entrega:", novaEntrega);

    // Emite o evento de criar entrega
    socket.emit("Adicionar Entrega", novaEntrega);
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
            className="bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl p-8 w-full max-w-3xl mx-4"
          >
            {/* Cabeçalho */}
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-semibold text-slate-200">
                {showForm ? "Nova Entrega" : "Gerar Nova Entrega"}
              </h2>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <AnimatePresence mode="wait">
              {!showForm ? (
                // Opções de Entrega
                <motion.div
                  key="options"
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  exit={{ opacity: 0 }}
                >
                  {deliveryOptions.map((option, index) => (
                    <motion.button
                      key={index}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={{
                        hidden: { opacity: 0, ...option.animation },
                        visible: {
                          opacity: 1,
                          x: 0,
                          transition: {
                            type: "spring",
                            damping: 20,
                            stiffness: 200,
                            delay: 0.1 + index * 0.1,
                          },
                        },
                        exit: {
                          ...option.exitAnimation,
                          transition: { duration: 0.2 },
                        },
                      }}
                      onClick={
                        index === 0 ? handleExistingClient : handleNewClient
                      }
                      className="flex flex-col items-center p-8 rounded-xl border border-white/10 
                        bg-slate-800/50 hover:bg-slate-800/70 transition-colors
                        group relative overflow-hidden"
                    >
                      {/* Efeito de brilho no hover */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div
                          className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 
                          animate-shine"
                        />
                      </div>

                      <option.icon
                        className="h-16 w-16 text-slate-300 mb-4 
                        group-hover:text-blue-400 transition-colors"
                      />

                      <h3 className="text-lg font-medium text-slate-200 mb-2">
                        {option.title}
                      </h3>

                      <p className="text-sm text-slate-400 text-center">
                        {option.description}
                      </p>
                    </motion.button>
                  ))}
                </motion.div>
              ) : (
                // Formulário de Nova Entrega
                <motion.form
                  key="form"
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 50, opacity: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="flex flex-col max-h-[calc(100vh-200px)]"
                  onSubmit={handleSubmit}
                >
                  <div
                    className="flex-1 overflow-y-auto pr-2
                    [&::-webkit-scrollbar]:w-1.5
                    [&::-webkit-scrollbar-track]:bg-transparent
                    [&::-webkit-scrollbar-thumb]:bg-white/10
                    [&::-webkit-scrollbar-thumb]:rounded-full
                    [&::-webkit-scrollbar-thumb]:hover:bg-white/20
                    hover:[&::-webkit-scrollbar]:w-2
                    transition-all duration-300"
                  >
                    <div className="space-y-6">
                      {formType === "existing" ? (
                        // Formulário para Cliente Existente
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Dados do Cliente */}
                          <div className="space-y-4">
                            <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                              <UserIcon className="h-4 w-4" />
                              Dados do Cliente
                            </h3>

                            {/* Campo de Busca */}
                            <div>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={searchTerm}
                                  onChange={(e) =>
                                    setSearchTerm(e.target.value)
                                  }
                                  placeholder="Buscar cliente..."
                                  className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg
                                    focus:outline-none focus:border-blue-500 text-slate-200 pl-9"
                                />
                                <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                              </div>
                            </div>

                            {/* Lista de Clientes */}
                            <div
                              className="overflow-y-auto h-[200px] space-y-2 pr-2
                                [&::-webkit-scrollbar]:w-1.5
                                [&::-webkit-scrollbar-track]:bg-transparent
                                [&::-webkit-scrollbar-thumb]:bg-white/10
                                [&::-webkit-scrollbar-thumb]:rounded-full
                                [&::-webkit-scrollbar-thumb]:hover:bg-white/20
                                hover:[&::-webkit-scrollbar]:w-2
                                transition-all duration-300"
                            >
                              {filteredClients.map((client) => (
                                <motion.button
                                  key={client.id}
                                  onClick={() => handleSelectClient(client)}
                                  className={`w-full text-left p-3 rounded-lg border transition-all
                                    ${
                                      selectedClient?.id === client.id
                                        ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
                                        : "bg-slate-800/50 border-white/10 hover:bg-slate-800/70"
                                    }`}
                                  whileHover={{ x: 4 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <div className="font-medium text-slate-200">
                                    {client.nome}
                                  </div>
                                  <div className="text-sm text-slate-400">
                                    {client.telefone}
                                  </div>
                                </motion.button>
                              ))}
                            </div>
                          </div>

                          {/* Endereço (Detalhes do Cliente) */}
                          <div className="space-y-4">
                            <h3 className="text-sm font-medium text-slate-300 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <MapPinIcon className="h-4 w-4" />
                                Detalhes do Cliente
                              </div>
                              {selectedClient && (
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => setIsEditingClient(true)}
                                  className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 
                                    transition-colors border border-purple-500/20 hover:border-purple-500/30 group"
                                >
                                  <PencilSquareIcon className="h-4 w-4 transition-transform group-hover:rotate-12" />
                                </motion.button>
                              )}
                            </h3>

                            {selectedClient && !isEditingClient ? (
                              <div className="space-y-4 bg-slate-800/50 p-4 rounded-lg border border-white/10">
                                <div>
                                  <label className="block text-xs text-slate-400">
                                    Endereço
                                  </label>
                                  <p className="text-slate-200">
                                    {selectedClient.rua}, {selectedClient.numero}
                                  </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-xs text-slate-400">
                                      Bairro
                                    </label>
                                    <p className="text-slate-200">
                                      {selectedClient.bairro}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="block text-xs text-slate-400">
                                      Cidade
                                    </label>
                                    <p className="text-slate-200">
                                      {selectedClient.cidade}
                                    </p>
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-xs text-slate-400">
                                    Coordenadas
                                  </label>
                                  <p className="text-slate-200 font-mono text-xs">
                                    {selectedClient.coordenadas.latitude}, {selectedClient.coordenadas.longitude}
                                  </p>
                                </div>
                              </div>
                            ) : selectedClient && isEditingClient ? (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-4 bg-slate-800/50 p-4 rounded-lg border border-white/10"
                              >
                                <div>
                                  <label className="block text-xs text-slate-400 mb-1">Nome</label>
                                  <input
                                    type="text"
                                    value={selectedClient.nome}
                                    onChange={(e) => setSelectedClient({
                                      ...selectedClient,
                                      nome: e.target.value
                                    })}
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm shadow-inner shadow-black/10"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs text-slate-400 mb-1">Telefone</label>
                                  <input
                                    type="text"
                                    value={selectedClient.telefone}
                                    onChange={(e) => setSelectedClient({
                                      ...selectedClient,
                                      telefone: e.target.value
                                    })}
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm shadow-inner shadow-black/10"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs text-slate-400 mb-1">Cidade</label>
                                  <input
                                    type="text"
                                    value={selectedClient.cidade}
                                    onChange={(e) => setSelectedClient({
                                      ...selectedClient,
                                      cidade: e.target.value
                                    })}
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm shadow-inner shadow-black/10"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs text-slate-400 mb-1">Bairro</label>
                                  <input
                                    type="text"
                                    value={selectedClient.bairro}
                                    onChange={(e) => setSelectedClient({
                                      ...selectedClient,
                                      bairro: e.target.value
                                    })}
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm shadow-inner shadow-black/10"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs text-slate-400 mb-1">Rua</label>
                                  <input
                                    type="text"
                                    value={selectedClient.rua}
                                    onChange={(e) => setSelectedClient({
                                      ...selectedClient,
                                      rua: e.target.value
                                    })}
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm shadow-inner shadow-black/10"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs text-slate-400 mb-1">Número</label>
                                  <input
                                    type="text"
                                    value={selectedClient.numero}
                                    onChange={(e) => setSelectedClient({
                                      ...selectedClient,
                                      numero: e.target.value
                                    })}
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm shadow-inner shadow-black/10"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs text-slate-400 mb-1">Coordenadas</label>
                                  <div className="space-y-2">
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        if (
                                          !selectedClient.rua ||
                                          !selectedClient.numero ||
                                          !selectedClient.bairro ||
                                          !selectedClient.cidade
                                        ) {
                                          alert("Preencha o endereço completo primeiro");
                                          return;
                                        }

                                        try {
                                          const coordinates = await getCoordinates({
                                            rua: selectedClient.rua,
                                            numero: selectedClient.numero,
                                            bairro: selectedClient.bairro,
                                            cidade: selectedClient.cidade,
                                          });

                                          setSelectedClient({
                                            ...selectedClient,
                                            coordenadas: coordinates,
                                          });
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
                                      value={`${selectedClient.coordenadas.latitude}, ${selectedClient.coordenadas.longitude}`}
                                      onChange={(e) => {
                                        const [lat, lng] = e.target.value.split(",").map(v => parseFloat(v.trim()));
                                        setSelectedClient({
                                          ...selectedClient,
                                          coordenadas: {
                                            latitude: lat || 0,
                                            longitude: lng || 0
                                          }
                                        });
                                      }}
                                      placeholder="-25.838523944195668, -48.53857383068678"
                                      className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm shadow-inner shadow-black/10"
                                    />
                                  </div>
                                </div>

                                <div className="flex gap-2 pt-2">
                                  <motion.button
                                    onClick={() => {
                                      if (socket) {
                                        socket.emit("Atualizar Cliente", selectedClient);
                                      }
                                      setIsEditingClient(false);
                                    }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 
                                      rounded-lg py-2 font-medium transition-all duration-300 shadow-lg shadow-purple-500/10
                                      hover:shadow-purple-500/20 backdrop-blur-sm border border-purple-500/30
                                      hover:border-purple-500/50"
                                  >
                                    Salvar
                                  </motion.button>
                                  <motion.button
                                    onClick={() => setIsEditingClient(false)}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 
                                      rounded-lg py-2 font-medium transition-all duration-300 shadow-lg shadow-rose-500/10
                                      hover:shadow-rose-500/20 backdrop-blur-sm border border-rose-500/30
                                      hover:border-rose-500/50"
                                  >
                                    Cancelar
                                  </motion.button>
                                </div>
                              </motion.div>
                            ) : (
                              <div className="h-full flex items-center justify-center text-slate-400 text-sm p-8">
                                Selecione um cliente para ver os detalhes
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        // Formulário para Novo Cliente
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Dados do Cliente */}
                          <div className="space-y-4">
                            <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                              <UserIcon className="h-4 w-4" />
                              Dados do Cliente
                            </h3>
                            <div>
                              <label className="block text-xs text-slate-400 mb-1">
                                Nome
                              </label>
                              <input
                                type="text"
                                value={formData.nome || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    nome: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg
                                  focus:outline-none focus:border-blue-500 text-slate-200"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-400 mb-1">
                                Telefone
                              </label>
                              <input
                                type="tel"
                                value={formData.telefone || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    telefone: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg
                                  focus:outline-none focus:border-blue-500 text-slate-200"
                                required
                              />
                            </div>
                          </div>

                          {/* Endereço */}
                          <div className="space-y-4">
                            <h3 className="text-sm font-medium text-slate-300 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <MapPinIcon className="h-4 w-4" />
                                Endereço
                              </div>
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                  // Verificar se temos todas as informações necessárias
                                  if (!formData.nome || !formData.telefone || !formData.cidade || !formData.bairro || !formData.rua || !formData.numero) {
                                    alert("Por favor, preencha todos os campos do cliente antes de adicioná-lo");
                                    return;
                                  }

                                  // Criar objeto clienteTipo
                                  const novoCliente: clientesTipo = {
                                    nome: formData.nome,
                                    telefone: formData.telefone || "",
                                    cidade: formData.cidade,
                                    bairro: formData.bairro,
                                    rua: formData.rua,
                                    numero: formData.numero,
                                    coordenadas: formData.coordenadas || {
                                      latitude: 0,
                                      longitude: 0
                                    }
                                  };

                                  // Enviar para o servidor
                                  if (socket) {
                                    socket.emit("Atualizar Cliente", novoCliente);
                                  }
                                }}
                                className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 
                                  text-purple-400 rounded-lg transition-all duration-300 flex items-center gap-2
                                  border border-purple-500/20 hover:border-purple-500/30 shadow-lg shadow-purple-500/10
                                  backdrop-blur-sm group"
                              >
                                <UserPlusIcon className="h-4 w-4 transition-transform group-hover:scale-110" />
                                <span className="text-sm">Adicionar Cliente</span>
                              </motion.button>
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs text-slate-400 mb-1">
                                  Cidade
                                </label>
                                <input
                                  type="text"
                                  value={formData.cidade || ""}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      cidade: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg
                                    focus:outline-none focus:border-blue-500 text-slate-200"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-slate-400 mb-1">
                                  Bairro
                                </label>
                                <input
                                  type="text"
                                  value={formData.bairro || ""}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      bairro: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg
                                    focus:outline-none focus:border-blue-500 text-slate-200"
                                  required
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-4 gap-4">
                              <div className="col-span-3">
                                <label className="block text-xs text-slate-400 mb-1">
                                  Rua
                                </label>
                                <input
                                  type="text"
                                  value={formData.rua || ""}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      rua: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg
                                    focus:outline-none focus:border-blue-500 text-slate-200"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-slate-400 mb-1">
                                  Número
                                </label>
                                <input
                                  type="text"
                                  value={formData.numero || ""}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      numero: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg
                                    focus:outline-none focus:border-blue-500 text-slate-200"
                                  required
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Dados da Entrega */}
                      <div className="space-y-4 pt-4 border-t border-white/10">
                        <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                          <TruckIcon className="h-4 w-4" />
                          Dados da Entrega
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Campo de Entregador */}
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">
                              Entregador
                            </label>
                            <select
                              value={formData.entregador || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  entregador: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg
                                focus:outline-none focus:border-blue-500 text-slate-200"
                              required
                            >
                              <option value="">Selecione um entregador</option>
                              {availableUsers.map((user, index) => (
                                <option key={index} value={user.value}>
                                  {user.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs text-slate-400 mb-1">
                              Valor
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-2 text-slate-400">
                                R$
                              </span>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={formData.valor || "0,00"}
                                onChange={handleValueChange}
                                className="w-full pl-8 pr-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg
                                  focus:outline-none focus:border-blue-500 text-slate-200 text-right"
                                required
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">
                              Pagamento
                            </label>
                            <select
                              value={formData.pagamento || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  pagamento: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg
                                focus:outline-none focus:border-blue-500 text-slate-200"
                              required
                            >
                              <option value="">Selecione</option>
                              <option value="PIX">PIX</option>
                              <option value="Dinheiro">Dinheiro</option>
                              <option value="Cartão">Cartão</option>
                              <option value="Boleto">Boleto</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">
                              Status do Pagamento
                            </label>
                            <select
                              value={formData.statusPagamento || "Aguardando"}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  statusPagamento: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg
                                focus:outline-none focus:border-blue-500 text-slate-200"
                              required
                            >
                              <option value="Aguardando">Aguardando</option>
                              <option value="Confirmado">Confirmado</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">
                              Volume
                            </label>
                            <select
                              value={formData.volume || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  volume: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg
                                focus:outline-none focus:border-blue-500 text-slate-200"
                              required
                            >
                              <option value="">Selecione</option>
                              <option value="Pequeno">Pequeno</option>
                              <option value="Médio">Médio</option>
                              <option value="Grande">Grande</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">
                              Data da Entrega
                            </label>
                            <input
                              type="date"
                              value={
                                formData.dia
                                  ? `${formData.dia[2]}-${String(
                                      formData.dia[1]
                                    ).padStart(2, "0")}-${String(
                                      formData.dia[0]
                                    ).padStart(2, "0")}`
                                  : ""
                              }
                              onChange={(e) => {
                                const [year, month, day] = e.target.value
                                  .split("-")
                                  .map(Number);
                                setFormData({
                                  ...formData,
                                  dia: [day, month, year],
                                });
                              }}
                              className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg
                                focus:outline-none focus:border-blue-500 text-slate-200"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">
                              Horário
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="number"
                                min="0"
                                max="23"
                                value={formData.horario ? formData.horario[0] : new Date().getHours()}
                                onChange={(e) => {
                                  const hours = parseInt(e.target.value, 10);
                                  setFormData({
                                    ...formData,
                                    horario: [
                                      hours,
                                      formData.horario ? formData.horario[1] : new Date().getMinutes()
                                    ],
                                  });
                                }}
                                className="w-16 px-2 py-2 bg-slate-800/50 border border-white/10 rounded-lg
                                  focus:outline-none focus:border-blue-500 text-slate-200
                                  [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                placeholder="Hora"
                                required
                              />
                              <span className="flex items-center text-slate-400">:</span>
                              <input
                                type="number"
                                min="0"
                                max="59"
                                value={formData.horario ? formData.horario[1] : new Date().getMinutes()}
                                onChange={(e) => {
                                  const minutes = parseInt(e.target.value, 10);
                                  setFormData({
                                    ...formData,
                                    horario: [
                                      formData.horario ? formData.horario[0] : new Date().getHours(),
                                      minutes
                                    ],
                                  });
                                }}
                                className="w-16 px-2 py-2 bg-slate-800/50 border border-white/10 rounded-lg
                                  focus:outline-none focus:border-blue-500 text-slate-200
                                  [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                placeholder="Min"
                                required
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">
                              Localização
                            </label>
                            <button
                              type="button"
                              onClick={() => setShowLocationModal(true)}
                              className={`w-full px-3 py-2 rounded-lg border transition-all flex items-center justify-center gap-2
                                ${
                                  hasLocation
                                    ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                                    : "bg-slate-800/50 border-white/10 text-slate-200 hover:bg-slate-800/70"
                                }`}
                            >
                              {hasLocation ? (
                                <>
                                  <CheckCircleIcon className="h-5 w-5" />
                                  <span>Confirmado</span>
                                </>
                              ) : (
                                <>
                                  <MapPinIcon className="h-5 w-5" />
                                  <span>Definir</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">
                            Observações
                          </label>
                          <textarea
                            value={formData.observacoes || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                observacoes: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg
                              focus:outline-none focus:border-blue-500 text-slate-200 h-24 resize-none"
                            placeholder="Informações adicionais sobre a entrega..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex justify-end gap-4 pt-4 mt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-4 py-2 text-slate-300 hover:text-slate-100 transition-colors"
                      disabled={isSubmitting}
                    >
                      Voltar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                        transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                        focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed
                        flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                          <span>Gerando...</span>
                        </>
                      ) : (
                        "Gerar Entrega"
                      )}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Modal de Localização */}
            <AnimatePresence>
              {showLocationModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999999] flex items-center justify-center"
                  onClick={(e) =>
                    e.target === e.currentTarget && setShowLocationModal(false)
                  }
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl p-6 w-full max-w-md mx-4"
                  >
                    <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                      <MapPinIcon className="h-5 w-5" />
                      Definir Localização
                    </h3>

                    {/* Botão de Busca Online */}
                    <button
                      type="button"
                      onClick={async () => {
                        if (
                          !formData.rua ||
                          !formData.numero ||
                          !formData.bairro ||
                          !formData.cidade
                        ) {
                          alert("Preencha o endereço completo primeiro");
                          return;
                        }

                        setIsLoadingCoordinates(true);
                        try {
                          const coordinates = await getCoordinates({
                            rua: formData.rua,
                            numero: formData.numero,
                            bairro: formData.bairro,
                            cidade: formData.cidade,
                          });

                          setFormData({
                            ...formData,
                            coordenadas: coordinates,
                          });
                        } catch (error) {
                          alert(
                            "Não foi possível encontrar as coordenadas para este endereço"
                          );
                        } finally {
                          setIsLoadingCoordinates(false);
                        }
                      }}
                      disabled={isLoadingCoordinates}
                      className="w-full mb-6 px-4 py-3 bg-blue-600/20 hover:bg-blue-600/30 
                        text-blue-400 rounded-lg transition-all flex items-center justify-center gap-2
                        disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoadingCoordinates ? (
                        <>
                          <div className="animate-spin h-5 w-5 border-2 border-blue-400 border-t-transparent rounded-full" />
                          <span>Buscando localização...</span>
                        </>
                      ) : (
                        <>
                          <GlobeAltIcon className="h-5 w-5" />
                          <span>Gerar Localização Online</span>
                        </>
                      )}
                    </button>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">
                          Coordenadas (latitude, longitude)
                        </label>
                        <input
                          type="text"
                          placeholder="-25.827680, -48.539575"
                          value={`${formData.coordenadas?.latitude ?? 0}, ${formData.coordenadas?.longitude ?? 0}`}
                          onChange={(e) => {
                            const coordsString = e.target.value;
                            
                            // Verifica se o formato é válido: latitude, longitude
                            const coordsMatch = coordsString.match(/^\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*$/);
                            
                            if (coordsMatch) {
                              const latitude = parseFloat(coordsMatch[1]);
                              const longitude = parseFloat(coordsMatch[2]);
                              
                              setFormData({
                                ...formData,
                                coordenadas: {
                                  latitude,
                                  longitude
                                },
                              });
                            }
                          }}
                          className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg
                            focus:outline-none focus:border-blue-500 text-slate-200"
                          required
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          Digite as coordenadas no formato: latitude, longitude
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                      <button
                        type="button"
                        onClick={() => setShowLocationModal(false)}
                        className="px-4 py-2 text-slate-300 hover:text-slate-100 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setHasLocation(true);
                          setShowLocationModal(false);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                          transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Confirmar
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
