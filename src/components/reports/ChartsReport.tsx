import { entregasTipo } from "@/types/entregasTypes";
import { motion } from "framer-motion";
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  TruckIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

interface ChartsReportProps {
  entregas: entregasTipo[];
}

export default function ChartsReport({ entregas }: ChartsReportProps) {
  // Cálculos para os cards de resumo
  const totalEntregas = entregas.length;
  const totalValor = entregas.reduce(
    (acc, entrega) => acc + parseFloat(entrega.valor.replace(",", ".")),
    0
  );
  const entregasPorStatus = entregas.reduce((acc, entrega) => {
    acc[entrega.status || "Sem Status"] =
      (acc[entrega.status || "Sem Status"] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const entregasPorEntregador = entregas.reduce((acc, entrega) => {
    acc[entrega.entregador] = (acc[entrega.entregador] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const cards = [
    {
      title: "Total de Entregas",
      value: totalEntregas,
      icon: TruckIcon,
      color: "blue",
    },
    {
      title: "Valor Total",
      value: `R$ ${totalValor.toFixed(2)}`,
      icon: CurrencyDollarIcon,
      color: "emerald",
    },
    {
      title: "Status",
      value: Object.keys(entregasPorStatus).length,
      icon: ChartBarIcon,
      color: "amber",
    },
    {
      title: "Entregadores Ativos",
      value: Object.keys(entregasPorEntregador).length,
      icon: UserGroupIcon,
      color: "purple",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-slate-800/50 backdrop-blur-sm border border-${card.color}-500/20 rounded-lg p-4
              hover:bg-slate-800/70 transition-all duration-300 group`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`p-3 rounded-lg bg-${card.color}-500/10 text-${card.color}-400 
                group-hover:bg-${card.color}-500/20 transition-colors`}
              >
                <card.icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-400">
                  {card.title}
                </h3>
                <p className={`text-lg font-semibold text-${card.color}-400`}>
                  {card.value}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status das Entregas */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-lg p-6">
          <h3 className="text-sm font-medium text-slate-300 mb-4">
            Status das Entregas
          </h3>
          <div className="space-y-2">
            {Object.entries(entregasPorStatus).map(([status, quantidade]) => (
              <div key={status} className="flex items-center gap-2">
                <div
                  className={`h-2 rounded-full flex-1 bg-slate-700 overflow-hidden`}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(quantidade / totalEntregas) * 100}%`,
                    }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full ${
                      status === "Disponível"
                        ? "bg-blue-500"
                        : status === "Andamento"
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                  />
                </div>
                <span className="text-sm text-slate-400 w-24 text-right">
                  {status} ({quantidade})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Entregas por Entregador */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-lg p-6">
          <h3 className="text-sm font-medium text-slate-300 mb-4">
            Entregas por Entregador
          </h3>
          <div className="space-y-2">
            {Object.entries(entregasPorEntregador).map(
              ([entregador, quantidade]) => (
                <div key={entregador} className="flex items-center gap-2">
                  <div className="h-2 rounded-full flex-1 bg-slate-700 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(quantidade / totalEntregas) * 100}%`,
                      }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-full ${
                        entregador === "Marcos"
                          ? "bg-blue-500"
                          : entregador === "Uene"
                          ? "bg-purple-500"
                          : "bg-emerald-500"
                      }`}
                    />
                  </div>
                  <span className="text-sm text-slate-400 w-24 text-right">
                    {entregador} ({quantidade})
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
