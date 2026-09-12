import React, { useState } from 'react';
import { MODULOS_SISTEMA, type DatosFichaNegocio, type PoliticaDispositivos } from '../tipos';
import { ToggleSwitch } from './ToggleSwitch';

interface PropsFormularioCrearNegocio {
  categoriaInicial: string;
  categoriasDisponibles: readonly string[];
  guardando: boolean;
  onVolver: () => void;
  onGuardar: (datos: DatosFichaNegocio) => Promise<void>;
  onNotificar: (mensaje: string, tipo?: 'exito' | 'error') => void;
}

export const FormularioCrearNegocio: React.FC<PropsFormularioCrearNegocio> = ({
  categoriaInicial,
  categoriasDisponibles,
  guardando,
  onVolver,
  onGuardar,
  onNotificar,
}) => {
  const [formNombre, setFormNombre] = useState('');
  const [formCategoria, setFormCategoria] = useState(categoriaInicial || 'Marisquerias');
  const [formActivo, setFormActivo] = useState(true);
  const [formCodigo, setFormCodigo] = useState('');
  const [formLimite, setFormLimite] = useState('3');
  const [formModulosBloqueados, setFormModulosBloqueados] = useState<Record<string, boolean>>({});
  const [formPerfiles, setFormPerfiles] = useState<string[]>([
    'Administrador',
    'Cajero',
    'Comandero',
    'Cocinero',
  ]);
  const [nuevoPerfilTexto, setNuevoPerfilTexto] = useState('');
  const [formDireccion, setFormDireccion] = useState('');
  const [formInstagram, setFormInstagram] = useState('');
  const [formFacebook, setFormFacebook] = useState('');
  const [formWhatsapp, setFormWhatsapp] = useState('');
  const [formCelular, setFormCelular] = useState('');
  const [formCorreo, setFormCorreo] = useState('');
  const [formPoliticas, setFormPoliticas] = useState<PoliticaDispositivos>({
    permitir_navegador_web: true,
    permitir_dispositivos_genericos: true,
    validar_hardware_estricto: false,
  });

  const alternarBloqueoModulo = (modulo: string) => {
    setFormModulosBloqueados((prev) => ({
      ...prev,
      [modulo]: !prev[modulo],
    }));
  };

  const agregarPerfil = () => {
    const texto = nuevoPerfilTexto.trim();
    if (!texto) return;
    if (formPerfiles.includes(texto)) {
      onNotificar('El perfil ya existe', 'error');
      return;
    }
    setFormPerfiles([...formPerfiles, texto]);
    setNuevoPerfilTexto('');
  };

  const eliminarPerfil = (perfil: string) => {
    setFormPerfiles(formPerfiles.filter((p) => p !== perfil));
  };

  const handleSubmit = async () => {
    if (!formNombre.trim()) {
      onNotificar('El nombre comercial es obligatorio', 'error');
      return;
    }
    if (!formCodigo.trim()) {
      onNotificar('El código de acceso es obligatorio', 'error');
      return;
    }

    const datos: DatosFichaNegocio = {
      nombre: formNombre.trim(),
      categoria: formCategoria.trim() || 'Marisquerias',
      activo: formActivo,
      codigo: formCodigo.trim().toUpperCase().replace(/\s+/g, ''),
      limite: parseInt(formLimite, 10) || 3,
      bloqueados: formModulosBloqueados,
      perfiles: formPerfiles,
      politicas_dispositivos: formPoliticas,
      direccion: formDireccion.trim(),
      instagram: formInstagram.trim(),
      facebook: formFacebook.trim(),
      whatsapp: formWhatsapp.trim(),
      celular: formCelular.trim(),
      correo: formCorreo.trim(),
    };

    await onGuardar(datos);
  };

  return (
    <div id="pantalla-crear-negocio" className="min-h-screen bg-slate-950 text-slate-200 font-sans p-4 md:p-8 relative">
      <div className="max-w-3xl mx-auto pb-24">
        <div className="mb-8">
          <button
            id="boton-cancelar-registro"
            type="button"
            onClick={onVolver}
            className="text-cyan-400 hover:text-cyan-300 font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Cancelar Registro
          </button>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <span className="bg-emerald-500 p-2 rounded-xl text-slate-950">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
            </span>
            FICHA TÉCNICA DE REGISTRO
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Se creará la semilla en <span className="text-cyan-400 font-bold">/{formCategoria}</span> y se indexará en <span className="text-emerald-400 font-bold">/codigo_acceso</span>.
          </p>
        </div>

        <div className="space-y-6">
          {/* IDENTIDAD DEL NEGOCIO */}
          <div id="bloque-identidad-negocio" className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg space-y-4">
            <div className="flex justify-between items-center">
              <label htmlFor="input-nombre-comercial-crear" className="block text-sm font-black text-slate-400 uppercase tracking-wide">
                Nombre Comercial
              </label>
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase font-bold text-slate-400">
                  {formActivo ? 'Operativo' : 'Desactivado'}
                </span>
                <ToggleSwitch
                  id="switch-activo-crear"
                  enabled={formActivo}
                  onChange={() => setFormActivo(!formActivo)}
                  colorActivo="verde"
                />
              </div>
            </div>

            <input
              id="input-nombre-comercial-crear"
              type="text"
              value={formNombre}
              onChange={(e) => setFormNombre(e.target.value)}
              placeholder="Ej. Marisquería Puerto Libres, El Arquitecto"
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-sans font-bold text-lg"
            />
            <p className="text-xs text-slate-500">
              El nombre comercial se guardará exactamente con las mayúsculas y acentos introducidos. El ID técnico (máx 3 caracteres) se genera internamente de forma determinista.
            </p>
          </div>

          {/* SELECCIÓN DE CATEGORÍA */}
          <div id="bloque-categoria-negocio" className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
            <label htmlFor="select-categoria-crear" className="block text-sm font-semibold text-slate-400 mb-2">
              Categoría en Matriz
            </label>
            <select
              id="select-categoria-crear"
              value={formCategoria}
              onChange={(e) => setFormCategoria(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 font-bold"
            >
              {categoriasDisponibles.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* BLOQUE A: ACCESO */}
          <div id="bloque-acceso-crear" className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
              <span className="w-6 h-px bg-slate-700"></span> Bloque A — Acceso
            </h3>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="input-codigo-acceso-crear" className="block text-sm font-semibold text-slate-400 mb-1">
                  Código de Acceso (Único)
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  Clave con la que los terminales de este negocio ingresan a la app.
                </p>
                <input
                  id="input-codigo-acceso-crear"
                  type="text"
                  value={formCodigo}
                  onChange={(e) => setFormCodigo(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                  placeholder="Ej. PL2026-24"
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-500 font-mono uppercase font-bold tracking-wider"
                />
              </div>
              <div>
                <label htmlFor="input-limite-dispositivos-crear" className="block text-sm font-semibold text-slate-400 mb-1">
                  Límite de Dispositivos
                </label>
                <p className="text-xs text-slate-500 mb-2">Cantidad máxima simultánea permitida.</p>
                <input
                  id="input-limite-dispositivos-crear"
                  type="number"
                  min="1"
                  value={formLimite}
                  onChange={(e) => setFormLimite(e.target.value)}
                  placeholder="3"
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>

            {/* Políticas iniciales de dispositivos */}
            <div className="mt-6 pt-4 border-t border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                Políticas de Conexión de Terminales:
              </h4>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formPoliticas.permitir_navegador_web}
                    onChange={(e) =>
                      setFormPoliticas((prev) => ({
                        ...prev,
                        permitir_navegador_web: e.target.checked,
                      }))
                    }
                    className="rounded bg-slate-950 border-slate-700 text-cyan-500"
                  />
                  Permitir Navegador Web (Chrome/Safari)
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formPoliticas.permitir_dispositivos_genericos}
                    onChange={(e) =>
                      setFormPoliticas((prev) => ({
                        ...prev,
                        permitir_dispositivos_genericos: e.target.checked,
                      }))
                    }
                    className="rounded bg-slate-950 border-slate-700 text-cyan-500"
                  />
                  Permitir Genéricos/Expo (brand: unknown)
                </label>
              </div>
            </div>
          </div>

          {/* BLOQUE B: MÓDULOS */}
          <div id="bloque-modulos-crear" className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg border-l-4 border-l-red-500/50">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
              <span className="w-6 h-px bg-slate-700"></span> Bloque B — Módulos
            </h3>
            <p className="text-sm text-slate-400 mb-6 border-b border-slate-800 pb-4">
              Activa el interruptor para <span className="text-red-400 font-bold">BLOQUEAR</span> y excluir el módulo del negocio.
            </p>

            <div className="space-y-4">
              {MODULOS_SISTEMA.map((modulo) => (
                <div
                  key={modulo}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-800/50 transition-colors"
                >
                  <span
                    className={`text-base font-medium ${
                      formModulosBloqueados[modulo] ? 'text-slate-500 line-through' : 'text-slate-200'
                    }`}
                  >
                    {modulo}
                  </span>
                  <ToggleSwitch
                    id={`switch-modulo-${modulo}`}
                    enabled={!!formModulosBloqueados[modulo]}
                    onChange={() => alternarBloqueoModulo(modulo)}
                    colorActivo="rojo"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* BLOQUE C: PERFILES */}
          <div id="bloque-perfiles-crear" className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <span className="w-6 h-px bg-slate-700"></span> Bloque C — Perfiles Operativos
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Roles autorizados para el personal en la aplicación del negocio.
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {formPerfiles.map((perfil) => (
                <div
                  key={perfil}
                  className="bg-slate-950 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm text-slate-300"
                >
                  <span>{perfil}</span>
                  <button
                    type="button"
                    onClick={() => eliminarPerfil(perfil)}
                    className="text-slate-500 hover:text-red-400 font-bold ml-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                id="input-nuevo-perfil-crear"
                type="text"
                value={nuevoPerfilTexto}
                onChange={(e) => setNuevoPerfilTexto(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    agregarPerfil();
                  }
                }}
                placeholder="Nuevo perfil (ej. Supervisor, Mesero)"
                className="flex-1 bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500"
              />
              <button
                id="boton-agregar-perfil-crear"
                type="button"
                onClick={agregarPerfil}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-lg text-sm font-bold cursor-pointer"
              >
                Agregar
              </button>
            </div>
          </div>

          {/* BLOQUE CONTACTO */}
          <div id="bloque-contacto-crear" className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
              <span className="w-6 h-px bg-slate-700"></span> Datos de Contacto
            </h3>
            <p className="text-sm text-slate-400 mb-4">Información interna del establecimiento.</p>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="input-instagram-crear" className="block text-xs font-bold text-slate-400 mb-1">
                  Instagram
                </label>
                <input
                  id="input-instagram-crear"
                  type="text"
                  value={formInstagram}
                  onChange={(e) => setFormInstagram(e.target.value)}
                  placeholder="@puertolibres"
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label htmlFor="input-facebook-crear" className="block text-xs font-bold text-slate-400 mb-1">
                  Facebook
                </label>
                <input
                  id="input-facebook-crear"
                  type="text"
                  value={formFacebook}
                  onChange={(e) => setFormFacebook(e.target.value)}
                  placeholder="puertolibres.oficial"
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label htmlFor="input-whatsapp-crear" className="block text-xs font-bold text-slate-400 mb-1">
                  WhatsApp
                </label>
                <input
                  id="input-whatsapp-crear"
                  type="text"
                  value={formWhatsapp}
                  onChange={(e) => setFormWhatsapp(e.target.value)}
                  placeholder="+52 744 123 4567"
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label htmlFor="input-celular-crear" className="block text-xs font-bold text-slate-400 mb-1">
                  Número celular
                </label>
                <input
                  id="input-celular-crear"
                  type="text"
                  value={formCelular}
                  onChange={(e) => setFormCelular(e.target.value)}
                  placeholder="7441234567"
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="input-correo-crear" className="block text-xs font-bold text-slate-400 mb-1">
                Correo electrónico
              </label>
              <input
                id="input-correo-crear"
                type="email"
                value={formCorreo}
                onChange={(e) => setFormCorreo(e.target.value)}
                placeholder="contacto@puertolibres.com"
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* BLOQUE DIRECCIÓN */}
          <div id="bloque-direccion-crear" className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
              <span className="w-6 h-px bg-slate-700"></span> Dirección
            </h3>
            <input
              id="input-direccion-crear"
              type="text"
              value={formDireccion}
              onChange={(e) => setFormDireccion(e.target.value)}
              placeholder="Calle, número, colonia o referencia física"
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-500 text-sm"
            />
          </div>

          {/* Botón de Enviar a Matriz */}
          <button
            id="boton-registrar-en-matriz"
            type="button"
            onClick={handleSubmit}
            disabled={guardando}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] mt-4 disabled:opacity-50 cursor-pointer text-center"
          >
            {guardando ? 'ESCRIBIENDO EN RTDB MATRIZ...' : 'REGISTRAR EN MATRIZ'}
          </button>
        </div>
      </div>
    </div>
  );
};
