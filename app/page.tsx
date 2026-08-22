"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import EditorCodigo from "@/components/EditorCodigo";
import PanelLexico from "@/components/PanelLexico";
import PanelSintactico from "@/components/PanelSintactico";
import { tokenizarCodigo, tokenizarPrograma } from "@/lib/lexer";
import { analizarSintaxis, ResultadoParser } from "@/lib/parser";
import { ConfiguracionLexica } from "@/lib/configuracionLexica";
import { cargarConfiguracion } from "@/lib/almacenConfiguracion";

const CODIGO_INICIAL = `int i,j,k;
char s[10];
s=i+j*k;
if (i > 0) {
  console.log("Resultado: 123, ok");
} else {
  const total = 45.5;
}`;

export default function Home() {
  const [codigo, setCodigo] = useState(CODIGO_INICIAL);
  const [resultadoSintactico, setResultadoSintactico] =
    useState<ResultadoParser | null>(null);
  const [config, setConfig] = useState<ConfiguracionLexica | null>(null);

  useEffect(() => {
    setConfig(cargarConfiguracion());
  }, []);

  const lineasAnalizadas = useMemo(() => {
    if (!config) return [];
    return tokenizarCodigo(codigo, config);
  }, [codigo, config]);

  function compilar() {
    if (!config) return;
    const tokens = tokenizarPrograma(codigo, config);
    const resultado = analizarSintaxis(tokens);
    setResultadoSintactico(resultado);
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-1">
            Compilador Web — Proyecto de Compiladores
          </h1>
          <p className="text-slate-500 text-sm">
            Programa fuente → Análisis léxico → Análisis sintáctico → Análisis
            semántico
          </p>
        </div>
        <Link
          href="/configuracion"
          className="text-sm bg-white border border-slate-300 hover:border-slate-400 text-slate-700 px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap"
        >
          ⚙ Configuración léxica
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[540px] auto-rows-fr">
        <EditorCodigo codigo={codigo} onChange={setCodigo} />
        <PanelLexico lineas={lineasAnalizadas} />
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={compilar}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          Compilar
        </button>
      </div>

      <div className="mt-4 h-[55vh]">
        <PanelSintactico resultado={resultadoSintactico} />
      </div>
    </main>
  );
}
