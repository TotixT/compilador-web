// © 2026 Santiago López García y Oscar Julián Mojica Calderón. Ver el archivo LICENSE.
"use client";

import { ResultadoParser } from "@/lib/parser";
import ArbolSintactico from "./ArbolSintactico";

interface Props {
  resultado: ResultadoParser | null;
}

export default function PanelSintactico({ resultado }: Props) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="bg-slate-800 text-slate-100 px-4 py-2 text-sm font-semibold rounded-t-lg">
        3. Análisis sintáctico
      </div>
      <div className="flex-1 min-h-0 overflow-auto border border-t-0 border-slate-300 rounded-b-lg p-3 bg-white space-y-4">
        {!resultado && (
          <p className="text-slate-400 text-sm italic">
            Presiona &quot;Compilar&quot; para analizar el orden de los tokens.
          </p>
        )}

        {resultado && (
          <>
            <div
              className={`text-sm font-semibold px-3 py-2 rounded border ${
                resultado.valido
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                  : "bg-red-50 text-red-700 border-red-300"
              }`}
            >
              {resultado.valido
                ? "El orden de los tokens es válido"
                : `Se encontraron ${resultado.errores.length} error(es) (léxicos o de sintaxis)`}
            </div>

            {resultado.errores.length > 0 && (
              <div className="space-y-1">
                {resultado.errores.map((err, i) => (
                  <div
                    key={i}
                    className="text-xs bg-red-50 border border-red-200 text-red-700 rounded px-2 py-1"
                  >
                    Línea {err.linea}, columna {err.columna}: {err.mensaje}
                  </div>
                ))}
              </div>
            )}

            {resultado.arbol && (
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-1">
                  Árbol sintáctico
                </h3>
                <ArbolSintactico arbol={resultado.arbol} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
