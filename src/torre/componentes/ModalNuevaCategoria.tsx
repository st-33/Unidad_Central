import React, { useState } from 'react';
import { sanitizarNombreCategoria } from '../logica/generador-clave';
import { URL_RTDB_NEGOCIOS } from '../persistencia/conexion-rtdb';

interface PropsModalNuevaCategoria {
  onCerrar: () => void;
  onCrear: (nombreCategoria: string, rtdbUrl?: string) => void;
}

export const ModalNuevaCategoria: React.FC<PropsModalNuevaCategoria> = ({
  onCerrar,
  onCrear,
}) => {
  const [nombre, setNombre] = useState('');
  const [rtdbUrl, setRtdbUrl] = useState(URL_RTDB_NEGOCIOS);

  const nombreSanitizado = sanitizarNombreCategoria(nombre);

  const handleConfirmar = () => {
    if (!nombreSanitizado) return;
    onCrear(nombreSanitizado, rtdbUrl.trim() || URL_RTDB_NEGOCIOS);
  };

  return (
    <div
      id="modal-crear-categoria"
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    >
      <div className="bg-slate-900 border border-slate-700/80 p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
        <div>
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            Agregar una Categoría
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Escribe en la URL de la RTDB un nodo padre a nivel raíz. El nombre se guardará exactamente con las mayúsculas y minúsculas introducidas (sin acentos).
          </p>
        </div>

        <div>
          <label htmlFor="input-nombre-nueva-categoria" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
            Nombre de la Categoría [categoria_nombre_id]
          </label>
          <input
            id="input-nombre-nueva-categoria"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirmar();
              if (e.key === 'Escape') onCerrar();
            }}
            placeholder="Ej. Marisquerias, Pizzerias, Taquerias"
            className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-500 font-bold"
            autoFocus
          />
          {nombreSanitizado && (
            <p className="text-[11px] text-cyan-400 mt-1 font-mono">
              Nodo raíz resultante: <span className="font-bold">/{nombreSanitizado}</span>
            </p>
          )}
        </div>

        <div>
          <label htmlFor="input-url-rtdb-categoria" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
            RTDB-URL [url_de_la_DB]
          </label>
          <input
            id="input-url-rtdb-categoria"
            type="text"
            value={rtdbUrl}
            onChange={(e) => setRtdbUrl(e.target.value)}
            placeholder="https://instancia.firebaseio.com"
            className="w-full bg-slate-950 border border-slate-700 text-slate-300 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-cyan-500"
          />
          <p className="text-[10px] text-slate-500 mt-1">
            Por defecto utiliza el cluster operativo de categorías de AdiApp.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            id="boton-cancelar-nueva-categoria"
            type="button"
            onClick={onCerrar}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            id="boton-confirmar-nueva-categoria"
            type="button"
            onClick={handleConfirmar}
            disabled={!nombreSanitizado}
            className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-bold px-5 py-2.5 rounded-lg cursor-pointer transition-colors shadow-lg shadow-cyan-600/20"
          >
            Registrar Nodo Raíz
          </button>
        </div>
      </div>
    </div>
  );
};

