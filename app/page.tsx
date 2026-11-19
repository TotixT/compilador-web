// © 2026 Santiago López García y Oscar Julián Mojica Calderón. Ver el archivo LICENSE.
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import EditorCodigo from "@/components/EditorCodigo";
import PanelLexico from "@/components/PanelLexico";
import PanelSintactico from "@/components/PanelSintactico";
import PanelSemantico from "@/components/PanelSemantico";
import PanelCodigoIntermedio from "@/components/PanelCodigoIntermedio";
import EncabezadoAutoria from "@/components/EncabezadoAutoria";
import PieAutoria from "@/components/PieAutoria";
import { verificarCreditos } from "@/lib/creditos";
import { tokenizarCodigo, tokenizarPrograma } from "@/lib/lexer";
import { analizarSintaxis, ResultadoParser } from "@/lib/parser";
import { analizarSemantica, ResultadoSemantico } from "@/lib/semantico";
import { generarCodigoIntermedio, InstruccionTAC } from "@/lib/codigoIntermedio";
import { ConfiguracionLexica } from "@/lib/configuracionLexica";
import { cargarConfiguracion } from "@/lib/almacenConfiguracion";
import {
  cargarCodigoGuardado,
  guardarCodigoGuardado,
  cargarSeCompilo,
  guardarSeCompilo,
} from "@/lib/almacenSesion";

const CODIGO_INICIAL = `int a, b; float p;
const lim = 100; const msg = "Fin: " + "ok";
a = 10; b = 2; p = 3.5;
while (a > 0 && b < (a * 4 - 5)) { a = b * a - 10; }
if (a <= lim) { int t; t = a / 2; p = t; } else { p = 0; }
console.log(msg, a, p);`;

/** Corre las 3 etapas (sintáctico, semántico, código intermedio) sobre un código fuente dado. */
function ejecutarCompilacion(fuente: string, config: ConfiguracionLexica) {
  const tokens = tokenizarPrograma(fuente, config);
  const sint = analizarSintaxis(tokens);

  if (!sint.valido || !sint.arbol) {
    return { sint, sem: null, tac: null };
  }

  const sem = analizarSemantica(sint.arbol);
  if (!sem.valido) {
    return { sint, sem, tac: null };
  }

  return { sint, sem, tac: generarCodigoIntermedio(sint.arbol) };
}

export default function Home() {
  const [codigo, setCodigoState] = useState(CODIGO_INICIAL);
  const [config, setConfig] = useState<ConfiguracionLexica | null>(null);

  const [seCompilo, setSeCompilo] = useState(false);
  const [resultadoSintactico, setResultadoSintactico] = useState<ResultadoParser | null>(null);
  const [resultadoSemantico, setResultadoSemantico] = useState<ResultadoSemantico | null>(null);
  const [codigoIntermedio, setCodigoIntermedio] = useState<InstruccionTAC[] | null>(null);
  const [bloqueo, setBloqueo] = useState<string | null>(null);

    useEffect(() => {
    const cfg = cargarConfiguracion();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial desde localStorage, es el uso que React documenta como válido
    setConfig(cfg);

    const codigoGuardado = cargarCodigoGuardado();
    const fuente = codigoGuardado ?? CODIGO_INICIAL;
    if (codigoGuardado !== null) setCodigoState(codigoGuardado);

    if (cargarSeCompilo()) {
      setSeCompilo(true);
      const { sint, sem, tac } = ejecutarCompilacion(fuente, cfg);
      setResultadoSintactico(sint);
      setResultadoSemantico(sem);
      setCodigoIntermedio(tac);
    }
  }, []);

  // Revisa cada pocos segundos que los créditos sigan intactos y visibles.
  useEffect(() => {
    const revisar = () => {
      const r = verificarCreditos();
      setBloqueo(r.ok ? null : (r.motivo ?? "Los créditos del proyecto fueron modificados."));
    };
    const id = setInterval(revisar, 2000);
    return () => clearInterval(id);
  }, []);

  function actualizarCodigo(nuevoCodigo: string) {
    setCodigoState(nuevoCodigo);
    guardarCodigoGuardado(nuevoCodigo);
  }

  const lineasAnalizadas = useMemo(() => {
    if (!config) return [];
    return tokenizarCodigo(codigo, config);
  }, [codigo, config]);

  function compilar() {
    if (!config) return;
    const creditos = verificarCreditos();
    if (!creditos.ok) {
      setBloqueo(creditos.motivo ?? "Los créditos del proyecto fueron modificados.");
      return;
    }
    setSeCompilo(true);
    guardarSeCompilo(true);

    const { sint, sem, tac } = ejecutarCompilacion(codigo, config);
    setResultadoSintactico(sint);
    setResultadoSemantico(sem);
    setCodigoIntermedio(tac);
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-1">
            Compilador Web — Proyecto de Compiladores
          </h1>
          <p className="text-slate-500 text-sm">
            Programa fuente → Análisis léxico → Análisis sintáctico → Análisis
            semántico → Código intermedio
          </p>
        </div>
        <EncabezadoAutoria />
        <Link
          href="/configuracion"
          className="text-sm bg-white border border-slate-300 hover:border-slate-400 text-slate-700 px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap"
        >
          ⚙ Configuración léxica
        </Link>
      </div>

      {bloqueo && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-300 bg-red-50 text-red-700 px-4 py-3 text-sm"
        >
          <strong>Compilador bloqueado.</strong> {bloqueo} Restaura los créditos originales
          (ver el archivo LICENSE) para volver a usar el compilador.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[540px] auto-rows-fr">
        <EditorCodigo codigo={codigo} onChange={actualizarCodigo} />
        <PanelLexico lineas={lineasAnalizadas} />
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={compilar}
          disabled={bloqueo !== null}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed"
        >
          Compilar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[420px] auto-rows-fr mt-4">
        <PanelSintactico resultado={resultadoSintactico} />
        <PanelSemantico resultado={resultadoSemantico} seEjecuto={seCompilo} />
      </div>

      <div className="h-[320px] mt-4">
        <PanelCodigoIntermedio instrucciones={codigoIntermedio} seEjecuto={seCompilo} />
      </div>
      <PieAutoria />
    </main>
  );
}