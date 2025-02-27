export type clientesTipo = {
  id?: string;
  nome: string;
  telefone: string;
  cidade: string;
  bairro: string;
  rua: string;
  numero: string;
  coordenadas: {
    latitude: number;
    longitude: number;
  };
};
