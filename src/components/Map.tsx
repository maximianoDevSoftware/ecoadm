"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { UserIcon, TruckIcon } from "@heroicons/react/24/solid";
import { mockEntregas } from "@/mocks/entregas";
import { motion, AnimatePresence } from "framer-motion";
import {
  PhoneIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ClockIcon,
  UserCircleIcon,
  ArchiveBoxIcon,
  ChatBubbleBottomCenterTextIcon,
  ArrowsPointingOutIcon,
  TrashIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";
import { io } from "socket.io-client";
import { useUsers } from "@/contexts/UsersContext";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import { useEntregas } from "@/contexts/EntregasContext";
import { entregasTipo } from "@/types/entregasTypes";
import { usuarioTipo } from "@/types/userTypes";

// Função para buscar coordenadas
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

// Estendendo a interface do RoutingControlOptions
declare module "leaflet-routing-machine" {
  interface RoutingControlOptions {
    createMarker?: ((i: number, waypoint: any, n: number) => any) | false;
  }
}

// Função para criar ícone personalizado com o componente UserIcon
const userIcon = L.divIcon({
  html: `<div class="bg-blue-500 rounded-full p-2" style="width: 40px; height: 40px;">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-full h-full text-white">
      <path fill-rule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clip-rule="evenodd" />
    </svg>
  </div>`,
  className: "",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

// Função para criar ícone de entrega baseado no status
const createDeliveryIcon = (status: string) => {
  const bgColor =
    status === "Disponível"
      ? "bg-blue-500"
      : status === "Andamento"
      ? "bg-amber-500"
      : "bg-emerald-500";

  const opacity =
    status === "Concluída"
      ? "opacity-40 hover:opacity-100 transition-opacity duration-300"
      : "";

  return L.divIcon({
    html: `<div class="${bgColor} ${opacity} rounded-full p-2 shadow-lg shadow-black/20 backdrop-blur-sm border-2 border-white/20" style="width: 40px; height: 40px;">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-full h-full text-white">
        <path d="M3.375 4.5C2.339 4.5 1.5 5.34 1.5 6.375V13.5h12V6.375c0-1.036-.84-1.875-1.875-1.875h-8.25zM13.5 15h-12v2.625c0 1.035.84 1.875 1.875 1.875h.375a3 3 0 116 0h3a.75.75 0 00.75-.75V15z" />
        <path d="M8.25 19.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0zM15.75 6.75a.75.75 0 00-.75.75v11.25c0 .087.015.17.042.248a3 3 0 015.958.464c.853-.175 1.522-.935 1.464-1.883a18.659 18.659 0 00-3.732-10.104 1.837 1.837 0 00-1.47-.725H15.75z" />
        <path d="M19.5 19.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0z" />
      </svg>
    </div>`,
    className: "",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });
};

// Função auxiliar para obter cores baseadas no status
const getStatusColor = (status: string) => {
  console.log("Verificando status:", status);

  if (!status)
    return {
      dot: "bg-slate-500",
      text: "text-slate-400",
      border: "border-slate-500/20",
      background: "bg-slate-500/5",
      glow: "shadow-slate-500/20",
      ring: "ring-slate-500/20",
    };

  switch (status.toLowerCase()) {
    case "disponível":
    case "disponivel":
      return {
        dot: "bg-emerald-500",
        text: "text-emerald-400",
        border: "border-emerald-500/20",
        background: "bg-emerald-500/5",
        glow: "shadow-emerald-500/20",
        ring: "ring-emerald-500/20",
      };
    case "indisponível":
    case "indisponivel":
      return {
        dot: "bg-rose-500",
        text: "text-rose-400",
        border: "border-rose-500/20",
        background: "bg-rose-500/5",
        glow: "shadow-rose-500/20",
        ring: "ring-rose-500/20",
      };
    case "ocupado":
      return {
        dot: "bg-amber-500",
        text: "text-amber-400",
        border: "border-amber-500/20",
        background: "bg-amber-500/5",
        glow: "shadow-amber-500/20",
        ring: "ring-amber-500/20",
      };
    default:
      console.log("Status não reconhecido:", status);
      return {
        dot: "bg-slate-500",
        text: "text-slate-400",
        border: "border-slate-500/20",
        background: "bg-slate-500/5",
        glow: "shadow-slate-500/20",
        ring: "ring-slate-500/20",
      };
  }
};

// Função para obter a cor inicial do usuário
const getUserInitialColor = (userName: string) => {
  switch (userName) {
    case "Marcos":
      return "bg-blue-500";
    case "Uene":
      return "bg-red-500";
    case "Leo":
      return "bg-emerald-500";
    default:
      return "bg-slate-500";
  }
};

// Função para criar ícone de usuário baseado no status
const createUserDeliveryIcon = (status: string, userName: string) => {
  const colors = getStatusColor(status);
  const bgColor = getUserInitialColor(userName);

  return L.divIcon({
    html: `
      <div class="relative group">
        <div class="absolute inset-0 ${colors.dot.replace(
          "bg-",
          "bg-opacity-20 bg-"
        )} rounded-xl blur-md transform group-hover:scale-110 transition-all duration-300"></div>
        <div class="${bgColor} rounded-xl p-2 shadow-lg backdrop-blur-sm border-2 border-white/20 transform group-hover:scale-105 transition-all duration-300" style="width: 40px; height: 40px;">
          <div class="relative w-full h-full flex items-center justify-center text-white font-medium">
            ${userName[0]}
            <span class="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-white bg-black/50 px-2 py-1 rounded-full whitespace-nowrap backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300">
              ${userName}
            </span>
          </div>
        </div>
        <div class="absolute -top-1 -right-1 w-3 h-3 ${
          colors.dot
        } rounded-full border-2 border-white animate-pulse"></div>
      </div>
    `,
    className: "user-delivery-icon",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });
};

// Componente personalizado para o conteúdo do Popup
const CustomPopupContent = ({
  entrega,
  onEditPosition,
  onFinishEdit,
  socket,
}: {
  entrega: any;
  onEditPosition: () => void;
  onFinishEdit: () => void;
  socket: any;
}) => {
  const [currentView, setCurrentView] = useState<
    "details" | "editing" | "removing"
  >("details");
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedEntregador, setSelectedEntregador] = useState(
    entrega.entregador
  );
  const [isSaving, setIsSaving] = useState(false);

  const availableUsers = [
    { name: "Marcos Roberto", value: "Marcos" },
    { name: "Uene Passos", value: "Uene" },
    { name: "Leo Henrique", value: "Leo" },
  ];

  useEffect(() => {
    if (socket) {
      socket.on("Atualizando entregas", () => {
        setIsSaving(false);
      });
    }
  }, [socket]);

  const handleDelete = () => {
    setIsDeleting(true);

    // Emite o evento de deletar para o socket
    socket.emit("Deletar Entrega", entrega);

    // Aguarda a animação terminar antes de fechar o popup
    setTimeout(() => {
      setCurrentView("details");
    }, 1000);
  };

  const getPopupStatusColor = (status: string) => {
    switch (status) {
      case "Disponível":
        return "bg-blue-400 text-blue-50";
      case "Andamento":
        return "bg-amber-400 text-amber-50";
      case "Concluída":
        return "bg-emerald-400 text-emerald-50";
      default:
        return "bg-slate-400 text-slate-50";
    }
  };

  return (
    <div className="min-w-[300px] -mt-2 -mx-3">
      <AnimatePresence mode="wait">
        {currentView === "removing" && (
          <motion.div
            key="removing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="text-center py-4"
          >
            <div className="flex items-center justify-center mb-4">
              <motion.div
                className="p-3 bg-rose-500/10 rounded-lg backdrop-blur-sm"
                animate={
                  isDeleting
                    ? {
                        scale: [1, 1.2, 0],
                        rotate: [0, 180, 360],
                        opacity: [1, 1, 0],
                      }
                    : {}
                }
                transition={{ duration: 0.8, ease: "easeInOut" }}
              >
                <TrashIcon className="w-8 h-8 text-rose-500" />
              </motion.div>
            </div>
            {!isDeleting ? (
              <>
                <h3 className="text-white font-medium mb-2">
                  Confirmar Remoção
                </h3>
                <p className="text-white/60 text-sm mb-4">
                  Deseja realmente remover esta entrega?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentView("details")}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white text-sm font-medium py-2 px-4 rounded-lg transition-all transform hover:scale-105"
                  >
                    Cancelar
                  </button>
                  <motion.button
                    onClick={handleDelete}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-all"
                  >
                    Confirmar
                  </motion.button>
                </div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-white/80"
              >
                Removendo entrega...
              </motion.div>
            )}
          </motion.div>
        )}

        {currentView === "editing" && (
          <motion.div
            key="editing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="text-center py-4"
          >
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                <ArrowsPointingOutIcon className="w-8 h-8 text-white animate-pulse" />
              </div>
            </div>

            <div className="space-y-4">
              <button
                type="button"
                onClick={async () => {
                  if (
                    !entrega.rua ||
                    !entrega.numero ||
                    !entrega.bairro ||
                    !entrega.cidade
                  ) {
                    alert("Endereço incompleto para gerar localização");
                    return;
                  }

                  try {
                    const coordinates = await getCoordinates({
                      rua: entrega.rua,
                      numero: entrega.numero,
                      bairro: entrega.bairro,
                      cidade: entrega.cidade,
                    });

                    // Atualiza a entrega com as novas coordenadas
                    socket.emit("Atualizar Entrega", {
                      ...entrega,
                      coordenadas: coordinates,
                    });
                  } catch (error) {
                    alert("Não foi possível encontrar as coordenadas para este endereço");
                  }
                }}
                className="w-full px-4 py-3 bg-blue-600/20 hover:bg-blue-600/30 
                  text-blue-400 rounded-lg transition-all flex items-center justify-center gap-2
                  disabled:opacity-50 disabled:cursor-not-allowed border border-blue-500/20 hover:border-blue-500/30"
              >
                <GlobeAltIcon className="h-5 w-5" />
                Gerar Localização Online
              </button>

              <div>
                <input
                  type="text"
                  value={`${entrega.coordenadas.latitude}, ${entrega.coordenadas.longitude}`}
                  onChange={(e) => {
                    const [lat, lng] = e.target.value.split(",").map(v => parseFloat(v.trim()));
                    if (!isNaN(lat) && !isNaN(lng)) {
                      socket.emit("Atualizar Entrega", {
                        ...entrega,
                        coordenadas: {
                          latitude: lat,
                          longitude: lng
                        }
                      });
                    }
                  }}
                  placeholder="-25.838523944195668, -48.53857383068678"
                  className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-mono 
                    focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 
                    transition-all duration-300 backdrop-blur-sm shadow-inner shadow-black/10 mb-4"
                />
              </div>

              <button
                onClick={() => {
                  setCurrentView("details");
                  onFinishEdit();
                }}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium py-2 px-4 
                  rounded-lg transition-all transform hover:scale-105"
              >
                Posicionar
              </button>
            </div>
          </motion.div>
        )}

        {currentView === "details" && (
          <motion.div
            key="details"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            {/* Entregador */}
            <div className="relative mb-4 pb-3 border-b border-white/10">
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg ${getUserInitialColor(
                    selectedEntregador
                  )}`}
                >
                  <span className="text-white font-medium">
                    {selectedEntregador[0]}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-white">Entregador</h3>
                  <div className="mt-1">
                    <select
                      value={selectedEntregador}
                      onChange={(e) => {
                        setSelectedEntregador(e.target.value);
                        setIsSaving(true);
                        socket.emit("Atualizar Entrega", {
                          ...entrega,
                          entregador: e.target.value,
                        });
                      }}
                      className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-2 py-1 text-sm text-white/80 focus:outline-none focus:border-blue-500/50 transition-colors"
                    >
                      {availableUsers.map((user) => (
                        <option key={user.value} value={user.value}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                    {isSaving && (
                      <div className="absolute right-2 top-2">
                        <div className="w-4 h-4 border-2 border-blue-500/50 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Cabeçalho */}
            <div className="relative mb-4 pb-3 border-b border-white/10">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                  <UserCircleIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-white">{entrega.nome}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <PhoneIcon className="w-4 h-4 text-white/60" />
                    <span className="text-sm text-white/80">
                      {entrega.telefone}
                    </span>
                  </div>
                </div>
              </div>
              <div
                className={`absolute top-0 right-0 px-2 py-1 rounded-lg text-xs font-medium ${getPopupStatusColor(
                  entrega.status || "Disponível"
                )}`}
              >
                {entrega.status}
              </div>
            </div>

            {/* Informações */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-white/80">
                <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
                  <MapPinIcon className="w-4 h-4" />
                </div>
                <div className="text-sm">
                  <p>
                    {entrega.rua}, {entrega.numero}
                  </p>
                  <p className="text-white/60">{entrega.bairro}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-white/80">
                <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
                  <CurrencyDollarIcon className="w-4 h-4" />
                </div>
                <div className="text-sm">
                  <p>R$ {entrega.valor}</p>
                  <p className="text-white/60">{entrega.pagamento}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-white/80">
                <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
                  <ClockIcon className="w-4 h-4" />
                </div>
                <div className="text-sm">
                  <p>{entrega.dia.join("/")}</p>
                  <p className="text-white/60">Data da Entrega</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-white/80">
                <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
                  <ArchiveBoxIcon className="w-4 h-4" />
                </div>
                <div className="text-sm">
                  <p>{entrega.volume}</p>
                  <p className="text-white/60">Volume</p>
                </div>
              </div>

              {entrega.observacoes && (
                <div className="flex items-start gap-3 text-white/80 pt-2 border-t border-white/10">
                  <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
                    <ChatBubbleBottomCenterTextIcon className="w-4 h-4" />
                  </div>
                  <div className="text-sm">
                    <p className="text-white/60 mb-1">Observações</p>
                    <p>{entrega.observacoes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-2 mt-4 pt-3 border-t border-white/10">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCurrentView("removing")}
                className="flex-1 group bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-sm font-medium py-2 px-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
              >
                <TrashIcon className="w-4 h-4 transition-transform duration-300 group-hover:rotate-12" />
                <span>Remover Entrega</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setCurrentView("editing");
                  onEditPosition();
                }}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2 px-3 rounded-lg transition-all duration-300"
              >
                Alterar Marcador
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Componente para gerenciar o marcador draggável
const DraggableMarker = ({
  position,
  entrega,
  onPositionChange,
  socket,
}: any) => {
  const [draggable, setDraggable] = useState(false);
  const [markerPosition, setMarkerPosition] = useState<[number, number]>([
    entrega.coordenadas.latitude,
    entrega.coordenadas.longitude,
  ]);
  const markerRef = useRef<L.Marker | null>(null);
  const map = useMap();
  const { entregas, setEntregas } = useEntregas();

  // Adicionando useEffect para atualizar a posição quando as coordenadas mudarem
  useEffect(() => {
    setMarkerPosition([
      entrega.coordenadas.latitude,
      entrega.coordenadas.longitude,
    ]);
  }, [entrega.coordenadas]);

  const eventHandlers = {
    dragstart() {
      if (markerRef.current) {
        markerRef.current.getElement()?.classList.add("marker-draggable");
      }
    },
    dragend() {
      const marker = markerRef.current;
      if (marker) {
        marker.getElement()?.classList.remove("marker-draggable");
        const newPos = marker.getLatLng();
        setMarkerPosition([newPos.lat, newPos.lng]);
        onPositionChange(newPos);
      }
    },
  };

  useEffect(() => {
    if (draggable && markerRef.current) {
      const marker = markerRef.current;
      marker.getElement()?.classList.add("marker-draggable");
      map.setView(marker.getLatLng(), map.getZoom() || 14);
    } else if (!draggable && markerRef.current) {
      const marker = markerRef.current;
      marker.getElement()?.classList.remove("marker-draggable");
    }
  }, [draggable, map]);

  return (
    <Marker
      draggable={draggable}
      eventHandlers={eventHandlers}
      position={markerPosition}
      ref={markerRef}
      icon={createDeliveryIcon(entrega.status || "Disponível")}
    >
      <Popup className="leaflet-popup-custom">
        <CustomPopupContent
          entrega={entrega}
          onEditPosition={() => {
            setDraggable(true);
            const marker = markerRef.current;
            if (marker) {
              marker.getElement()?.classList.add("marker-draggable");
              map.setView(marker.getLatLng(), map.getZoom() || 14);
            }
          }}
          onFinishEdit={() => {
            setDraggable(false);
            const marker = markerRef.current;
            if (marker) {
              const newPos = marker.getLatLng();
              const entregaAtualizada = {
                ...entrega,
                coordenadas: {
                  latitude: newPos.lat,
                  longitude: newPos.lng,
                },
              };

              // Atualiza localmente para redesenhar as rotas
              const entregasAtualizadas = entregas.map((e) =>
                e.id === entrega.id ? entregaAtualizada : e
              );
              setEntregas(entregasAtualizadas);

              // Envia para o servidor
              socket.emit("Atualizar Entrega", entregaAtualizada);
              marker.getElement()?.classList.remove("marker-draggable");
            }
          }}
          socket={socket}
        />
      </Popup>
    </Marker>
  );
};

// Função para calcular a distância entre dois pontos
const calculateDistance = (point1: L.LatLng, point2: L.LatLng): number => {
  return point1.distanceTo(point2);
};

// Função para encontrar o próximo ponto mais próximo
const findNearestPoint = (
  currentPoint: L.LatLng,
  points: Array<{ position: L.LatLng; entrega: any }>,
  visited: Set<string>
): { position: L.LatLng; entrega: any } | null => {
  let nearest = null;
  let minDistance = Infinity;

  points.forEach((point) => {
    if (!visited.has(point.entrega.id)) {
      const distance = calculateDistance(currentPoint, point.position);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = point;
      }
    }
  });

  return nearest;
};

// Componente para gerenciar as rotas
const DeliveryRoutes = ({
  users,
  entregas,
}: {
  users: any[];
  entregas: any[];
}) => {
  const map = useMap();
  const routingControlsRef = useRef<L.Routing.Control[]>([]);

  // Função para limpar rotas existentes
  const clearRoutes = useCallback(() => {
    routingControlsRef.current.forEach((control) => {
      if (control && map) {
        try {
          if (map.hasLayer(control.getPlan())) {
            map.removeControl(control);
          }
        } catch (error) {
          console.warn("Erro ao remover controle de rota:", error);
        }
      }
    });
    routingControlsRef.current = [];
  }, [map]);

  // Função para calcular e desenhar rotas
  const calculateAndDrawRoutes = useCallback(() => {
    if (!map) return;

    // Limpa as rotas existentes
    clearRoutes();

    // Obtém o horário atual
    const horaAtual = new Date().getHours();
    const minutosAtual = new Date().getMinutes();

    // Para cada entregador
    users.forEach((user) => {
      // Filtrar entregas do entregador
      const userDeliveries = entregas.filter((entrega) => {
        // Verifica se a entrega tem um entregador atribuído
        if (entrega.entregador) {
          // Obtém o horário da entrega
          const [horaEntrega, minutosEntrega] = entrega.horario || [0, 0];

          // Converte horários para minutos para facilitar comparação
          const minutosAtuais = horaAtual * 60 + minutosAtual;
          const minutosEntregaProgramada = horaEntrega * 60 + minutosEntrega;

          // Verifica se:
          // 1. O entregador é o atual
          // 2. O status é Disponível ou Andamento
          // 3. O horário atual é maior que o horário programado da entrega
          return (
            entrega.entregador === user.userName &&
            (entrega.status === "Disponível" || entrega.status === "Andamento") &&
            minutosAtuais >= minutosEntregaProgramada
          );
        }
        // Se não tem entregador, não inclui na rota
        return false;
      });

      console.log(`Calculando rotas para ${user.userName}:`, {
        totalEntregas: userDeliveries.length,
        entregas: userDeliveries.map((e) => ({ id: e.id, status: e.status })),
      });

      if (userDeliveries.length === 0) {
        console.log(
          `Nenhuma entrega disponível ou em andamento para ${user.userName}`
        );
        return;
      }

      // Ponto inicial (posição do entregador)
      const startPoint = new L.LatLng(
        user.localizacao.latitude,
        user.localizacao.longitude
      );

      // Preparar pontos de entrega
      const deliveryPoints = userDeliveries.map((entrega) => ({
        position: new L.LatLng(
          entrega.coordenadas.latitude,
          entrega.coordenadas.longitude
        ),
        entrega,
      }));

      console.log(`Pontos de entrega para ${user.userName}:`, deliveryPoints);

      // Calcular rota otimizada
      const route: L.LatLng[] = [startPoint];
      const visited = new Set<string>();
      let currentPoint = startPoint;

      while (visited.size < deliveryPoints.length) {
        const nearest = findNearestPoint(currentPoint, deliveryPoints, visited);
        if (nearest) {
          route.push(nearest.position);
          visited.add(nearest.entrega.id);
          currentPoint = nearest.position;
        }
      }

      // Criar controle de roteamento com a cor específica do entregador
      const color = getUserInitialColor(user.userName).replace("bg-", "");
      const routeColor =
        color === "blue-500"
          ? "#3B82F6"
          : color === "red-500"
          ? "#EF4444"
          : "#10B981";

      try {
        const control = L.Routing.control({
          waypoints: route,
          show: false,
          addWaypoints: false,
          routeWhileDragging: false,
          fitSelectedRoutes: false,
          showAlternatives: false,
          createMarker: function () {
            return null;
          },
          lineOptions: {
            styles: [
              {
                color: routeColor,
                opacity: 0.4,
                weight: 4,
                className: `delivery-route delivery-route-${user.userName.toLowerCase()}`,
              },
            ],
            extendToWaypoints: true,
            missingRouteTolerance: 100,
          },
        } as L.Routing.RoutingControlOptions);

        // Adiciona estilos CSS para as rotas
        if (!document.getElementById("route-styles")) {
          const style = document.createElement("style");
          style.id = "route-styles";
          style.innerHTML = `
            .delivery-route {
              transition: all 0.3s ease;
              stroke-linecap: round;
              cursor: pointer;
            }
            .delivery-route-marcos {
              filter: drop-shadow(0 0 1px #3B82F6);
            }
            .delivery-route-marcos:hover {
              opacity: 1 !important;
              stroke-width: 8px;
              filter: drop-shadow(0 0 6px #3B82F6);
            }
            .delivery-route-uene {
              filter: drop-shadow(0 0 1px #EF4444);
            }
            .delivery-route-uene:hover {
              opacity: 1 !important;
              stroke-width: 8px;
              filter: drop-shadow(0 0 6px #EF4444);
            }
            .delivery-route-leo {
              filter: drop-shadow(0 0 1px #10B981);
            }
            .delivery-route-leo:hover {
              opacity: 1 !important;
              stroke-width: 8px;
              filter: drop-shadow(0 0 6px #10B981);
            }
          `;
          document.head.appendChild(style);
        }

        // Remove os marcadores após criar o controle
        control.on("routesfound", () => {
          const container = control.getContainer();
          if (container) {
            container.style.display = "none";
          }
        });

        control.addTo(map);
        routingControlsRef.current.push(control);

        console.log(
          `Rota criada para ${user.userName} com ${route.length} pontos`
        );
      } catch (error) {
        console.error(`Erro ao criar rota para ${user.userName}:`, error);
      }
    });
  }, [map, users, entregas, clearRoutes]);

  // Efeito para recalcular rotas quando as entregas ou usuários mudarem
  useEffect(() => {
    console.log(
      "Recalculando rotas devido a mudanças nas entregas ou usuários"
    );
    const timeoutId = setTimeout(() => {
      calculateAndDrawRoutes();
    }, 100); // Pequeno delay para garantir que o mapa está pronto

    return () => {
      clearTimeout(timeoutId);
      clearRoutes();
    };
  }, [calculateAndDrawRoutes, clearRoutes]);

  return null;
};

export default function Map() {
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);
  const { users, setUsers } = useUsers();
  const { entregas } = useEntregas();
  const [socket, setSocket] = useState<any>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Lista de usuários permitidos para ter marcadores
  const allowedUsers = ["Marcos", "Uene", "Leo"];

  // Filtra apenas os usuários permitidos
  const filteredUsers = users.filter((user) =>
    allowedUsers.includes(user.userName)
  );

  // Hook para obter referência ao mapa
  const MapRef = () => {
    const map = useMap();
    mapRef.current = map;
    
    // Adicionamos um listener para o evento personalizado
    useEffect(() => {
      const handleLocalizarEntrega = (event: any) => {
        const { lat, lng } = event.detail;
        console.log("Evento de localizar entrega recebido:", lat, lng);
        
        if (mapRef.current) {
          // Animação fly to para as coordenadas
          mapRef.current.flyTo([lat, lng], 18, {
            duration: 1.5,
            easeLinearity: 0.25
          });
          
          // Mostrar um marcador temporário pulsante
          const marker = L.marker([lat, lng], {
            icon: L.divIcon({
              html: `<div class="pulse-marker"></div>`,
              className: "",
              iconSize: [30, 30],
              iconAnchor: [15, 15]
            })
          }).addTo(mapRef.current);
          
          // Adicionar estilo do marcador pulsante se ainda não existir
          if (!document.getElementById('pulse-marker-style')) {
            const style = document.createElement('style');
            style.id = 'pulse-marker-style';
            style.innerHTML = `
              .pulse-marker {
                width: 30px;
                height: 30px;
                border-radius: 50%;
                background-color: rgba(79, 70, 229, 0.3);
                box-shadow: 0 0 0 rgba(79, 70, 229, 0.4);
                animation: pulse 1.5s infinite;
              }
              
              @keyframes pulse {
                0% {
                  box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.6);
                }
                70% {
                  box-shadow: 0 0 0 20px rgba(79, 70, 229, 0);
                }
                100% {
                  box-shadow: 0 0 0 0 rgba(79, 70, 229, 0);
                }
              }
            `;
            document.head.appendChild(style);
          }
          
          // Remover o marcador após 5 segundos
          setTimeout(() => {
            if (mapRef.current) {
              mapRef.current.removeLayer(marker);
            }
          }, 5000);
        }
      };
      
      // Também verificar o localStorage ao montar o componente
      const savedCoords = localStorage.getItem('localizarEntrega');
      if (savedCoords && mapRef.current) {
        try {
          const { lat, lng } = JSON.parse(savedCoords);
          setTimeout(() => {
            if (mapRef.current) {
              mapRef.current.flyTo([lat, lng], 18, {
                duration: 1.5,
                easeLinearity: 0.25
              });
            }
          }, 500); // Pequeno delay para garantir que o mapa está pronto
          localStorage.removeItem('localizarEntrega'); // Limpar após uso
        } catch (e) {
          console.error("Erro ao ler coordenadas do localStorage", e);
        }
      }
      
      window.addEventListener('localizarEntregaNoMapa', handleLocalizarEntrega);
      return () => window.removeEventListener('localizarEntregaNoMapa', handleLocalizarEntrega);
    }, []);
    
    return null;
  };

  useEffect(() => {
    const newSocket = io("https://servidor-ecoclean-remaster-production.up.railway.app/");
    setSocket(newSocket);

    // Listener para atualizações de usuários
    newSocket.on("Buscar Usuarios", (updatedUsers: usuarioTipo[]) => {
      setUsers(updatedUsers);
      setShowUpdateNotification(true);

      // Esconde a notificação após 5 segundos
      setTimeout(() => {
        setShowUpdateNotification(false);
      }, 5000);
    });

    return () => {
      newSocket.off("Buscar Usuarios");
      newSocket.close();
    };
  }, [setUsers]);

  return (
    <>
      {/* Notificação de Atualização */}
      <AnimatePresence>
        {showUpdateNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] px-4 py-2 
              bg-indigo-500/20 backdrop-blur-md border border-indigo-500/30 
              rounded-full shadow-lg shadow-indigo-500/10"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-indigo-300 text-sm font-medium">
                Atualizando localizações...
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mapa */}
      <MapContainer
        center={[-25.8195, -48.5339]}
        zoom={14}
        className="w-full h-full"
        zoomControl={false}
        style={{ height: "100%", width: "100%" }}
      >
        <MapRef />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* Componente de Rotas */}
        <DeliveryRoutes users={filteredUsers} entregas={entregas} />

        {/* Marcadores dos usuários específicos */}
        {filteredUsers.map((user) => {
          console.log(`Renderizando marcador para ${user.userName}:`, user);
          return (
            <Marker
              key={user.id}
              position={[user.localizacao.latitude, user.localizacao.longitude]}
              icon={createUserDeliveryIcon(user.status, user.userName)}
            >
              <Popup className="leaflet-popup-custom">
                <div className="min-w-[200px] p-2">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`p-2 rounded-lg ${getStatusColor(
                        user.status
                      ).dot.replace("bg-", "bg-opacity-20 bg-")}`}
                    >
                      <div
                        className={`w-6 h-6 ${getUserInitialColor(
                          user.userName
                        )} rounded-lg flex items-center justify-center text-white font-medium`}
                      >
                        {user.userName[0]}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{user.nome}</h3>
                      <span
                        className={`text-sm ${
                          getStatusColor(user.status).text
                        }`}
                      >
                        {user.status || "Offline"}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-white/60">
                    {user.status === "disponível"
                      ? "Disponível para Entregas"
                      : user.status === "ocupado"
                      ? "Em Entrega"
                      : user.status === "indisponível"
                      ? "Indisponível"
                      : "Status Desconhecido"}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Marcadores das entregas */}
        {entregas.map((entrega) => (
          <DraggableMarker
            key={entrega.id}
            position={[
              entrega.coordenadas.latitude,
              entrega.coordenadas.longitude,
            ]}
            entrega={entrega}
            socket={socket}
            onPositionChange={(newPos: L.LatLng) => {
              console.log("Nova posição:", newPos);
              // Emitir atualização para o socket
              socket.emit("Atualizar Entrega", {
                ...entrega,
                coordenadas: {
                  latitude: newPos.lat,
                  longitude: newPos.lng,
                },
              });
            }}
          />
        ))}
      </MapContainer>
    </>
  );
}
