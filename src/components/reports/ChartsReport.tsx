import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  TruckIcon,
  UserGroupIcon,
  MapPinIcon,
  ClockIcon
} from "@heroicons/react/24/outline";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData
} from 'chart.js';
import { Line, Pie, Bar } from 'react-chartjs-2';
import { entregasTipo } from "@/types/entregasTypes";

// Registrando componentes necessários do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ChartsReportProps {
  entregas: entregasTipo[];
  isLoading: boolean;
}

// Função para normalizar strings (remover acentos e converter para maiúsculas)
const normalizarTexto = (texto: string): string => {
  if (!texto) return "";
  
  // Primeiro converte para maiúsculas
  const textoMaiusculo = texto.toUpperCase();
  
  // Tabela de conversão de caracteres acentuados
  const mapaAcentos: Record<string, string> = {
    'À': 'A', 'Á': 'A', 'Â': 'A', 'Ã': 'A', 'Ä': 'A', 'Å': 'A',
    'È': 'E', 'É': 'E', 'Ê': 'E', 'Ë': 'E',
    'Ì': 'I', 'Í': 'I', 'Î': 'I', 'Ï': 'I',
    'Ò': 'O', 'Ó': 'O', 'Ô': 'O', 'Õ': 'O', 'Ö': 'O',
    'Ù': 'U', 'Ú': 'U', 'Û': 'U', 'Ü': 'U',
    'Ç': 'C', 'Ñ': 'N'
  };
  
  // Remove acentos
  return textoMaiusculo
    .split('')
    .map(char => mapaAcentos[char] || char)
    .join('');
};

export default function ChartsReport({ entregas, isLoading }: ChartsReportProps) {
  const [chartData, setChartData] = useState<ChartData<'line', number[]>>({
    labels: [],
    datasets: []
  });
  
  const [bairrosChartData, setBairrosChartData] = useState<ChartData<'pie', number[]>>({
    labels: [],
    datasets: []
  });
  
  const [horariosChartData, setHorariosChartData] = useState<ChartData<'bar', number[]>>({
    labels: [],
    datasets: []
  });

  // Processar os dados ao receber entregas
  useEffect(() => {
    if (entregas.length > 0) {
      processChartData(entregas);
      processBairrosData(entregas);
      processHorariosData(entregas);
    }
  }, [entregas]);

  // Função para processar os dados das entregas
  const processChartData = (entregas: entregasTipo[]) => {
    // Obter data atual
    const hoje = new Date();
    const diaAtual = hoje.getDate();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();
    
    // Calcular o primeiro dia do mês atual
    const primeiroDiaMes = new Date(anoAtual, mesAtual, 1);
    
    // Calcular o início da semana (7 dias atrás)
    const inicioDaSemana = new Date(hoje);
    inicioDaSemana.setDate(hoje.getDate() - 6); // últimos 7 dias (hoje + 6 dias anteriores)
    
    // Preparar arrays para armazenar valores por dia
    const diasDoMes = new Date(anoAtual, mesAtual + 1, 0).getDate(); // último dia do mês atual
    const valoresPorDiaMes = Array(diasDoMes).fill(0);
    const valoresPorDiaSemana = Array(7).fill(0);
    
    // Mapear dias da semana para o eixo X
    const diasDaSemana = [];
    for (let i = 0; i < 7; i++) {
      const data = new Date(inicioDaSemana);
      data.setDate(inicioDaSemana.getDate() + i);
      diasDaSemana.push(data.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' }));
    }
    
    // Processar entregas para somar valores por dia
    entregas.forEach(entrega => {
      // Verificar se a entrega possui data válida
      if (entrega.dia && entrega.dia.length === 3) {
        const [dia, mes, ano] = entrega.dia;
        const dataEntrega = new Date(ano, mes - 1, dia); // mês em JavaScript é 0-indexed
        
        // Converter valor de string para número
        const valor = parseFloat(entrega.valor.replace(',', '.')) || 0;
        
        // Se for do mês atual, adicionar aos valores do mês
        if (dataEntrega.getMonth() === mesAtual && dataEntrega.getFullYear() === anoAtual) {
          const indiceDia = dataEntrega.getDate() - 1; // Arrays são 0-indexed
          valoresPorDiaMes[indiceDia] += valor;
        }
        
        // Se for dos últimos 7 dias, adicionar aos valores da semana
        if (dataEntrega >= inicioDaSemana && dataEntrega <= hoje) {
          const diasDesdeInicio = Math.floor((dataEntrega.getTime() - inicioDaSemana.getTime()) / (1000 * 60 * 60 * 24));
          if (diasDesdeInicio >= 0 && diasDesdeInicio < 7) {
            valoresPorDiaSemana[diasDesdeInicio] += valor;
          }
        }
      }
    });
    
    // Preparar dados para visualização do mês inteiro
    const labelsMes = [];
    const dadosMes = [];
    
    for (let i = 0; i < diasDoMes; i++) {
      const data = new Date(anoAtual, mesAtual, i + 1);
      labelsMes.push(data.toLocaleDateString('pt-BR', { day: 'numeric' }));
      dadosMes.push(valoresPorDiaMes[i]);
    }
    
    // Configurar dados para o gráfico
    setChartData({
      labels: diasDaSemana,
      datasets: [
        {
          label: 'Últimos 7 dias',
          data: valoresPorDiaSemana,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: 'rgba(75, 192, 192, 1)',
        },
        {
          label: 'Mês completo (média diária)',
          data: valoresPorDiaSemana.map((_, index) => {
            // Calculamos a média diária do mês para comparar com a semana
            const somaTotal = valoresPorDiaMes.reduce((acc, val) => acc + val, 0);
            return somaTotal / diasDoMes;
          }),
          borderColor: 'rgba(153, 102, 255, 1)',
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          borderDash: [5, 5],
          tension: 0,
          borderWidth: 2,
          pointRadius: 0,
        }
      ]
    });
  };
  
  // Função para processar dados de distribuição por bairros
  const processBairrosData = (entregas: entregasTipo[]) => {
    // Agrupar entregas por bairro (normalizado)
    const bairrosCount: Record<string, number> = {};
    
    entregas.forEach(entrega => {
      if (entrega.bairro) {
        // Normaliza o nome do bairro (remove acentos e converte para maiúsculas)
        const bairroNormalizado = normalizarTexto(entrega.bairro);
        
        if (!bairrosCount[bairroNormalizado]) {
          bairrosCount[bairroNormalizado] = 0;
        }
        bairrosCount[bairroNormalizado]++;
      }
    });
    
    // Ordenar bairros por quantidade (decrescente)
    const bairrosOrdenados = Object.entries(bairrosCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8); // Limitar aos 8 bairros mais frequentes
    
    // Cores para os bairros
    const coresBairros = [
      'rgba(255, 99, 132, 0.7)',
      'rgba(54, 162, 235, 0.7)',
      'rgba(255, 206, 86, 0.7)',
      'rgba(75, 192, 192, 0.7)',
      'rgba(153, 102, 255, 0.7)',
      'rgba(255, 159, 64, 0.7)',
      'rgba(199, 199, 199, 0.7)',
      'rgba(83, 102, 255, 0.7)',
      'rgba(78, 205, 196, 0.7)',
      'rgba(255, 177, 101, 0.7)',
    ];
    
    // Configurar dados para o gráfico de pizza
    setBairrosChartData({
      labels: bairrosOrdenados.map(([bairro]) => bairro),
      datasets: [
        {
          data: bairrosOrdenados.map(([_, count]) => count),
          backgroundColor: coresBairros.slice(0, bairrosOrdenados.length),
          borderColor: coresBairros.map(cor => cor.replace('0.7', '1')),
          borderWidth: 1,
        }
      ]
    });
  };
  
  // Função para processar dados de distribuição por horários
  const processHorariosData = (entregas: entregasTipo[]) => {
    // Definir faixas de horários
    const faixasHorarios = [
      '8h-10h', '10h-12h', '12h-14h', '14h-16h', '16h-18h', '18h-20h', '20h-22h'
    ];
    
    // Inicializar contador para cada faixa horária
    const contadorHorarios = faixasHorarios.reduce((acc, faixa) => {
      acc[faixa] = 0;
    return acc;
  }, {} as Record<string, number>);

    // Processar entregas para contar por horário
    entregas.forEach(entrega => {
      if (entrega.horario && entrega.horario.length === 2) {
        const [hora] = entrega.horario;
        
        if (hora >= 8 && hora < 10) contadorHorarios['8h-10h']++;
        else if (hora >= 10 && hora < 12) contadorHorarios['10h-12h']++;
        else if (hora >= 12 && hora < 14) contadorHorarios['12h-14h']++;
        else if (hora >= 14 && hora < 16) contadorHorarios['14h-16h']++;
        else if (hora >= 16 && hora < 18) contadorHorarios['16h-18h']++;
        else if (hora >= 18 && hora < 20) contadorHorarios['18h-20h']++;
        else if (hora >= 20 && hora < 22) contadorHorarios['20h-22h']++;
      }
    });
    
    // Configurar dados para o gráfico de barras
    setHorariosChartData({
      labels: faixasHorarios,
      datasets: [
        {
          label: 'Quantidade de entregas',
          data: Object.values(contadorHorarios),
          backgroundColor: 'rgba(75, 192, 192, 0.7)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        }
      ]
    });
  };

  // Opções do gráfico
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            family: 'Inter, sans-serif',
          }
        }
      },
      title: {
        display: true,
        text: 'Comparativo de Valores de Entregas',
        color: 'rgba(255, 255, 255, 0.9)',
        font: {
          size: 16,
          family: 'Inter, sans-serif',
          weight: 'bold'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: 'rgba(255, 255, 255, 0.9)',
        bodyColor: 'rgba(255, 255, 255, 0.7)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 10,
        boxPadding: 5,
        usePointStyle: true,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          callback: function(value) {
            return 'R$ ' + value.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
          }
        },
        beginAtZero: true
      }
    }
  };
  
  // Opções para o gráfico de pizza de bairros
  const bairrosOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            family: 'Inter, sans-serif',
            size: 11
          },
          padding: 15,
          boxWidth: 12,
          boxHeight: 12,
        }
      },
      title: {
        display: true,
        text: 'Distribuição por Bairros',
        color: 'rgba(255, 255, 255, 0.9)',
        font: {
          size: 16,
          family: 'Inter, sans-serif',
          weight: 'bold'
        },
        padding: {
          bottom: 10
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: 'rgba(255, 255, 255, 0.9)',
        bodyColor: 'rgba(255, 255, 255, 0.7)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 10,
        boxPadding: 5,
        usePointStyle: true,
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((sum: number, value: number) => sum + value, 0);
            const percentage = Math.round((context.parsed * 100) / total);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          }
        }
      }
    }
  };
  
  // Opções para o gráfico de barras de horários
  const horariosOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Volume de Entregas por Horário',
        color: 'rgba(255, 255, 255, 0.9)',
        font: {
          size: 16,
          family: 'Inter, sans-serif',
          weight: 'bold'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: 'rgba(255, 255, 255, 0.9)',
        bodyColor: 'rgba(255, 255, 255, 0.7)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 10,
        boxPadding: 5,
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          stepSize: 1,
        },
        beginAtZero: true
      }
    }
  };

  // Componente resumo financeiro
  const FinancialSummary = ({ entregas }: { entregas: entregasTipo[] }) => {
    // Calcular valores totais
    const valorTotalMes = entregas
      .filter(entrega => {
        if (entrega.dia && entrega.dia.length === 3) {
          const [dia, mes, ano] = entrega.dia;
          const dataEntrega = new Date(ano, mes - 1, dia);
          const hoje = new Date();
          return dataEntrega.getMonth() === hoje.getMonth() && dataEntrega.getFullYear() === hoje.getFullYear();
        }
        return false;
      })
      .reduce((total, entrega) => total + parseFloat(entrega.valor.replace(',', '.')), 0);
    
    const valorTotalSemana = entregas
      .filter(entrega => {
        if (entrega.dia && entrega.dia.length === 3) {
          const [dia, mes, ano] = entrega.dia;
          const dataEntrega = new Date(ano, mes - 1, dia);
          const hoje = new Date();
          const inicioDaSemana = new Date(hoje);
          inicioDaSemana.setDate(hoje.getDate() - 6);
          return dataEntrega >= inicioDaSemana && dataEntrega <= hoje;
        }
        return false;
      })
      .reduce((total, entrega) => total + parseFloat(entrega.valor.replace(',', '.')), 0);
    
    const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <motion.div 
          whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.2)" }} 
          className="bg-blue-500/10 backdrop-blur-sm border border-blue-500/20 rounded-lg p-4 shadow-lg"
        >
          <h3 className="text-sm font-medium text-blue-400 mb-1">Total do Mês</h3>
          <p className="text-2xl font-bold text-white">{formatter.format(valorTotalMes)}</p>
          <p className="text-xs text-blue-300 mt-1">
            {new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
          </p>
        </motion.div>
        
        <motion.div 
          whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(79, 209, 197, 0.2)" }} 
          className="bg-teal-500/10 backdrop-blur-sm border border-teal-500/20 rounded-lg p-4 shadow-lg"
        >
          <h3 className="text-sm font-medium text-teal-400 mb-1">Total dos Últimos 7 Dias</h3>
          <p className="text-2xl font-bold text-white">{formatter.format(valorTotalSemana)}</p>
          <p className="text-xs text-teal-300 mt-1">
            {`${valorTotalSemana > 0 ? (valorTotalSemana / valorTotalMes * 100).toFixed(1) : 0}% do total do mês`}
          </p>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400">Carregando dados do gráfico...</p>
          </div>
        </div>
      ) : entregas.length === 0 ? (
        <div className="flex items-center justify-center p-12">
          <div className="bg-amber-500/10 text-amber-400 px-4 py-3 rounded-lg border border-amber-500/20 backdrop-blur-sm">
            Nenhum dado de entrega disponível para o período selecionado
          </div>
        </div>
      ) : (
        <>
          <FinancialSummary entregas={entregas} />
          
          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-lg shadow-xl overflow-hidden">
            <div className="h-[400px] p-4">
              <Line data={chartData} options={options} />
            </div>
          </div>
          
          {/* Novos gráficos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <motion.div
              whileHover={{ y: -3 }}
              transition={{ duration: 0.3 }}
              className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-lg shadow-xl overflow-hidden"
            >
              <div className="h-[350px] p-4">
                <Pie data={bairrosChartData} options={bairrosOptions} />
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -3 }}
              transition={{ duration: 0.3 }}
              className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-lg shadow-xl overflow-hidden"
            >
              <div className="h-[350px] p-4">
                <Bar data={horariosChartData} options={horariosOptions} />
            </div>
          </motion.div>
      </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <motion.div 
              whileHover={{ y: -2 }} 
              className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-lg p-4"
            >
              <h3 className="text-sm font-medium text-slate-300 mb-3">Distribuição por Pagamento</h3>
          <div className="space-y-2">
                {['PIX', 'Dinheiro', 'Cartão', 'Boleto'].map(tipo => {
                  const entregasDesseTipo = entregas.filter(e => e.pagamento === tipo);
                  const valorTotal = entregasDesseTipo.reduce((acc, e) => acc + parseFloat(e.valor.replace(',', '.')), 0);
                  const porcentagem = (valorTotal / entregas.reduce((acc, e) => acc + parseFloat(e.valor.replace(',', '.')), 0)) * 100;
                  
                  return (
                    <div key={tipo} className="flex items-center gap-2">
                      <div className={`h-2 rounded-full flex-1 bg-slate-700 overflow-hidden`}>
                  <motion.div
                    initial={{ width: 0 }}
                          animate={{ width: `${porcentagem}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full ${
                            tipo === 'PIX' ? "bg-emerald-500" :
                            tipo === 'Dinheiro' ? "bg-amber-500" :
                            tipo === 'Boleto' ? "bg-purple-500" :
                            "bg-blue-500"
                    }`}
                  />
                </div>
                      <span className="text-sm text-slate-400 w-32 flex justify-between">
                        <span>{tipo}</span>
                        <span>{porcentagem.toFixed(1)}%</span>
                </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -2 }} 
              className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-lg p-4"
            >
              <h3 className="text-sm font-medium text-slate-300 mb-3">Entregas por Entregador</h3>
          <div className="space-y-2">
                {['Marcos', 'Uene', 'Leo'].map(entregador => {
                  const entregasDesseEntregador = entregas.filter(e => e.entregador === entregador);
                  const porcentagem = (entregasDesseEntregador.length / entregas.length) * 100;
                  
                  return (
                <div key={entregador} className="flex items-center gap-2">
                      <div className={`h-2 rounded-full flex-1 bg-slate-700 overflow-hidden`}>
                    <motion.div
                      initial={{ width: 0 }}
                          animate={{ width: `${porcentagem}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-full ${
                            entregador === 'Marcos' ? "bg-blue-500" :
                            entregador === 'Uene' ? "bg-purple-500" :
                            "bg-emerald-500"
                      }`}
                    />
                  </div>
                      <span className="text-sm text-slate-400 w-32 flex justify-between">
                        <span>{entregador}</span>
                        <span>{porcentagem.toFixed(1)}%</span>
                  </span>
                </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
