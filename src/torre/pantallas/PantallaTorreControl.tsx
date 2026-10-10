import React, { useState, useEffect, useCallback } from 'react';
import { servicioTorreControl } from '../logica/servicio-torre';
import type { NegocioRTDB, DatosFichaNegocio } from '../tipos';
import { ModalNuevaCategoria } from '../componentes/ModalNuevaCategoria';
import { FormularioCrearNegocio } from '../componentes/FormularioCrearNegocio';
import { PanelFichaNegocio } from '../componentes/PanelFichaNegocio';
import { DirectorioNegocios, type PestanaPrincipalTorre } from '../componentes/DirectorioNegocios';

export const PantallaTorreControl: React.FC = () => {
  const [pantallaActual, setPantallaActual] = useState<PestanaPrincipalTorre | 'PANEL_NEGOCIO' | 'CREAR_NEGOCIO'>('DIRECTORIO');
  const [categoriaActiva, setCategoriaActiva] = useState<string>('Marisquerias');
  const [categoriasDisponibles, setCategoriasDisponibles] = useState<readonly string[]>(['Marisquerias']);
  const [modalNuevaCategoria, setModalNuevaCategoria] = useState<boolean>(false);

  const [negocios, setNegocios] = useState<readonly NegocioRTDB[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [guardando, setGuardando] = useState<boolean>(false);
  const [armonizandoGlobal, setArmonizandoGlobal] = useState<boolean>(false);
  const [negocioSeleccionado, setNegocioSeleccionado] = useState<NegocioRTDB | null>(null);

  // Toast Notificación
  const [toast, setToast] = useState<{ tipo: 'exito' | 'error'; mensaje: string } | null>(null);

  const mostrarNotificacion = useCallback((mensaje: string, tipo: 'exito' | 'error' = 'exito') => {
    setToast({ tipo, mensaje });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  const refrescarCategorias = useCallback(async () => {
    const cats = await servicioTorreControl.listarCategorias();
    setCategoriasDisponibles(cats);
  }, []);

  useEffect(() => {
    setCargando(true);
    refrescarCategorias();

    const cancelarSuscripcion = servicioTorreControl.suscribirNegociosPorCategoria(
      categoriaActiva,
      (lista) => {
        setNegocios(lista);
        setCargando(false);
      }
    );

    return () => {
      cancelarSuscripcion();
    };
  }, [categoriaActiva, refrescarCategorias]);

  const abrirPanelNegocio = (negocio: NegocioRTDB) => {
    setNegocioSeleccionado(negocio);
    setPantallaActual('PANEL_NEGOCIO');
  };

  const abrirCrearNegocio = () => {
    setNegocioSeleccionado(null);
    setPantallaActual('CREAR_NEGOCIO');
  };

  const volverAlDirectorio = () => {
    setPantallaActual('DIRECTORIO');
    setNegocioSeleccionado(null);
  };

  const agregarNuevaCategoria = async (nombreCategoria: string, rtdbUrl?: string) => {
    try {
      const res = await servicioTorreControl.registrarCategoria(nombreCategoria, rtdbUrl);
      if (res.exito) {
        setModalNuevaCategoria(false);
        await refrescarCategorias();
        setCategoriaActiva(res.categoria);
        mostrarNotificacion(res.mensaje, 'exito');
      } else {
        mostrarNotificacion(res.mensaje, 'error');
      }
    } catch {
      mostrarNotificacion('Error al registrar la categoría en RTDB', 'error');
    }
  };

  const guardarNuevoNegocio = async (datos: DatosFichaNegocio) => {
    setGuardando(true);
    try {
      const res = await servicioTorreControl.registrarOActualizarNegocio(
        datos,
        undefined,
        undefined,
        datos.categoria
      );

      if (res.exito) {
        mostrarNotificacion(res.mensaje, 'exito');
        setCategoriaActiva(datos.categoria);
        volverAlDirectorio();
      } else {
        mostrarNotificacion(res.mensaje, 'error');
      }
    } catch (e: unknown) {
      const err = e as Error;
      mostrarNotificacion(err?.message || 'Error al guardar en RTDB', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const actualizarNegocioExistente = async (idNegocio: string, datos: DatosFichaNegocio) => {
    if (!negocioSeleccionado) return;
    setGuardando(true);
    try {
      const res = await servicioTorreControl.registrarOActualizarNegocio(
        datos,
        idNegocio,
        negocioSeleccionado.codigo,
        negocioSeleccionado.categoria
      );

      if (res.exito) {
        mostrarNotificacion(res.mensaje, 'exito');
        setNegocioSeleccionado({
          ...negocioSeleccionado,
          ...datos,
          id: idNegocio,
        });
        if (datos.categoria !== categoriaActiva) {
          setCategoriaActiva(datos.categoria);
        }
      } else {
        mostrarNotificacion(res.mensaje, 'error');
      }
    } catch (e: unknown) {
      const err = e as Error;
      mostrarNotificacion(err?.message || 'Error al actualizar en RTDB', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const eliminarNegocio = async (categoria: string, id: string, codigo: string) => {
    const confirmacion = window.confirm(
      `¿Confirmas retirar este negocio de la matriz?\nSe eliminará de /${categoria}/${id} y se liberará el código /codigo_acceso/${codigo}.`
    );
    if (!confirmacion) return;

    setGuardando(true);
    try {
      const res = await servicioTorreControl.eliminarNegocio(categoria, id, codigo);
      if (res.exito) {
        mostrarNotificacion(res.mensaje, 'exito');
        volverAlDirectorio();
      } else {
        mostrarNotificacion(res.mensaje, 'error');
      }
    } catch (e: unknown) {
      const err = e as Error;
      mostrarNotificacion(err?.message || 'Error al retirar el negocio de RTDB', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const forzarSincronizacionCentral = async (idNegocio: string) => {
    if (!negocioSeleccionado) return;
    setGuardando(true);
    try {
      const datos: DatosFichaNegocio = {
        nombre: negocioSeleccionado.nombre,
        categoria: negocioSeleccionado.categoria || categoriaActiva,
        activo: negocioSeleccionado.activo,
        codigo: negocioSeleccionado.codigo,
        limite: negocioSeleccionado.limite,
        bloqueados: negocioSeleccionado.bloqueados || {},
        perfiles: negocioSeleccionado.perfiles || [],
        direccion: negocioSeleccionado.direccion || '',
        instagram: negocioSeleccionado.instagram || '',
        facebook: negocioSeleccionado.facebook || '',
        whatsapp: negocioSeleccionado.whatsapp || '',
        celular: negocioSeleccionado.celular || '',
        correo: negocioSeleccionado.correo || '',
      };

      const res = await servicioTorreControl.registrarOActualizarNegocio(
        datos,
        idNegocio,
        negocioSeleccionado.codigo,
        negocioSeleccionado.categoria
      );

      if (res.exito) {
        mostrarNotificacion('Sincronización forzada con Unidad Central exitosa', 'exito');
      } else {
        mostrarNotificacion(res.mensaje, 'error');
      }
    } catch (e: unknown) {
      const err = e as Error;
      mostrarNotificacion(err?.message || 'Error en sincronización central', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const ejecutarArmonizacionGlobal = async () => {
    setArmonizandoGlobal(true);
    try {
      const res = await servicioTorreControl.consolidarContratoCodigoAcceso();
      if (res.exito) {
        mostrarNotificacion(res.mensaje, 'exito');
      } else {
        mostrarNotificacion(res.mensaje, 'error');
      }
    } catch (e: unknown) {
      const err = e as Error;
      mostrarNotificacion(err?.message || 'Error al consolidar contrato único', 'error');
    } finally {
      setArmonizandoGlobal(false);
    }
  };

  // Render según vista activa
  if (pantallaActual === 'CREAR_NEGOCIO') {
    return (
      <>
        <FormularioCrearNegocio
          categoriaInicial={categoriaActiva}
          categoriasDisponibles={categoriasDisponibles}
          guardando={guardando}
          onVolver={volverAlDirectorio}
          onGuardar={guardarNuevoNegocio}
          onNotificar={mostrarNotificacion}
        />
        {toast && (
          <div
            id="toast-notificacion-crear"
            className={`fixed bottom-6 right-6 ${
              toast.tipo === 'exito' ? 'bg-emerald-950 border-emerald-700 text-emerald-200' : 'bg-red-950 border-red-700 text-red-200'
            } border px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50`}
          >
            <span>{toast.tipo === 'exito' ? '✓' : '⚠'}</span>
            <span className="text-sm font-semibold">{toast.mensaje}</span>
          </div>
        )}
      </>
    );
  }

  if (pantallaActual === 'PANEL_NEGOCIO' && negocioSeleccionado) {
    return (
      <>
        <PanelFichaNegocio
          negocio={negocioSeleccionado}
          categoriasDisponibles={categoriasDisponibles}
          guardando={guardando}
          onVolver={volverAlDirectorio}
          onActualizar={actualizarNegocioExistente}
          onEliminar={eliminarNegocio}
          onForzarSincronizacionCentral={forzarSincronizacionCentral}
          onNotificar={mostrarNotificacion}
        />
        {toast && (
          <div
            id="toast-notificacion-panel"
            className={`fixed bottom-6 right-6 ${
              toast.tipo === 'exito' ? 'bg-emerald-950 border-emerald-700 text-emerald-200' : 'bg-red-950 border-red-700 text-red-200'
            } border px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50`}
          >
            <span>{toast.tipo === 'exito' ? '✓' : '⚠'}</span>
            <span className="text-sm font-semibold">{toast.mensaje}</span>
          </div>
        )}
      </>
    );
  }

  return (
    <div id="pantalla-torre-control" className="min-h-screen bg-slate-950 text-slate-200 font-sans p-4 md:p-8 relative">
      <DirectorioNegocios
        pantallaActual={
          pantallaActual === 'PANEL_NEGOCIO' ? 'DIRECTORIO' : pantallaActual
        }
        onCambiarPantalla={(p) => setPantallaActual(p)}
        categoriaActiva={categoriaActiva}
        categoriasDisponibles={categoriasDisponibles}
        negocios={negocios}
        cargando={cargando}
        armonizandoGlobal={armonizandoGlobal}
        onCambiarCategoria={(cat: string) => setCategoriaActiva(cat)}
        onAbrirModalNuevaCategoria={() => setModalNuevaCategoria(true)}
        onSeleccionarNegocio={abrirPanelNegocio}
        onAbrirCrearNegocio={abrirCrearNegocio}
        onEjecutarArmonizacionGlobal={ejecutarArmonizacionGlobal}
      />

      {modalNuevaCategoria && (
        <ModalNuevaCategoria
          onCerrar={() => setModalNuevaCategoria(false)}
          onCrear={agregarNuevaCategoria}
        />
      )}

      {toast && (
        <div
          id="toast-notificacion"
          className={`fixed bottom-6 right-6 ${
            toast.tipo === 'exito' ? 'bg-emerald-950 border-emerald-700 text-emerald-200' : 'bg-red-950 border-red-700 text-red-200'
          } border px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50`}
        >
          <span>{toast.tipo === 'exito' ? '✓' : '⚠'}</span>
          <span className="text-sm font-semibold">{toast.mensaje}</span>
        </div>
      )}
    </div>
  );
};
