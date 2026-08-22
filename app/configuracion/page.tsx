"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ConfiguracionLexica, EntradaTabla1 } from "@/lib/configuracionLexica";
import {
  cargarConfiguracion,
  guardarConfiguracion,
  restablecerConfiguracion,
} from "@/lib/almacenConfiguracion";
import { TokenCategory, ETIQUETAS_CATEGORIA } from "@/lib/types";

const CATEGORIAS_DISPONIBLES: TokenCategory[] = [
  "palabra_reservada",
  "operador_aritmetico",
  "operador_relacional",
  "operador_logico",
  "asignacion",
  "delimitador",
  "acceso_miembro",
];

export default function ConfiguracionPage() {
  const [config, setConfig] = useState<ConfiguracionLexica | null>(null);
  const [guardadoOk, setGuardadoOk] = useState(false);
  const [pestañaActiva, setPestañaActiva] = useState<"tabla1" | "tabla2">("tabla1");

  useEffect(() => {
    setConfig(cargarConfiguracion());
  }, []);

  if (!config) {
    return <main className="p-6 text-slate-500">Cargando configuración…</main>;
  }

  function actualizarTraduccionTabla1(id: string, valor: string) {
    setConfig((prev) =>
      prev
        ? { ...prev, tabla1: prev.tabla1.map((e) => (e.id === id ? { ...e, traduccion: valor } : e)) }
        : prev
    );
    setGuardadoOk(false);
  }

  function actualizarTraduccionTabla2(codigoAscii: number, valor: string) {
    setConfig((prev) =>
      prev
        ? {
            ...prev,
            tabla2: prev.tabla2.map((e) =>
              e.codigoAscii === codigoAscii ? { ...e, traduccion: valor } : e
            ),
          }
        : prev
    );
    setGuardadoOk(false);
  }

  function agregarFilaTabla1() {
    const nueva: EntradaTabla1 = {
      id: `custom-${Date.now()}`,
      patron: "",
      categoria: "operador_aritmetico",
      traduccion: "",
      personalizada: true,
    };
    setConfig((prev) => (prev ? { ...prev, tabla1: [...prev.tabla1, nueva] } : prev));
    setGuardadoOk(false);
  }

  function actualizarFilaPersonalizada(id: string, campo: "patron" | "categoria" | "traduccion", valor: string) {
    setConfig((prev) =>
      prev
        ? {
            ...prev,
            tabla1: prev.tabla1.map((e) => (e.id === id ? { ...e, [campo]: valor } : e)),
          }
        : prev
    );
    setGuardadoOk(false);
  }

  function eliminarFilaPersonalizada(id: string) {
    setConfig((prev) => (prev ? { ...prev, tabla1: prev.tabla1.filter((e) => e.id !== id) } : prev));
    setGuardadoOk(false);
  }

  function guardar() {
    if (!config) return;
    guardarConfiguracion(config);
    setGuardadoOk(true);
  }

  function restablecer() {
    const porDefecto = restablecerConfiguracion();
    setConfig(porDefecto);
    setGuardadoOk(false);
  }

  const tabla1Defecto = config.tabla1.filter((e) => !e.personalizada);
  const tabla1Personalizada = config.tabla1.filter((e) => e.personalizada);

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Configuración léxica</h1>
          <p className="text-slate-500 text-sm">
            Cambia cómo se traducen los símbolos que reconoce el análisis léxico.
            Los cambios se guardan en tu navegador.
          </p>
        </div>
        <Link
          href="/"
          className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
        >
          ← Volver al compilador
        </Link>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={guardar}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold"
        >
          Guardar cambios
        </button>
        <button
          onClick={restablecer}
          className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold"
        >
          Restablecer todo a valores por defecto
        </button>
        {guardadoOk && (
          <span className="text-emerald-600 text-sm font-semibold self-center">
            Guardado ✓
          </span>
        )}
      </div>

      <div className="flex gap-2 mb-4 border-b border-slate-200">
        <button
          onClick={() => setPestañaActiva("tabla1")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px ${
            pestañaActiva === "tabla1"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Tabla 1 · Palabras y símbolos
        </button>
        <button
          onClick={() => setPestañaActiva("tabla2")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px ${
            pestañaActiva === "tabla2"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Tabla 2 · Caracteres ASCII
        </button>
      </div>

      {/* TABLA 1 */}
      {pestañaActiva === "tabla1" && (
      <section className="bg-white border border-slate-200 rounded-lg p-4 mb-6">
        <h2 className="font-bold text-slate-800 mb-1">
          Tabla 1 — Palabras reservadas, operadores y delimitadores
        </h2>
        <p className="text-xs text-slate-500 mb-3">
          El código/símbolo de las filas del sistema no se puede editar (el
          analizador sintáctico depende de reconocerlos exactamente), pero sí
          puedes renombrar su traducción. También puedes agregar filas nuevas
          con tu propio símbolo.
        </p>

        <table className="w-full text-sm text-slate-800">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="text-left px-2 py-1.5 border-b border-slate-200">
                Código / símbolo objetivo
              </th>
              <th className="text-left px-2 py-1.5 border-b border-slate-200">Categoría</th>
              <th className="text-left px-2 py-1.5 border-b border-slate-200">
                Traducción (editable)
              </th>
            </tr>
          </thead>
          <tbody>
            {tabla1Defecto.map((e) => (
              <tr key={e.id} className="odd:bg-white even:bg-slate-50">
                <td className="px-2 py-1 font-mono">
                  <input
                    value={e.patron}
                    disabled
                    className="w-full bg-slate-100 text-slate-400 px-2 py-1 rounded border border-slate-200 cursor-not-allowed"
                  />
                </td>
                <td className="px-2 py-1 text-xs text-slate-500">
                  {ETIQUETAS_CATEGORIA[e.categoria]}
                </td>
                <td className="px-2 py-1">
                  <input
                    value={e.traduccion}
                    onChange={(ev) => actualizarTraduccionTabla1(e.id, ev.target.value)}
                    className="w-full px-2 py-1 rounded border border-slate-300 focus:border-blue-500 focus:outline-none"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3 className="font-semibold text-slate-700 text-sm mt-4 mb-2">
          Filas agregadas por ustedes
        </h3>
        <table className="w-full text-sm text-slate-800">
          <tbody>
            {tabla1Personalizada.length === 0 && (
              <tr>
                <td className="text-slate-400 text-xs italic py-1">
                  Todavía no has agregado ninguna fila personalizada.
                </td>
              </tr>
            )}
            {tabla1Personalizada.map((e) => (
              <tr key={e.id} className="odd:bg-white even:bg-slate-50">
                <td className="px-2 py-1 w-1/4">
                  <input
                    value={e.patron}
                    placeholder="ej: ->"
                    onChange={(ev) => actualizarFilaPersonalizada(e.id, "patron", ev.target.value)}
                    className="w-full font-mono px-2 py-1 rounded border border-slate-300 focus:border-blue-500 focus:outline-none"
                  />
                </td>
                <td className="px-2 py-1 w-1/4">
                  <select
                    value={e.categoria}
                    onChange={(ev) => actualizarFilaPersonalizada(e.id, "categoria", ev.target.value)}
                    className="w-full px-2 py-1 rounded border border-slate-300"
                  >
                    {CATEGORIAS_DISPONIBLES.map((c) => (
                      <option key={c} value={c}>
                        {ETIQUETAS_CATEGORIA[c]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-1">
                  <input
                    value={e.traduccion}
                    placeholder="ej: Flecha de retorno"
                    onChange={(ev) => actualizarFilaPersonalizada(e.id, "traduccion", ev.target.value)}
                    className="w-full px-2 py-1 rounded border border-slate-300 focus:border-blue-500 focus:outline-none"
                  />
                </td>
                <td className="px-2 py-1">
                  <button
                    onClick={() => eliminarFilaPersonalizada(e.id)}
                    className="text-red-600 hover:text-red-700 text-xs font-semibold"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          onClick={agregarFilaTabla1}
          className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-semibold"
        >
          + Agregar fila
        </button>
      </section>
      )}

      {/* TABLA 2 */}
      {pestañaActiva === "tabla2" && (
      <section className="bg-white border border-slate-200 rounded-lg p-4">
        <h2 className="font-bold text-slate-800 mb-1">
          Tabla 2 — Caracteres ASCII sin regla predefinida
        </h2>
        <p className="text-xs text-slate-500 mb-3">
          Están todos los caracteres ASCII imprimibles que no son letra,
          dígito, comilla, ni un símbolo ya protegido en la Tabla 1. Por
          defecto se marcan como &quot;Desconocido&quot;; si les asignas una
          traducción, el análisis léxico los reconocerá con esa etiqueta.
        </p>

        <table className="w-full text-sm text-slate-800">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="text-left px-2 py-1.5 border-b border-slate-200 w-24">ASCII</th>
              <th className="text-left px-2 py-1.5 border-b border-slate-200 w-24">Carácter</th>
              <th className="text-left px-2 py-1.5 border-b border-slate-200">Traducción</th>
            </tr>
          </thead>
          <tbody>
            {config.tabla2.map((e) => (
              <tr key={e.codigoAscii} className="odd:bg-white even:bg-slate-50">
                <td className="px-2 py-1 font-mono">{e.codigoAscii}</td>
                <td className="px-2 py-1 font-mono">{e.caracter}</td>
                <td className="px-2 py-1">
                  <input
                    value={e.traduccion}
                    placeholder="Sin definir (Desconocido)"
                    onChange={(ev) => actualizarTraduccionTabla2(e.codigoAscii, ev.target.value)}
                    className="w-full px-2 py-1 rounded border border-slate-300 focus:border-blue-500 focus:outline-none"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      )}
    </main>
  );
}
