"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { clientesTipo } from "@/types/clientesType";

interface ClientesContextType {
  clientes: clientesTipo[];
  setClientes: (clientes: clientesTipo[]) => void;
}

const ClientesContext = createContext<ClientesContextType | undefined>(
  undefined
);

export function ClientesProvider({ children }: { children: ReactNode }) {
  const [clientes, setClientes] = useState<clientesTipo[]>([]);

  return (
    <ClientesContext.Provider value={{ clientes, setClientes }}>
      {children}
    </ClientesContext.Provider>
  );
}

export function useClientes() {
  const context = useContext(ClientesContext);
  if (context === undefined) {
    throw new Error("useClientes deve ser usado dentro de um ClientesProvider");
  }
  return context;
}
