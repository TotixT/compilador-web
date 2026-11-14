"use client";

import { InstruccionTAC } from "@/lib/codigoIntermedio";

interface Props {
  instrucciones: InstruccionTAC[] | null;
  seEjecuto: boolean;
}

export default function PanelCodigoIntermedio({ instrucciones, seEjecuto }: Props) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="bg-slate-800 text-slate-100 px-4 py-2 text-sm font-semibold rounded-t-lg">
        5. Generación de código intermedio
      </div>
      <div className="flex-1 min-h-0 overflow-auto border border-t-0 border-slate-300 rounded-b-lg p-3 bg-white">
        {!seEjecuto && (
          <p className="text-slate-400 text-sm italic">
            Corre después de que el léxico, el sintáctico y el semántico sean
            válidos. Presiona &quot;Compilar&quot;.
          </p>
        )}

        {seEjecuto && !instrucciones && (
          <div className="text-sm font-semibold px-3 py-2 rounded border bg-amber-50 text-amber-700 border-amber-300">
            No se pudo generar: corrige antes los errores semánticos.
          </div>
        )}

        {seEjecuto && instrucciones && instrucciones.length === 0 && (
          <p className="text-slate-400 text-sm italic">
            El programa no tiene sentencias ejecutables (solo declaraciones),
            así que no se generó código de tres direcciones.
          </p>
        )}

        {seEjecuto && instrucciones && instrucciones.length > 0 && (
          <table className="w-full text-sm font-mono text-slate-800">
            <tbody>
              {instrucciones.map((inst) => (
                <tr key={inst.numero} className="odd:bg-white even:bg-slate-50">
                  <td className="px-2 py-0.5 text-slate-400 text-right align-top select-none w-10">
                    {inst.numero}
                  </td>
                  <td className="px-2 py-0.5 text-purple-700 font-semibold align-top w-16">
                    {inst.etiqueta ? `${inst.etiqueta}:` : ""}
                  </td>
                  <td className="px-2 py-0.5 align-top whitespace-pre">{inst.texto}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
