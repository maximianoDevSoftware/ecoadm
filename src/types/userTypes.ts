export type usuarioTipo = {
  id: string;
  nome: string;
  status: "disponível" | "indisponível" | "ocupado" | "offline";
  userName: string;
  senha: string;
  localizacao: {
    latitude: number;
    longitude: number;
  };
};
