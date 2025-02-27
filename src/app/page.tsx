"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { BuildingOffice2Icon, ServerIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { io, Socket } from "socket.io-client";
import { entregasTipo } from "@/types/entregasTypes";
import { clientesTipo } from "@/types/clientesType";
import { usuarioTipo } from "@/types/userTypes";
import { useEntregas } from "@/contexts/EntregasContext";
import { useClientes } from "@/contexts/ClientesContext";
import { useUsers } from "@/contexts/UsersContext";

export default function Login() {
  const router = useRouter();
  const { setEntregas } = useEntregas();
  const { setClientes } = useClientes();
  const { setUsers } = useUsers();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState(
    "Conectando com o servidor"
  );
  const [fetchingStatus, setFetchingStatus] = useState(false);
  const [receivedEntregas, setReceivedEntregas] = useState<number | null>(null);
  const [fetchingClients, setFetchingClients] = useState(false);
  const [receivedClients, setReceivedClients] = useState<number | null>(null);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [receivedUsers, setReceivedUsers] = useState<number | null>(null);
  const [isInitializationComplete, setIsInitializationComplete] =
    useState(false);
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });

  // Funções de atualização memoizadas
  const updateEntregas = useCallback(
    (entregas: entregasTipo[]) => {
      console.log("Atualizando entregas:", entregas);
      setEntregas(entregas);
      setReceivedEntregas(entregas.length);
      setFetchingStatus(false);
    },
    [setEntregas]
  );

  const updateClientes = useCallback(
    (clientes: clientesTipo[]) => {
      console.log("Atualizando clientes:", clientes);
      setClientes(clientes);
      setReceivedClients(clientes.length);
      setFetchingClients(false);
    },
    [setClientes]
  );

  const updateUsers = useCallback(
    (usuarios: usuarioTipo[]) => {
      console.log("Atualizando usuários:", usuarios);
      if (Array.isArray(usuarios)) {
        setUsers(usuarios);
        setReceivedUsers(usuarios.length);
        setFetchingUsers(false);
      }
    },
    [setUsers]
  );

  useEffect(() => {
    let isSubscribed = true;

    // Verifica se já existe uma conexão
    if (socket) return;

    // Inicializa a conexão socket
    const socketInstance = io(
      "https://servidor-test-wts-efaaa800736e.herokuapp.com/",
      {
        transports: ["websocket"],
      }
    );

    if (isSubscribed) {
      setSocket(socketInstance);

      // Gerencia eventos de conexão
      socketInstance.on("connect", () => {
        console.log("Conectado ao servidor Socket.IO");
        setConnectionStatus("Conectado ao servidor");

        // Emite as requisições iniciais
        socketInstance.emit("Buscar Entregas");
        setFetchingStatus(true);

        socketInstance.emit("Buscar Clientes");
        setFetchingClients(true);

        socketInstance.emit("solicitar-usuarios");
        setFetchingUsers(true);
      });

      // Configuração dos listeners
      socketInstance.on("Entregas Encontradas", updateEntregas);
      socketInstance.on("Atualizando entregas", updateEntregas);
      socketInstance.on("Clientes Encontrados", updateClientes);
      socketInstance.on("Atualizando clientes", updateClientes);
      socketInstance.on("todos-usuarios", updateUsers);

      socketInstance.on("disconnect", () => {
        console.log("Desconectado do servidor Socket.IO");
        setConnectionStatus("Reconectando ao servidor...");
      });

      socketInstance.on("connect_error", (error) => {
        console.error("Erro de conexão:", error);
        setConnectionStatus("Erro de conexão");
      });
    }

    // Cleanup
    return () => {
      isSubscribed = false;
      if (socketInstance) {
        socketInstance.off("connect");
        socketInstance.off("disconnect");
        socketInstance.off("connect_error");
        socketInstance.off("Entregas Encontradas");
        socketInstance.off("Atualizando entregas");
        socketInstance.off("Clientes Encontrados");
        socketInstance.off("Atualizando clientes");
        socketInstance.off("todos-usuarios");
        socketInstance.disconnect();
      }
    };
  }, []); // Sem dependências para evitar reconexões

  useEffect(() => {
    if (
      connectionStatus === "Conectado ao servidor" &&
      !fetchingStatus &&
      !fetchingClients &&
      !fetchingUsers &&
      receivedEntregas !== null &&
      receivedClients !== null &&
      receivedUsers !== null
    ) {
      setTimeout(() => {
        setIsInitializationComplete(true);
      }, 1000);
    }
  }, [
    connectionStatus,
    fetchingStatus,
    fetchingClients,
    fetchingUsers,
    receivedEntregas,
    receivedClients,
    receivedUsers,
  ]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Aqui você pode adicionar a lógica de autenticação
    console.log("Login data:", loginData);
    router.push("/sistema-ecoclean");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-slate-900 py-8 relative">
      {/* Status de Conexão - Ajustado posicionamento */}
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          type: "spring",
          damping: 20,
          stiffness: 100,
          delay: 0.5,
        }}
        className="absolute right-8 top-24 flex flex-col items-end"
      >
        <div className="space-y-3">
          {/* Caixa de Status Principal */}
          <div
            className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-lg p-3 pr-4
            flex items-center gap-3 shadow-xl"
          >
            <div className="relative">
              <ServerIcon className="h-5 w-5 text-blue-400" />
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  ease: "easeInOut",
                }}
                className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full"
              />
            </div>
            <span className="text-sm text-slate-300 whitespace-nowrap">
              {connectionStatus}
            </span>
          </div>

          {/* Caixa de Sucesso */}
          <AnimatePresence>
            {connectionStatus === "Conectado ao servidor" && (
              <motion.div
                initial={{ opacity: 0, x: 100, height: 0 }}
                animate={{ opacity: 1, x: 0, height: "auto" }}
                exit={{ opacity: 0, x: 100, height: 0 }}
                transition={{
                  type: "spring",
                  damping: 20,
                  stiffness: 100,
                }}
                className="bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/20 
                  rounded-lg p-3 pr-4 flex items-center gap-3 shadow-xl overflow-hidden"
              >
                <div className="relative">
                  <motion.div
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      ease: "easeOut",
                    }}
                  >
                    <ServerIcon className="h-5 w-5 text-emerald-400" />
                  </motion.div>
                  <motion.div
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 2,
                      ease: "easeOut",
                      repeat: Infinity,
                    }}
                    className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full"
                  />
                </div>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-sm text-emerald-300 whitespace-nowrap"
                >
                  Conexão estabelecida com sucesso!
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Caixa de Busca de Entregas */}
          <AnimatePresence>
            {fetchingStatus && (
              <motion.div
                initial={{ opacity: 0, x: 100, height: 0 }}
                animate={{ opacity: 1, x: 0, height: "auto" }}
                exit={{ opacity: 0, x: 100, height: 0 }}
                transition={{
                  type: "spring",
                  damping: 20,
                  stiffness: 100,
                }}
                className="bg-blue-500/10 backdrop-blur-sm border border-blue-500/20 
                  rounded-lg p-3 pr-4 flex items-center gap-3 shadow-xl overflow-hidden"
              >
                <div className="relative">
                  <motion.div
                    animate={{
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 2,
                      ease: "linear",
                      repeat: Infinity,
                    }}
                  >
                    <ServerIcon className="h-5 w-5 text-blue-400" />
                  </motion.div>
                  <motion.div
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      ease: "easeOut",
                      repeat: Infinity,
                    }}
                    className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full"
                  />
                </div>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-sm text-blue-300 whitespace-nowrap"
                >
                  Buscando entregas do servidor...
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Após a caixa de Busca de Entregas */}
          <AnimatePresence>
            {receivedEntregas !== null && (
              <motion.div
                initial={{ opacity: 0, x: 100, height: 0 }}
                animate={{ opacity: 1, x: 0, height: "auto" }}
                exit={{ opacity: 0, x: 100, height: 0 }}
                transition={{
                  type: "spring",
                  damping: 20,
                  stiffness: 100,
                }}
                className="bg-purple-500/10 backdrop-blur-sm border border-purple-500/20 
                  rounded-lg p-3 pr-4 flex items-center gap-3 shadow-xl overflow-hidden"
              >
                <div className="relative">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      damping: 10,
                      stiffness: 100,
                    }}
                  >
                    <ServerIcon className="h-5 w-5 text-purple-400" />
                  </motion.div>
                  <motion.div
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 2,
                      ease: "easeOut",
                      repeat: Infinity,
                    }}
                    className="absolute -top-1 -right-1 w-2 h-2 bg-purple-400 rounded-full"
                  />
                </div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-purple-300 whitespace-nowrap"
                >
                  <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    Entregas recebidas:{" "}
                    <motion.span
                      key={receivedEntregas}
                      initial={{ scale: 1.5 }}
                      animate={{ scale: 1 }}
                      className="font-medium"
                    >
                      {receivedEntregas}
                    </motion.span>{" "}
                    hoje
                  </motion.span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Caixa de Busca de Clientes */}
          <AnimatePresence>
            {fetchingClients && (
              <motion.div
                initial={{ opacity: 0, x: 100, height: 0 }}
                animate={{ opacity: 1, x: 0, height: "auto" }}
                exit={{ opacity: 0, x: 100, height: 0 }}
                transition={{
                  type: "spring",
                  damping: 20,
                  stiffness: 100,
                }}
                className="bg-amber-500/10 backdrop-blur-sm border border-amber-500/20 
                  rounded-lg p-3 pr-4 flex items-center gap-3 shadow-xl overflow-hidden"
              >
                <div className="relative">
                  <motion.div
                    animate={{
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 2,
                      ease: "linear",
                      repeat: Infinity,
                    }}
                  >
                    <ServerIcon className="h-5 w-5 text-amber-400" />
                  </motion.div>
                  <motion.div
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      ease: "easeOut",
                      repeat: Infinity,
                    }}
                    className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full"
                  />
                </div>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-sm text-amber-300 whitespace-nowrap"
                >
                  Buscando clientes do servidor...
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Caixa de Clientes Recebidos */}
          <AnimatePresence>
            {receivedClients !== null && (
              <motion.div
                initial={{ opacity: 0, x: 100, height: 0 }}
                animate={{ opacity: 1, x: 0, height: "auto" }}
                exit={{ opacity: 0, x: 100, height: 0 }}
                transition={{
                  type: "spring",
                  damping: 20,
                  stiffness: 100,
                }}
                className="bg-orange-500/10 backdrop-blur-sm border border-orange-500/20 
                  rounded-lg p-3 pr-4 flex items-center gap-3 shadow-xl overflow-hidden"
              >
                <div className="relative">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      damping: 10,
                      stiffness: 100,
                    }}
                  >
                    <ServerIcon className="h-5 w-5 text-orange-400" />
                  </motion.div>
                  <motion.div
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 2,
                      ease: "easeOut",
                      repeat: Infinity,
                    }}
                    className="absolute -top-1 -right-1 w-2 h-2 bg-orange-400 rounded-full"
                  />
                </div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-orange-300 whitespace-nowrap"
                >
                  <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    Clientes recebidos:{" "}
                    <motion.span
                      key={receivedClients}
                      initial={{ scale: 1.5 }}
                      animate={{ scale: 1 }}
                      className="font-medium"
                    >
                      {receivedClients}
                    </motion.span>
                  </motion.span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Após a caixa de Clientes Recebidos */}
          <AnimatePresence>
            {fetchingUsers && (
              <motion.div
                initial={{ opacity: 0, x: 100, height: 0 }}
                animate={{ opacity: 1, x: 0, height: "auto" }}
                exit={{ opacity: 0, x: 100, height: 0 }}
                transition={{
                  type: "spring",
                  damping: 20,
                  stiffness: 100,
                }}
                className="bg-purple-500/10 backdrop-blur-sm border border-purple-500/20 
                  rounded-lg p-3 pr-4 flex items-center gap-3 shadow-xl overflow-hidden"
              >
                <div className="relative">
                  <motion.div
                    animate={{
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 2,
                      ease: "linear",
                      repeat: Infinity,
                    }}
                  >
                    <ServerIcon className="h-5 w-5 text-purple-400" />
                  </motion.div>
                  <motion.div
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      ease: "easeOut",
                      repeat: Infinity,
                    }}
                    className="absolute -top-1 -right-1 w-2 h-2 bg-purple-400 rounded-full"
                  />
                </div>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-sm text-purple-300 whitespace-nowrap"
                >
                  Buscando usuários do servidor...
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Caixa de Usuários Recebidos */}
          <AnimatePresence>
            {receivedUsers !== null && (
              <motion.div
                initial={{ opacity: 0, x: 100, height: 0 }}
                animate={{ opacity: 1, x: 0, height: "auto" }}
                exit={{ opacity: 0, x: 100, height: 0 }}
                transition={{
                  type: "spring",
                  damping: 20,
                  stiffness: 100,
                }}
                className="bg-indigo-500/10 backdrop-blur-sm border border-indigo-500/20 
                  rounded-lg p-3 pr-4 flex items-center gap-3 shadow-xl overflow-hidden"
              >
                <div className="relative">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      damping: 10,
                      stiffness: 100,
                    }}
                  >
                    <ServerIcon className="h-5 w-5 text-indigo-400" />
                  </motion.div>
                  <motion.div
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 2,
                      ease: "easeOut",
                      repeat: Infinity,
                    }}
                    className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-400 rounded-full"
                  />
                </div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-indigo-300 whitespace-nowrap"
                >
                  <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    Usuários recebidos:{" "}
                    <motion.span
                      key={receivedUsers}
                      initial={{ scale: 1.5 }}
                      animate={{ scale: 1 }}
                      className="font-medium"
                    >
                      {receivedUsers}
                    </motion.span>
                  </motion.span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Conteúdo Central */}
      <div className="w-full max-w-xs">
        {/* Logo */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden">
          <div className="relative w-full h-32">
            <div className="absolute inset-0 bg-[url('/images/ecologo.jpg')] bg-cover bg-center" />
          </div>
        </div>
      </div>

      {/* Área Central - Loading ou Login */}
      <AnimatePresence mode="wait">
        {!isInitializationComplete ? (
          // Loading Animation
          <motion.div
            key="loading"
            exit={{ opacity: 0, y: 20 }}
            className="flex flex-col items-center"
          >
            {/* Círculo animado */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.5,
                ease: "easeOut",
              }}
              className="relative w-32 h-32"
            >
              {/* Círculos concêntricos animados */}
              <motion.div
                animate={{
                  rotate: 360,
                }}
                transition={{
                  duration: 2,
                  ease: "linear",
                  repeat: Infinity,
                }}
                className="absolute inset-0"
              >
                <div className="absolute inset-0 border-t-2 border-blue-500/30 rounded-full" />
              </motion.div>

              <motion.div
                animate={{
                  rotate: 360,
                }}
                transition={{
                  duration: 3,
                  ease: "linear",
                  repeat: Infinity,
                }}
                className="absolute inset-2"
              >
                <div className="absolute inset-0 border-t-2 border-blue-400/40 rounded-full" />
              </motion.div>

              <motion.div
                animate={{
                  rotate: 360,
                }}
                transition={{
                  duration: 4,
                  ease: "linear",
                  repeat: Infinity,
                }}
                className="absolute inset-4"
              >
                <div className="absolute inset-0 border-t-2 border-blue-300/50 rounded-full" />
              </motion.div>

              {/* Ponto central pulsante */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  ease: "easeInOut",
                  repeat: Infinity,
                }}
                className="absolute inset-0 m-auto w-3 h-3 bg-blue-400 rounded-full shadow-lg shadow-blue-500/50"
              />
            </motion.div>

            {/* Texto animado atualizado */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.5,
                duration: 0.5,
              }}
              className="mt-8 text-center"
            >
              <h2 className="text-xl font-medium text-slate-200 mb-2">
                Inicializando
              </h2>
              <p className="text-sm text-slate-400">
                Por favor, aguarde um momento...
              </p>
            </motion.div>
          </motion.div>
        ) : (
          // Login Form
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm"
          >
            <motion.form
              onSubmit={handleLogin}
              className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-xl p-8 shadow-xl"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
            >
              <h2 className="text-xl font-semibold text-slate-200 mb-6 text-center">
                Bem-vindo
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Usuário
                  </label>
                  <input
                    type="text"
                    value={loginData.username}
                    onChange={(e) =>
                      setLoginData({ ...loginData, username: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-900/50 border border-white/10 rounded-lg
                      focus:outline-none focus:border-blue-500 text-slate-200"
                    placeholder="Digite seu usuário"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Senha
                  </label>
                  <input
                    type="password"
                    value={loginData.password}
                    onChange={(e) =>
                      setLoginData({ ...loginData, password: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-900/50 border border-white/10 rounded-lg
                      focus:outline-none focus:border-blue-500 text-slate-200"
                    placeholder="Digite sua senha"
                  />
                </div>

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                    transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    focus:ring-offset-slate-900"
                >
                  Entrar
                </motion.button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assinatura */}
      <div className="flex items-center justify-center text-slate-400 gap-2">
        <BuildingOffice2Icon className="h-5 w-5" />
        <span className="text-sm font-medium">R J Company</span>
      </div>
    </div>
  );
}
