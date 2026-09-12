import React, { useState } from 'react';

interface PropsModalNuevaCategoria {
  onCerrar: () => void;
  onCrear: (nombreCategoria: string) => void;
}

export const ModalNuevaCategoria: React.FC<PropsModalNuevaCategoria> = ({
  onCerrar,
  onCrear,
}) => {
  const [texto, setTexto] = useState('');

  const handleConfirmar = () => {
    const trimmed = texto.trim();
    if (!trimmed) return;
    onCrear(trimmed);
  };

  return (
    <div
      id="modal-crear-categoria"
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
    >
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-sm w-full shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-2">Nueva Categoría</h3>
        <p className="text-xs text-slate-400 mb-4">
          Se creará el nodo principal de categoría para organizar sus negocios.
        </p>
        <input
          id="input-nombre-nueva-categoria"
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleConfirmar();
            if (e.key === 'Escape') onCerrar();
          }}
          placeholder="Ej. Taquerias, Pescaderias"
          className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 mb-4"
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <button
            id="boton-cancelar-nueva-categoria"
            type="button"
            onClick={onCerrar}
            className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            id="boton-confirmar-nueva-categoria"
            type="button"
            onClick={handleConfirmar}
            disabled={!texto.trim()}
            className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors"
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
};
