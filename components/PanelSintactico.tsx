"use client";

import { ResultadoParser } from "@/lib/parser";
import ArbolSintactico from "./ArbolSintactico";

interface Props {
  resultado: ResultadoParser | null;
}

export default function PanelSintactico({ resultado }: Props) {
  return (
    <div className="flex flex-col h-full">
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
                : `Se encontraron ${resultado.errores.length} error(es) de sintaxis`}
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

            {resultado.tablaSimbolos.listar().length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-1">
                  Tabla de símbolos
                </h3>
                <table className="w-full text-xs border border-slate-200 text-slate-800">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="text-left px-2 py-1 border-b border-slate-200 font-semibold">Nombre</th>
                      <th className="text-left px-2 py-1 border-b border-slate-200 font-semibold">Tipo</th>
                      <th className="text-left px-2 py-1 border-b border-slate-200 font-semibold">Arreglo</th>
                      <th className="text-left px-2 py-1 border-b border-slate-200 font-semibold">Línea</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-800">
                    {resultado.tablaSimbolos.listar().map((simbolo) => (
                      <tr key={simbolo.nombre} className="odd:bg-white even:bg-slate-50">
                        <td className="px-2 py-1 font-mono">{simbolo.nombre}</td>
                        <td className="px-2 py-1">{simbolo.tipoDato}</td>
                        <td className="px-2 py-1">
                          {simbolo.esArreglo ? `sí [${simbolo.tamanoArreglo}]` : "no"}
                        </td>
                        <td className="px-2 py-1">{simbolo.lineaDeclaracion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
