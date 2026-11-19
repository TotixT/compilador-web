// © 2026 Santiago López García y Oscar Julián Mojica Calderón. Ver el archivo LICENSE.
"use client";

import CodeMirror from "@uiw/react-codemirror";
import { cpp } from "@codemirror/lang-cpp";
import { oneDark } from "@codemirror/theme-one-dark";

interface Props {
  codigo: string;
  onChange: (valor: string) => void;
}

export default function EditorCodigo({ codigo, onChange }: Props) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="bg-slate-800 text-slate-100 px-4 py-2 text-sm font-semibold rounded-t-lg">
        1. Programa fuente
      </div>
      <div className="flex-1 overflow-hidden border border-t-0 border-slate-300 rounded-b-lg">
        <CodeMirror
          value={codigo}
          height="500px"
          maxHeight="500px"
          theme={oneDark}
          extensions={[cpp()]}
          onChange={(valor) => onChange(valor)}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLine: true,
            highlightActiveLineGutter: true,
            foldGutter: true,
          }}
        />
      </div>
    </div>
  );
}
