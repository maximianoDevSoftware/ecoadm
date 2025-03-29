export type entregasTipo = {
    id?: string;
    dia?: number[];
    nome?: string;
    status?: string;
    telefone?: string;
    cidade?: string;
    bairro?: string;
    rua?: string;
    numero?: string;
    coordenadas?: {
      latitude?: number;
      longitude?: number;
    };
    valor?: string;
    pagamento?: string;
    entregador?: string;
    volume?: string;
    observacoes?: string;
    statusPagamento?: string;
    horario?: [horas:number, minutos: number];
    statusMensagem?: string;
  };