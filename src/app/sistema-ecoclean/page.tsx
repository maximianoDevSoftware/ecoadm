"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import UsersContainer from "@/components/UsersContainer";

const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => null,
});

export default function SistemaEcoclean() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div className="fixed inset-0">
      <div className="absolute inset-0 z-0">
        <Map />
      </div>
      <Sidebar isMobile={isMobile} />
      <UsersContainer />
    </div>
  );
}
