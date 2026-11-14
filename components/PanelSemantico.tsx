"use client";

import { ResultadoSemantico } from "@/lib/semantico";

interface Props {
  resultado: ResultadoSemantico | null;
  seEjecuto: boolean; // false si nunca llegó a correr (ej: falló el sintáctico antes)
}

export default function PanelSemantico({ resultado, seEjecuto }: Props) {
  const simbolos = resultado ? resultado.tablaSimbolos.listar() : [];

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="bg-slate-800 text-slate-100 px-4 py-2 text-sm font-semibold rounded-t-lg">
        4. Análisis semántico
      </div>
      <div className="flex-1 min-h-0 overflow-auto border border-t-0 border-slate-300 rounded-b-lg p-3 bg-white space-y-2">
        {!seEjecuto && (
          <p className="text-slate-400 text-sm italic">
            El análisis semántico corre después de que el sintáctico sea
            válido. Presiona &quot;Compilar&quot;.
          </p>
        )}

        {seEjecuto && !resultado && (
          <div className="text-sm font-semibold px-3 py-2 rounded border bg-amber-50 text-amber-700 border-amber-300">
            No se pudo continuar: primero corrige los errores de sintaxis.
          </div>
        )}

        {seEjecuto && resultado && (
          <>
            <div
              className={`text-sm font-semibold px-3 py-2 rounded border ${
                resultado.valido
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                  : "bg-red-50 text-red-700 border-red-300"
              }`}
            >
              {resultado.valido
                ? resultado.hallazgos.length > 0
                  ? "Válido, con advertencias"
                  : "Tipos y usos correctos"
                : `Se encontraron ${resultado.hallazgos.filter((h) => h.severidad === "error").length} error(es) semántico(s)`}
            </div>

            {resultado.hallazgos.length === 0 && (
              <p className="text-slate-400 text-xs italic">
                No hay observaciones semánticas.
              </p>
            )}

            {resultado.hallazgos.map((h, i) => (
              <div
                key={i}
                className={`text-xs rounded px-2 py-1 border ${
                  h.severidad === "error"
                    ? "bg-red-50 border-red-200 text-red-700"
                    : "bg-amber-50 border-amber-200 text-amber-700"
                }`}
              >
                <span className="font-semibold uppercase mr-1">
                  {h.severidad === "error" ? "Error" : "Advertencia"}
                </span>
                Línea {h.linea}
                {h.columna > 0 ? `, columna ${h.columna}` : ""}: {h.mensaje}
              </div>
            ))}

            {simbolos.length > 0 && (
              <div className="pt-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-1">
                  Tabla de símbolos
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border border-slate-200 text-slate-800">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr>
                        {["N°", "Nombre", "Dirección", "Tipo", "Valor", "Línea decl.", "Líneas ref.", "Ámbito"].map(
                          (titulo) => (
                            <th
                              key={titulo}
                              className="text-left px-2 py-1 border-b border-slate-200 font-semibold whitespace-nowrap"
                            >
                              {titulo}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {simbolos.map((s) => (
                        <tr key={s.numero} className="odd:bg-white even:bg-slate-50">
                          <td className="px-2 py-1">{s.numero}</td>
                          <td className="px-2 py-1 font-mono">{s.nombre}</td>
                          <td className="px-2 py-1 font-mono">{s.direccion}</td>
                          <td className="px-2 py-1 whitespace-nowrap">
                            {s.esConstante ? "const " : ""}
                            {s.esArreglo ? `${s.tipoDato}[${s.tamanoArreglo}]` : s.tipoDato}
                          </td>
                          <td className="px-2 py-1 font-mono">{s.valor ?? "-"}</td>
                          <td className="px-2 py-1">{s.lineaDeclaracion}</td>
                          <td className="px-2 py-1">
                            {s.lineasReferenciadas.length > 0 ? s.lineasReferenciadas.join(", ") : "-"}
                          </td>
                          <td className="px-2 py-1 whitespace-nowrap">{s.ambito}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
