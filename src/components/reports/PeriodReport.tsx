import { entregasTipo } from "@/types/entregasTypes";

interface PeriodReportProps {
  entregas: entregasTipo[];
  filters: {
    dataInicial: string;
    dataFinal: string;
    valorMinimo: string;
    valorMaximo: string;
    entregador: string;
  };
  setFilters: (filters: {
    dataInicial: string;
    dataFinal: string;
    valorMinimo: string;
    valorMaximo: string;
    entregador: string;
  }) => void;
}

export default function PeriodReport({
  entregas,
  filters,
  setFilters,
}: PeriodReportProps) {
  return (
    <div className="space-y-6">
      {/* Formulário de Filtros */}
      <div className="bg-slate-800/50 rounded-lg border border-white/10 p-6">
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
                focus:outline-none focus:border-blue-500 text-slate-200"
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
                focus:outline-none focus:border-blue-500 text-slate-200"
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
                focus:outline-none focus:border-blue-500 text-slate-200"
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
                type="number"
                value={filters.valorMinimo}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    valorMinimo: e.target.value,
                  })
                }
                className="w-full pl-8 pr-3 py-2 bg-slate-900/50 border border-white/10 rounded-lg
                  focus:outline-none focus:border-blue-500 text-slate-200"
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
                type="number"
                value={filters.valorMaximo}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    valorMaximo: e.target.value,
                  })
                }
                className="w-full pl-8 pr-3 py-2 bg-slate-900/50 border border-white/10 rounded-lg
                  focus:outline-none focus:border-blue-500 text-slate-200"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabela Filtrada */}
      <div className="rounded-lg border border-white/10 overflow-hidden">
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
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-slate-800/50">
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Nome
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
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {entregas.map((entrega) => (
                <tr
                  key={entrega.id}
                  className="hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-200">
                    {entrega.nome}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${
                          entrega.status === "Disponível"
                            ? "bg-blue-400/10 text-blue-400"
                            : entrega.status === "Andamento"
                            ? "bg-amber-400/10 text-amber-400"
                            : "bg-emerald-400/10 text-emerald-400"
                        }`}
                    >
                      {entrega.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {entrega.dia.join("/")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="text-emerald-400">R$ {entrega.valor}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {entrega.pagamento}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
