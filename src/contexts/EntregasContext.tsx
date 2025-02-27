"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { entregasTipo } from "@/types/entregasTypes";

interface EntregasContextType {
  entregas: entregasTipo[];
  setEntregas: (entregas: entregasTipo[]) => void;
}

const EntregasContext = createContext<EntregasContextType | undefined>(
  undefined
);

export function EntregasProvider({ children }: { children: ReactNode }) {
  const [entregas, setEntregas] = useState<entregasTipo[]>([]);

  return (
    <EntregasContext.Provider value={{ entregas, setEntregas }}>
      {children}
    </EntregasContext.Provider>
  );
}

export function useEntregas() {
  const context = useContext(EntregasContext);
  if (context === undefined) {
    throw new Error("useEntregas deve ser usado dentro de um EntregasProvider");
  }
  return context;
}
