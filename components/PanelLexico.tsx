"use client";

import { LineaAnalizada } from "@/lib/types";
import { ETIQUETAS_CATEGORIA, COLOR_CATEGORIA } from "@/lib/types";

interface Props {
  lineas: LineaAnalizada[];
}

export default function PanelLexico({ lineas }: Props) {
  const lineasConContenido = lineas.filter((l) => l.tokens.length > 0);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="bg-slate-800 text-slate-100 px-4 py-2 text-sm font-semibold rounded-t-lg">
        2. Análisis léxico
      </div>
      <div className="flex-1 min-h-0 overflow-auto border border-t-0 border-slate-300 rounded-b-lg p-3 bg-white space-y-3">
        {lineasConContenido.length === 0 && (
          <p className="text-slate-400 text-sm italic">
            Escribe código en la caja 1. A medida que completes cada línea,
            los tokens aparecerán aquí.
          </p>
        )}

        {lineasConContenido.map((linea) => (
          <div
            key={linea.numeroLinea}
            className="border border-slate-200 rounded-md p-2"
          >
            <div className="text-xs text-slate-400 mb-1">
              Línea {linea.numeroLinea}:{" "}
              <span className="font-mono text-slate-500">
                {linea.texto.trim()}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {linea.tokens.map((token, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col items-center px-2 py-1 rounded border text-xs ${COLOR_CATEGORIA[token.categoria]}`}
                  title={`Columna ${token.columna}`}
                >
                  <span className="font-mono font-semibold">
                    {token.lexema}
                  </span>
                  <span className="text-[10px] opacity-80">
                    {token.etiqueta ?? ETIQUETAS_CATEGORIA[token.categoria]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
