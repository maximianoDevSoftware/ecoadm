import { motion } from "framer-motion";
import {
  DocumentIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
} from "@heroicons/react/24/outline";

export default function FilesReport() {
  // Exemplo de arquivos (você pode substituir por dados reais depois)
  const files = [
    {
      name: "Relatório Mensal - Janeiro 2024",
      type: "PDF",
      size: "2.4 MB",
      date: "15/01/2024",
      status: "download",
    },
    {
      name: "Planilha de Entregas - Fevereiro 2024",
      type: "XLSX",
      size: "1.8 MB",
      date: "01/02/2024",
      status: "upload",
    },
    {
      name: "Relatório de Desempenho - Q1 2024",
      type: "PDF",
      size: "3.1 MB",
      date: "31/03/2024",
      status: "download",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Área de Upload */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-lg p-6">
        <div className="border-2 border-dashed border-white/10 rounded-lg p-8 text-center">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="cursor-pointer"
          >
            <DocumentArrowUpIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-slate-200 font-medium mb-2">
              Arraste arquivos ou clique para fazer upload
            </h3>
            <p className="text-sm text-slate-400">
              Suporta PDF, XLSX, CSV e outros formatos de documentos
            </p>
          </motion.div>
        </div>
      </div>

      {/* Lista de Arquivos */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-sm font-medium text-slate-300">
            Arquivos Recentes
          </h3>
        </div>
        <div className="divide-y divide-white/5">
          {files.map((file, index) => (
            <motion.div
              key={file.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 hover:bg-slate-800/70 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-slate-700/50 rounded-lg">
                    <DocumentIcon className="h-6 w-6 text-slate-300" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-200">
                      {file.name}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {file.type} • {file.size} • {file.date}
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-2 rounded-lg ${
                    file.status === "download"
                      ? "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                      : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                  } transition-colors`}
                >
                  {file.status === "download" ? (
                    <DocumentArrowDownIcon className="h-5 w-5" />
                  ) : (
                    <DocumentArrowUpIcon className="h-5 w-5" />
                  )}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
