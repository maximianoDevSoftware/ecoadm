"use client";

import React, { createContext, useContext, useState } from "react";
import { usuarioTipo } from "@/types/userTypes";

interface UsersContextType {
  users: usuarioTipo[];
  setUsers: (users: usuarioTipo[]) => void;
}

const UsersContext = createContext<UsersContextType | undefined>(undefined);

export function UsersProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<usuarioTipo[]>([]);

  // Log para debug quando os usuários são atualizados
  const updateUsers = (newUsers: usuarioTipo[]) => {
    console.log("Atualizando usuários no contexto:", newUsers);
    setUsers(newUsers);
  };

  return (
    <UsersContext.Provider value={{ users, setUsers: updateUsers }}>
      {children}
    </UsersContext.Provider>
  );
}

export function useUsers() {
  const context = useContext(UsersContext);
  if (context === undefined) {
    throw new Error("useUsers deve ser usado dentro de um UsersProvider");
  }
  return context;
}
