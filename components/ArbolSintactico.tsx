"use client";

import { NodoAST } from "@/lib/parser";

const ETIQUETAS_REGLA: Record<string, string> = {
  programa: "Programa",
  declaracion: "Declaración",
  declaracion_inferida: "Declaración (tipo inferido)",
  declarador: "Declarador",
  asignacion: "Asignación",
  sentencia_if: "Sentencia if",
  sentencia_while: "Sentencia while",
  bloque: "Bloque { }",
  llamada: "Llamada a función",
  operacion: "Operación",
  indice: "Índice [ ]",
  acceso_arreglo: "Acceso a arreglo",
  identificador: "id",
  cadena: "cadena",
  numero_entero: "entero",
  numero_decimal: "decimal",
  token: "token",
};

function NodoArbol({ nodo, nivel = 0 }: { nodo: NodoAST; nivel?: number }) {
  const etiqueta = ETIQUETAS_REGLA[nodo.tipo] ?? nodo.tipo;
  const esHoja = !nodo.hijos || nodo.hijos.length === 0;

  return (
    <div className={nivel > 0 ? "ml-4 border-l border-slate-200 pl-3" : ""}>
      <div className="flex items-center gap-2 py-0.5">
        <span
          className={`text-xs font-semibold ${esHoja ? "text-blue-700" : "text-slate-700"}`}
        >
          {etiqueta}
        </span>
        {nodo.valor !== undefined && (
          <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
            {nodo.valor}
          </span>
        )}
      </div>
      {nodo.hijos?.map((hijo, i) => (
        <NodoArbol key={i} nodo={hijo} nivel={nivel + 1} />
      ))}
    </div>
  );
}

export default function ArbolSintactico({ arbol }: { arbol: NodoAST }) {
  return <NodoArbol nodo={arbol} />;
}
