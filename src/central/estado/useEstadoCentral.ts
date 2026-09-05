import { useState, useEffect, useCallback, useMemo } from 'react';
import { ServicioCentral, ResumenCentral } from '../logica/servicio-central';
import { observarConexionTiempoReal } from '../../plataforma/firebase';

export interface EstadoCentral {
  readonly conectadoRtdb: boolean;
  readonly cargando: boolean;
  readonly resumen: ResumenCentral | null;
  readonly error: string | null;
  readonly recargar: () => Promise<void>;
}

export function useEstadoCentral(): EstadoCentral {
  const [conectadoRtdb, setConectadoRtdb] = useState<boolean>(false);
  const [cargando, setCargando] = useState<boolean>(true);
  const [resumen, setResumen] = useState<ResumenCentral | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    resumen,
    error,
    recargar,
  };
}
