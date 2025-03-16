import { useState } from "react";
import { motion } from "framer-motion";
import {
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { entregasTipo } from "@/types/entregasTypes";
import { Socket } from "socket.io-client";

interface TableReportProps {
  entregas: entregasTipo[];
  socket: Socket | null;
  isLoading: boolean;
}

// Interface para célula em edição
interface EditingCell {
  id: string;
  field: keyof entregasTipo;
  value: string;
}

export default function TableReport({
  entregas,
  socket,
  isLoading,
}: TableReportProps) {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Função para atualizar campo da entrega
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

  // Componente de célula editável
  const EditableCell = ({
    entrega,
    field,
    value,
    canEdit = true,
    isEditing = false,
  }: {
    entrega: entregasTipo;
    field: keyof entregasTipo;
    value: string;
    canEdit?: boolean;
    isEditing?: boolean;
  }) => {
    const isCurrentlyEditing =
      editingCell?.id === entrega.id && editingCell?.field === field;

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
            <XMarkIcon className="h-3.5 w-3.5" />
          </motion.button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="text-slate-200">
      <div className="rounded-lg border border-white/10 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400">Carregando relatório...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <p className="text-sm text-slate-400">
                Exibindo {entregas.length} entregas
                {entregas.length === 100 ? " (limitado a 100)" : ""}
              </p>
            </div>
            {/* Versão Desktop */}
            <div
              className="overflow-x-auto
              [&::-webkit-scrollbar]:h-1.5
              [&::-webkit-scrollbar-track]:bg-transparent
              [&::-webkit-scrollbar-thumb]:bg-white/10
              [&::-webkit-scrollbar-thumb]:rounded-full
              [&::-webkit-scrollbar-thumb]:hover:bg-white/20
              hover:[&::-webkit-scrollbar]:h-2
              transition-all duration-300"
            >
              <table className="w-full min-w-[1200px]">
                <thead>
                  <tr className="bg-slate-800/50">
                    <th className="sticky left-0 z-20">
                      <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-sm border-r border-white/10 shadow-[2px_0_8px_rgba(0,0,0,0.3)]" />
                      <div className="relative px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Nome
                      </div>
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
                  {entregas.map((entrega) => (
                    <tr
                      key={entrega.id}
                      className="hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="sticky left-0 z-10">
                        <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-sm border-r border-white/10 shadow-[2px_0_8px_rgba(0,0,0,0.3)]" />
                        <div className="relative px-6 py-4 whitespace-nowrap text-sm">
                          <EditableCell
                            entrega={entrega}
                            field="nome"
                            value={entrega.nome}
                            isEditing={!!editingCell}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <EditableCell
                          entrega={entrega}
                          field="status"
                          value={entrega.status || ""}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <EditableCell
                          entrega={entrega}
                          field="dia"
                          value={entrega.dia.join("/")}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <EditableCell
                          entrega={entrega}
                          field="valor"
                          value={entrega.valor}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <EditableCell
                          entrega={entrega}
                          field="pagamento"
                          value={entrega.pagamento}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <EditableCell
                          entrega={entrega}
                          field="entregador"
                          value={entrega.entregador}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <EditableCell
                          entrega={entrega}
                          field="telefone"
                          value={entrega.telefone || ""}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <EditableCell
                          entrega={entrega}
                          field="rua"
                          value={`${entrega.rua}, ${entrega.numero} - ${entrega.bairro}, ${entrega.cidade}`}
                          canEdit={false}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <EditableCell
                          entrega={entrega}
                          field="volume"
                          value={entrega.volume}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <EditableCell
                          entrega={entrega}
                          field="observacoes"
                          value={entrega.observacoes || "-"}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
