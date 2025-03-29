import { motion } from "framer-motion";
import {
  DocumentArrowDownIcon,
  TableCellsIcon,
  DocumentTextIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";
import { entregasTipo } from "@/types/entregasTypes";
import { useState } from "react";

interface FilesReportProps {
  entregas: entregasTipo[];
  isLoading: boolean;
}

export default function FilesReport({ entregas, isLoading }: FilesReportProps) {
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [generatingExcel, setGeneratingExcel] = useState(false);
  const [generatingWord, setGeneratingWord] = useState(false);
  const [generatingEmail, setGeneratingEmail] = useState(false);

  // Configuração dos cards
  const fileCards = [
    {
      title: "PDF",
      icon: DocumentArrowDownIcon,
      color: "bg-red-500/10",
      borderColor: "border-red-500/20",
      textColor: "text-red-400",
      hoverColor: "hover:bg-red-500/20",
      shadowColor: "shadow-red-500/10",
      action: () => handleGeneratePDF(),
      isGenerating: generatingPDF,
    },
    {
      title: "EXCEL",
      icon: TableCellsIcon,
      color: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
      textColor: "text-emerald-400",
      hoverColor: "hover:bg-emerald-500/20",
      shadowColor: "shadow-emerald-500/10",
      action: () => handleGenerateExcel(),
      isGenerating: generatingExcel,
    },
    {
      title: "WORD",
      icon: DocumentTextIcon,
      color: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
      textColor: "text-blue-400",
      hoverColor: "hover:bg-blue-500/20",
      shadowColor: "shadow-blue-500/10",
      action: () => handleGenerateWord(),
      isGenerating: generatingWord,
    },
    {
      title: "EMAIL",
      icon: EnvelopeIcon,
      color: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
      textColor: "text-purple-400",
      hoverColor: "hover:bg-purple-500/20",
      shadowColor: "shadow-purple-500/10",
      action: () => handleGenerateEmail(),
      isGenerating: generatingEmail,
    },
  ];

  // Função para gerar PDF
  const handleGeneratePDF = async () => {
    try {
      setGeneratingPDF(true);
      
      // Verifica se existem entregas para gerar o relatório
      if (!entregas || entregas.length === 0) {
        alert("Não há entregas para gerar o relatório");
        setGeneratingPDF(false);
        return;
      }

      // Carrega dinamicamente a biblioteca jsPDF
      const jspdf = await import('jspdf');
      const jsPDF = jspdf.default;
      // Carrega a biblioteca para adicionar fontes personalizadas
      await import('jspdf-autotable');
      
      // Cria um novo documento PDF
      const doc = new jsPDF();
      
      // Adiciona título ao PDF
      doc.setFontSize(22);
      doc.setTextColor(40, 40, 40);
      doc.text("Relatório de Entregas", 105, 20, { align: "center" });
      
      // Adiciona data de geração
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 105, 27, { align: "center" });
      
      // Adiciona linha decorativa
      doc.setDrawColor(200, 200, 200);
      doc.line(20, 30, 190, 30);
      
      let yPos = 40;
      let currentPage = 1;
      
      // Para cada entrega, adiciona as informações
      entregas.forEach((entrega, index) => {
        // Se não couber mais na página atual, adiciona uma nova página
        if (yPos > 250) {
          doc.addPage();
          currentPage++;
          yPos = 20;
        }
        
        // Adiciona um retângulo para destacar cada entrega
        doc.setFillColor(248, 248, 248);
        doc.setDrawColor(230, 230, 230);
        doc.roundedRect(20, yPos - 5, 170, 70, 3, 3, 'FD');
        
        // Título da entrega
        doc.setFontSize(14);
        doc.setTextColor(30, 30, 30);
        doc.text(`#${index + 1} - ${entrega.nome}`, 25, yPos + 5);
        
        // Status
        const status = entrega.status || "Disponível";
        let statusColor;
        switch (status) {
          case "Disponível":
            statusColor = [52, 152, 219]; // Azul
            break;
          case "Andamento":
            statusColor = [243, 156, 18]; // Laranja
            break;
          case "Concluída":
            statusColor = [46, 204, 113]; // Verde
            break;
          default:
            statusColor = [149, 165, 166]; // Cinza
        }
        
        doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
        doc.roundedRect(150, yPos, 35, 8, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text(status, 167.5, yPos + 5, { align: "center" });
        
        // Detalhes da entrega
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        
        // Coluna 1: Informações básicas
        doc.text(`Data: ${entrega.dia.join("/")}`, 25, yPos + 15);
        doc.text(`Telefone: ${entrega.telefone || "N/A"}`, 25, yPos + 22);
        doc.text(`Valor: R$ ${entrega.valor}`, 25, yPos + 29);
        doc.text(`Pagamento: ${entrega.pagamento}`, 25, yPos + 36);
        
        // Coluna 2: Endereço e entregador
        doc.text(`Endereço: ${entrega.rua}, ${entrega.numero}`, 100, yPos + 15);
        doc.text(`Bairro: ${entrega.bairro}`, 100, yPos + 22);
        doc.text(`Cidade: ${entrega.cidade}`, 100, yPos + 29);
        doc.text(`Entregador: ${entrega.entregador}`, 100, yPos + 36);
        
        // Observações (se houver)
        if (entrega.observacoes) {
          doc.text(`Observações: ${entrega.observacoes}`, 25, yPos + 47);
        }
        
        // Volume e horário
        const horario = entrega.horario ? 
          `${String(entrega.horario[0]).padStart(2, '0')}:${String(entrega.horario[1]).padStart(2, '0')}` : 
          "N/A";
        
        doc.text(`Volume: ${entrega.volume}`, 25, yPos + 54);
        doc.text(`Horário: ${horario}`, 100, yPos + 54);
        
        // Incrementa a posição Y para a próxima entrega
        yPos += 80;
      });
      
      // Adiciona rodapé
      const totalPages = currentPage;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Página ${i} de ${totalPages}`, 105, 290, { align: "center" });
        doc.text("EcoClean - Relatório de Entregas", 20, 290);
      }
      
      // Salva o PDF e faz o download
      doc.save("relatorio-entregas.pdf");
      
      setGeneratingPDF(false);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar PDF. Verifique o console para mais detalhes.");
      setGeneratingPDF(false);
    }
  };

  // Função para gerar Excel
  const handleGenerateExcel = async () => {
    try {
    setGeneratingExcel(true);
      
      // Verifica se existem entregas para gerar o relatório
      if (!entregas || entregas.length === 0) {
        alert("Não há entregas para gerar o relatório");
        setGeneratingExcel(false);
        return;
      }

      // Carrega dinamicamente a biblioteca xlsx
      const xlsx = await import('xlsx');
      
      // Define os cabeçalhos para o Excel
      const headers = [
        "Nome",
        "Status",
        "Data",
        "Telefone", 
        "Endereço",
        "Bairro",
        "Cidade",
        "Valor",
        "Pagamento",
        "Entregador",
        "Volume",
        "Observações",
        "Horário"
      ];
      
      // Prepara os dados das entregas para o Excel
      const data = entregas.map(entrega => {
        // Formata o horário se existir
        const horario = entrega.horario 
          ? `${String(entrega.horario[0]).padStart(2, '0')}:${String(entrega.horario[1]).padStart(2, '0')}` 
          : "N/A";
          
        // Formata o endereço completo
        const endereco = `${entrega.rua}, ${entrega.numero}`;
        
        // Formata a data
        const data = entrega.dia.join("/");
        
        // Retorna uma linha de dados para o Excel
        return [
          entrega.nome,
          entrega.status || "Disponível",
          data,
          entrega.telefone || "N/A",
          endereco,
          entrega.bairro,
          entrega.cidade,
          `R$ ${entrega.valor}`,
          entrega.pagamento,
          entrega.entregador,
          entrega.volume,
          entrega.observacoes || "-",
          horario
        ];
      });
      
      // Cria uma nova planilha
      const wb = xlsx.utils.book_new();
      
      // Adiciona os dados incluindo cabeçalhos
      const ws = xlsx.utils.aoa_to_sheet([headers, ...data]);
      
      // Estilização e formatação da planilha
      // Define larguras de colunas
      const colWidths = [
        { wch: 20 }, // Nome
        { wch: 12 }, // Status
        { wch: 12 }, // Data
        { wch: 15 }, // Telefone
        { wch: 30 }, // Endereço
        { wch: 15 }, // Bairro
        { wch: 15 }, // Cidade
        { wch: 12 }, // Valor
        { wch: 12 }, // Pagamento
        { wch: 12 }, // Entregador
        { wch: 10 }, // Volume
        { wch: 30 }, // Observações
        { wch: 10 }, // Horário
      ];
      ws['!cols'] = colWidths;
      
      // Adiciona a planilha ao workbook
      xlsx.utils.book_append_sheet(wb, ws, "Entregas");
      
      // Converte o Excel para um array buffer e cria um blob para download
      const excelBuffer = xlsx.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Cria um URL para o blob e inicia o download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      
      // Define a data para o nome do arquivo
      const hoje = new Date();
      const dataFormatada = `${hoje.getDate()}-${hoje.getMonth() + 1}-${hoje.getFullYear()}`;
      
      link.href = url;
      link.download = `relatorio-entregas-${dataFormatada}.xlsx`;
      document.body.appendChild(link);
      link.click();
      
      // Limpa o URL e o link
    setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
        setGeneratingExcel(false);
      }, 100);
      
    } catch (error) {
      console.error("Erro ao gerar Excel:", error);
      alert("Erro ao gerar Excel. Verifique o console para mais detalhes.");
      setGeneratingExcel(false);
    }
  };

  const handleGenerateWord = async () => {
    try {
    setGeneratingWord(true);
      
      // Verifica se existem entregas para gerar o relatório
      if (!entregas || entregas.length === 0) {
        alert("Não há entregas para gerar o relatório");
        setGeneratingWord(false);
        return;
      }

      // Carrega dinamicamente a biblioteca docx
      const docx = await import('docx');
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, BorderStyle, AlignmentType, Table, TableRow, TableCell, WidthType, ShadingType } = docx;
      
      // Cria um novo documento Word
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                text: "Relatório de Entregas",
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: {
                  after: 200,
                }
              }),
              
              new Paragraph({
                text: `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
                alignment: AlignmentType.CENTER,
                spacing: {
                  after: 400,
                }
              }),
              
              // Para cada entrega, adiciona as informações
              ...entregas.flatMap((entrega, index) => {
                // Define a cor do status
                const statusStyle = {
                  color: entrega.status === "Disponível" ? "3498DB" : // Azul
                          entrega.status === "Andamento" ? "F39C12" : // Laranja
                          entrega.status === "Concluída" ? "2ECC71" : // Verde
                          "95A5A6" // Cinza (padrão)
                };
                
                // Formata o horário se existir
                const horario = entrega.horario ? 
                  `${String(entrega.horario[0]).padStart(2, '0')}:${String(entrega.horario[1]).padStart(2, '0')}` : 
                  "N/A";

                // Cria uma tabela para cada entrega com estilo semelhante ao PDF
                const entregaTable = new Table({
                  width: {
                    size: 100,
                    type: WidthType.PERCENTAGE,
                  },
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1, color: "E6E6E6" },
                    bottom: { style: BorderStyle.SINGLE, size: 1, color: "E6E6E6" },
                    left: { style: BorderStyle.SINGLE, size: 1, color: "E6E6E6" },
                    right: { style: BorderStyle.SINGLE, size: 1, color: "E6E6E6" },
                    insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "E6E6E6" },
                    insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "E6E6E6" },
                  },
                  rows: [
                    // Cabeçalho da entrega
                    new TableRow({
                      children: [
                        new TableCell({
                          width: {
                            size: 80,
                            type: WidthType.PERCENTAGE,
                          },
                          shading: {
                            type: ShadingType.CLEAR,
                            fill: "F8F8F8",
                          },
                          children: [
                            new Paragraph({
                              text: `#${index + 1} - ${entrega.nome}`,
                              heading: HeadingLevel.HEADING_3,
                            }),
                          ],
                        }),
                        new TableCell({
                          width: {
                            size: 20,
                            type: WidthType.PERCENTAGE,
                          },
                          shading: {
                            type: ShadingType.CLEAR,
                            fill: statusStyle.color,
                          },
                          children: [
                            new Paragraph({
                              alignment: AlignmentType.CENTER,
                              children: [
                                new TextRun({
                                  text: entrega.status || "Disponível",
                                  color: "FFFFFF",
                                  bold: true,
                                }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                    
                    // Dados da entrega - primeira linha
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "Data: ",
                                  bold: true,
                                }),
                                new TextRun({
                                  text: entrega.dia.join("/"),
                                }),
                              ],
                            }),
                          ],
                        }),
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "Endereço: ",
                                  bold: true,
                                }),
                                new TextRun({
                                  text: `${entrega.rua}, ${entrega.numero}`,
                                }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                    
                    // Dados da entrega - segunda linha
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "Telefone: ",
                                  bold: true,
                                }),
                                new TextRun({
                                  text: entrega.telefone || "N/A",
                                }),
                              ],
                            }),
                          ],
                        }),
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "Bairro: ",
                                  bold: true,
                                }),
                                new TextRun({
                                  text: entrega.bairro,
                                }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                    
                    // Dados da entrega - terceira linha
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "Valor: ",
                                  bold: true,
                                }),
                                new TextRun({
                                  text: `R$ ${entrega.valor}`,
                                }),
                              ],
                            }),
                          ],
                        }),
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "Cidade: ",
                                  bold: true,
                                }),
                                new TextRun({
                                  text: entrega.cidade,
                                }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                    
                    // Dados da entrega - quarta linha
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "Pagamento: ",
                                  bold: true,
                                }),
                                new TextRun({
                                  text: entrega.pagamento,
                                }),
                              ],
                            }),
                          ],
                        }),
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "Entregador: ",
                                  bold: true,
                                }),
                                new TextRun({
                                  text: entrega.entregador,
                                }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                    
                    // Dados da entrega - quinta linha
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "Volume: ",
                                  bold: true,
                                }),
                                new TextRun({
                                  text: entrega.volume,
                                }),
                              ],
                            }),
                          ],
                        }),
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "Horário: ",
                                  bold: true,
                                }),
                                new TextRun({
                                  text: horario,
                                }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                    
                    // Observações (se houver)
                    ...(entrega.observacoes ? [
                      new TableRow({
                        children: [
                          new TableCell({
                            columnSpan: 2,
                            children: [
                              new Paragraph({
                                children: [
                                  new TextRun({
                                    text: "Observações: ",
                                    bold: true,
                                  }),
                                  new TextRun({
                                    text: entrega.observacoes,
                                  }),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                    ] : []),
                  ],
                });
                
                // Retorna a tabela seguida de um parágrafo em branco para espaçamento
                return [
                  entregaTable,
                  new Paragraph({
                    spacing: {
                      after: 400,
                    },
                  }),
                ];
              }),
              
              // Adiciona rodapé
              new Paragraph({
                text: "EcoClean - Relatório de Entregas",
                style: "Footer",
                alignment: AlignmentType.LEFT,
              }),
            ],
          },
        ],
      });
      
      // Gera o documento DOCX
      const buffer = await Packer.toBuffer(doc);
      
      // Cria um Blob e faz o download
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
      
      // Cria um URL para o blob e inicia o download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "relatorio-entregas.docx";
      document.body.appendChild(link);
      link.click();
      
      // Limpa o URL e o link
    setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
        setGeneratingWord(false);
      }, 100);
      
    } catch (error) {
      console.error("Erro ao gerar Word:", error);
      alert("Erro ao gerar Word. Verifique o console para mais detalhes.");
      setGeneratingWord(false);
    }
  };

  const handleGenerateEmail = () => {
    setGeneratingEmail(true);
    // Simulando processamento
    setTimeout(() => {
      alert("Funcionalidade de envio por Email será implementada em breve!");
      setGeneratingEmail(false);
    }, 1000);
  };

  return (
    <div className="flex justify-center items-center min-h-[400px]">
      {isLoading ? (
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400">Carregando arquivos...</p>
        </div>
      ) : (
        <div className="w-full max-w-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fileCards.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ 
                  y: -5,
                  transition: { duration: 0.2 } 
                }}
                onClick={card.action}
                className={`${card.color} backdrop-blur-sm border ${card.borderColor} rounded-xl p-6 
                flex flex-col items-center justify-center ${card.hoverColor} transition-all duration-300 
                cursor-pointer shadow-lg ${card.shadowColor} h-40 relative`}
              >
                {card.isGenerating ? (
                  <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-slate-300 text-sm">Gerando {card.title}...</p>
                    </div>
                  </div>
                ) : null}
                <card.icon className={`h-16 w-16 ${card.textColor} mb-4`} />
                <h3 className={`font-medium text-lg ${card.textColor}`}>{card.title}</h3>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
