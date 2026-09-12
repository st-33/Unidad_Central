import React, { useState } from 'react';
import type { DispositivoVinculado } from '../tipos';

interface ModalPreautorizarDispositivoProps {
  idNegocio: string;
  nombreNegocio: string;
  onCerrar: () => void;
  onGuardar: (dispositivo: DispositivoVinculado) => Promise<void>;
}

export const ModalPreautorizarDispositivo: React.FC<ModalPreautorizarDispositivoProps> = ({
  nombreNegocio,
  onCerrar,
  onGuardar,
}) => {
  const [deviceId, setDeviceId] = useState('');
  const [alias, setAlias] = useState('');
  const [brand, setBrand] = useState('Navegador Web / Expo');
  const [model, setModel] = useState('Chrome / Edge / Safari');
  const [rol, setRol] = useState<'admin' | 'cocina' | 'mesero'>('cocina');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generarIdWeb = () => {
    const sufijo = Math.random().toString(36).substring(2, 8).toUpperCase();
    const stamp = Date.now();
    setDeviceId(`ADI-WEB-${sufijo}-${stamp}`);
    if (!alias) {
      setAlias(`Terminal Web ${sufijo}`);
    }
  };

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    const idLimpio = deviceId.trim();
    if (!idLimpio) {
      setError('El ID de dispositivo es requerido (ej. ADI-unknown-... o ADI-WEB-...)');
      return;
    }

    setGuardando(true);
    setError(null);

    try {
      const nuevoDispositivo: DispositivoVinculado = {
        deviceId: idLimpio,
        alias: alias.trim() || 'Dispositivo Autorizado',
        estado: 'activo',
        brand: brand.trim(),
        model: model.trim(),
        systemName: 'Web/Expo Runtime',
        systemVersion: '1.0',
        isEmulator: false,
        nivelOperativo: rol === 'admin' ? 'administrador' : 'operador',
        puedeCambiarRol: true,
        rolesPermitidos: {
          admin: rol === 'admin',
          cocina: rol === 'cocina' || rol === 'admin',
          mesero: rol === 'mesero' || rol === 'admin',
        },
      };

      await onGuardar(nuevoDispositivo);
      onCerrar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al autorizar dispositivo');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div
      id="modal-preautorizar-dispositivo"
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-slate-200">
        <div className="flex justify-between items-start border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Pre-Autorizar Dispositivo
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Negocio: <span className="text-blue-400 font-bold">{nombreNegocio}</span>
            </p>
          </div>
          <button
            id="boton-cerrar-modal-preautorizar"
            type="button"
            onClick={onCerrar}
            className="text-slate-400 hover:text-white p-1 rounded-lg text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        {error ? (
          <div className="bg-red-950/60 border border-red-800 text-red-300 px-3 py-2 rounded-lg text-xs">
            {error}
          </div>
        ) : null}

        <form onSubmit={manejarEnvio} className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="input-device-id" className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                Device ID (ADI)
              </label>
              <button
                id="boton-generar-id-web"
                type="button"
                onClick={generarIdWeb}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer underline"
              >
                + Generar ID Web
              </button>
            </div>
            <input
              id="input-device-id"
              type="text"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              placeholder="Ej. ADI-unknown-ZPUM872O-1787737475942 o ADI-WEB-..."
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2.5 font-mono text-xs focus:outline-none focus:border-blue-500"
              required
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Pega aquí el DeviceId que reporta el navegador o terminal en la consola.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="input-alias-dispositivo" className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">
                Alias Descriptivo
              </label>
              <input
                id="input-alias-dispositivo"
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="Ej. Tablet Barra / Cocina"
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="select-rol-dispositivo" className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">
                Rol Operativo Asignado
              </label>
              <select
                id="select-rol-dispositivo"
                value={rol}
                onChange={(e) => setRol(e.target.value as 'admin' | 'cocina' | 'mesero')}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 font-bold"
              >
                <option value="cocina">Cocina</option>
                <option value="mesero">Mesero</option>
                <option value="admin">Administrador / Caja</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="input-brand-dispositivo" className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">
                Plataforma / Marca
              </label>
              <input
                id="input-brand-dispositivo"
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Google Chrome / Android / unknown"
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="input-model-dispositivo" className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">
                Modelo / Entorno
              </label>
              <input
                id="input-model-dispositivo"
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="PC Browser / Expo Web"
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3 border-t border-slate-800">
            <button
              id="boton-cancelar-preautorizacion"
              type="button"
              onClick={onCerrar}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              id="boton-confirmar-preautorizacion"
              type="submit"
              disabled={guardando}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
            >
              {guardando ? 'Autorizando...' : 'Autorizar en RTDB'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
