// © 2026 Santiago López García y Oscar Julián Mojica Calderón. Ver el archivo LICENSE.
import { AUTORES } from "@/lib/creditos";
import NombreArcoiris from "@/components/NombreArcoiris";

/** Bloque de autores del encabezado (verificado por lib/creditos.ts). */
export default function EncabezadoAutoria() {
  return (
    <div data-creditos="encabezado" className="flex-1 min-w-[16rem] text-center self-center">
      <p className="text-[11px] uppercase tracking-widest text-slate-400">Autores</p>
      <p className="text-lg leading-snug">
        {AUTORES.map((autor, i) => (
          <span key={autor}>
            {i > 0 && <span className="text-slate-400 mx-2">y</span>}
            <NombreArcoiris texto={autor} />
          </span>
        ))}
      </p>
    </div>
  );
}
