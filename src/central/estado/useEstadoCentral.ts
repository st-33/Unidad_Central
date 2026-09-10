import { useState, useEffect, useCallback, useMemo } from 'react';
import { ServicioCentral, ResumenCentral } from '../logica/servicio-central';
import { observarConexionTiempoReal } from '../../plataforma/firebase';
import type { IdentificadorUnico, ClaveCapacidad, Negocio } from '../../../contratos';
import type { DatosNuevoNegocio } from '../componentes';

export interface EstadoCentral {
  readonly conectadoRtdb: boolean;
  readonly cargando: boolean;
  readonly ejecutandoInicializacion: boolean;
  readonly guardandoCapacidad: boolean;
  readonly creandoNegocio: boolean;
  readonly resumen: ResumenCentral | null;
  readonly negocioSeleccionado: Negocio | null;
  readonly categoriaFiltroId: IdentificadorUnico | null;
  readonly error: string | null;
  readonly mensajeOperacion: string | null;
  readonly recargar: () => Promise<void>;
  readonly inicializar: () => Promise<void>;
  readonly seleccionarNegocio: (id: IdentificadorUnico | null) => void;
  readonly filtrarPorCategoria: (categoriaId: IdentificadorUnico | null) => void;
  readonly cambiarEstadoCapacidad: (claveCapacidad: ClaveCapacidad, activa: boolean) => Promise<void>;
  readonly crearNegocio: (datos: DatosNuevoNegocio) => Promise<boolean>;
}

export function useEstadoCentral(): EstadoCentral {
  const [conectadoRtdb, setConectadoRtdb] = useState<boolean>(false);
  const [cargando, setCargando] = useState<boolean>(true);
  const [ejecutandoInicializacion, setEjecutandoInicializacion] = useState<boolean>(false);
  const [guardandoCapacidad, setGuardandoCapacidad] = useState<boolean>(false);
  const [creandoNegocio, setCreandoNegocio] = useState<boolean>(false);
  const [resumen, setResumen] = useState<ResumenCentral | null>(null);
  const [negocioSeleccionadoId, setNegocioSeleccionadoId] = useState<IdentificadorUnico | null>(null);
  const [categoriaFiltroId, setCategoriaFiltroId] = useState<IdentificadorUnico | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mensajeOperacion, setMensajeOperacion] = useState<string | null>(null);

  const servicio = useMemo(() => new ServicioCentral(), []);

  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    const resultado = await servicio.obtenerResumen();
    if (resultado.exito) {
      setResumen(resultado.datos);
    } else {
      setError(resultado.error.message);
    }
    setCargando(false);
  }, [servicio]);

  const inicializar = useCallback(async () => {
    setEjecutandoInicializacion(true);
    setError(null);
    setMensajeOperacion(null);

    const resultado = await servicio.inicializarEstructuraBase();
    if (resultado.exito) {
      if (resultado.datos.yaInicializado) {
        setMensajeOperacion('La estructura base y los negocios ya se encontraban inicializados.');
      } else {
        setMensajeOperacion(
          `Estructura inicializada: ${resultado.datos.categoriasCreadas} categorías, ${resultado.datos.capacidadesCreadas} capacidades, ${resultado.datos.negociosCreados} negocios.`
        );
      }
      await recargar();
    } else {
      setError(resultado.error.message);
    }

    setEjecutandoInicializacion(false);
  }, [servicio, recargar]);

  const seleccionarNegocio = useCallback((id: IdentificadorUnico | null) => {
    setNegocioSeleccionadoId(id);
    setMensajeOperacion(null);
  }, []);

  const filtrarPorCategoria = useCallback((categoriaId: IdentificadorUnico | null) => {
    setCategoriaFiltroId(categoriaId);
  }, []);

  const negocioSeleccionado = useMemo(() => {
    if (!resumen || !negocioSeleccionadoId) {
      return null;
    }
    return resumen.negocios.find((n) => n.id === negocioSeleccionadoId) ?? null;
  }, [resumen, negocioSeleccionadoId]);

  const crearNegocio = useCallback(
    async (datos: DatosNuevoNegocio): Promise<boolean> => {
      setCreandoNegocio(true);
      setError(null);
      setMensajeOperacion(null);

      try {
        // Crear el negocio con configuración vacía inicialmente
        const nuevoNegocio: Negocio = {
          id: `negocio-${Date.now()}`, // ID temporal, se puede mejorar
          negocio_id: `negocio-${Date.now()}`,
          categoria_id: datos.categoriaId,
          nombre: datos.nombre,
          nombre_comercial: datos.nombreComercial,
          activo: true,
          configuracion: {
            capacidades: {} // Se configurará después según la categoría
          },
          ruta_operativa: `${datos.categoriaId}/${datos.codigoAcceso.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        };

        const resultado = await servicio.registrarNegocio(nuevoNegocio);
        
        if (resultado.exito) {
          setMensajeOperacion(`Negocio "${datos.nombreComercial}" creado exitosamente.`);
          await recargar(); // Recargar para mostrar el nuevo negocio
          setCreandoNegocio(false);
          return true;
        } else {
          setError(resultado.error.message);
          setCreandoNegocio(false);
          return false;
        }
      } catch (err) {
        const mensaje = err instanceof Error ? err.message : 'Error desconocido al crear negocio';
        setError(mensaje);
        setCreandoNegocio(false);
        return false;
      }
    },
    [servicio, recargar]
  );

  const alternarCapacidad = useCallback(
    async (claveCapacidad: ClaveCapacidad, activa: boolean) => {
      if (!negocioSeleccionadoId) {
        return;
      }

      setGuardandoCapacidad(true);
      setError(null);

      const resultado = await servicio.alternarCapacidadNegocio(
        negocioSeleccionadoId,
        claveCapacidad,
        activa
      );

      if (resultado.exito) {
        setMensajeOperacion(
          `Capacidad "${claveCapacidad}" ${activa ? 'activada' : 'desactivada'} para ${resultado.datos.nombre_comercial}.`
        );
        setResumen((prev) => {
          if (!prev) return null;
          const negociosActualizados = prev.negocios.map((n) =>
            n.id === resultado.datos.id ? resultado.datos : n
          );
          return {
            ...prev,
            negocios: negociosActualizados,
          };
        });
      } else {
        setError(resultado.error.message);
      }

      setGuardandoCapacidad(false);
    },
    [servicio, negocioSeleccionadoId]
  );

  useEffect(() => {
    const desuscribir = observarConexionTiempoReal((conectado) => {
      setConectadoRtdb(conectado);
    });

    recargar();

    return () => {
      desuscribir();
    };
  }, [recargar]);

  return {
    conectadoRtdb,
    cargando,
    ejecutandoInicializacion,
    guardandoCapacidad,
    creandoNegocio,
    resumen,
    negocioSeleccionado,
    categoriaFiltroId,
    error,
    mensajeOperacion,
    recargar,
    inicializar,
    seleccionarNegocio,
    filtrarPorCategoria,
    cambiarEstadoCapacidad: alternarCapacidad,
    crearNegocio,
  };
}
