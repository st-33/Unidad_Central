import type {
  Categoria,
  Negocio,
  DefinicionCapacidad,
  IdentificadorUnico,
  ConfiguracionNegocio,
  InformacionComercial,
  EstadoComercial,
  ReciboEjecucion,
  ResultadoProcesamiento,
} from '../../../contratos';
import type { EstadoEstructuraSistema } from './repositorio-sistema';

const CLAVE_STORAGE = 'unidad_central_memoria_v1';

interface EstadoMemoria {
  sistema: EstadoEstructuraSistema | null;
  categorias: Record<string, Categoria>;
  negocios: Record<string, Negocio>;
  capacidades: Record<string, DefinicionCapacidad>;
  comercial: Record<string, InformacionComercial>;
  recibos: Record<string, ReciboEjecucion>;
  procesamientos: Record<string, ResultadoProcesamiento>;
}

function cargarDeStorage(): EstadoMemoria {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const guardado = window.localStorage.getItem(CLAVE_STORAGE);
      if (guardado) {
        return JSON.parse(guardado);
      }
    } catch {
      // Ignore storage errors
    }
  }
  return {
    sistema: null,
    categorias: {},
    negocios: {},
    capacidades: {},
    comercial: {},
    recibos: {},
    procesamientos: {},
  };
}

function guardarEnStorage(estado: EstadoMemoria) {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(CLAVE_STORAGE, JSON.stringify(estado));
    } catch {
      // Ignore storage errors
    }
  }
}

const estadoMemoria: EstadoMemoria = cargarDeStorage();

export const almacenMemoria = {
  sistema: {
    obtener(): EstadoEstructuraSistema | null {
      return estadoMemoria.sistema;
    },
    marcarInicializado(version = 1) {
      estadoMemoria.sistema = {
        inicializado: true,
        version,
        inicializadoEn: Date.now(),
      };
      guardarEnStorage(estadoMemoria);
    },
    sincronizar(estado: EstadoEstructuraSistema | null) {
      if (estado) {
        estadoMemoria.sistema = estado;
        guardarEnStorage(estadoMemoria);
      }
    },
  },

  categorias: {
    listar(): readonly Categoria[] {
      return Object.values(estadoMemoria.categorias);
    },
    obtenerPorId(id: IdentificadorUnico): Categoria | null {
      return estadoMemoria.categorias[id] ?? null;
    },
    guardar(cat: Categoria) {
      estadoMemoria.categorias[cat.id] = cat;
      guardarEnStorage(estadoMemoria);
    },
    sincronizar(lista: readonly Categoria[]) {
      for (const cat of lista) {
        estadoMemoria.categorias[cat.id] = cat;
      }
      guardarEnStorage(estadoMemoria);
    },
  },

  negocios: {
    listar(): readonly Negocio[] {
      return Object.values(estadoMemoria.negocios);
    },
    obtenerPorId(id: IdentificadorUnico): Negocio | null {
      return estadoMemoria.negocios[id] ?? null;
    },
    guardar(negocio: Negocio) {
      estadoMemoria.negocios[negocio.id] = negocio;
      guardarEnStorage(estadoMemoria);
    },
    actualizarConfiguracion(id: IdentificadorUnico, configuracion: ConfiguracionNegocio) {
      if (estadoMemoria.negocios[id]) {
        estadoMemoria.negocios[id] = {
          ...estadoMemoria.negocios[id],
          configuracion,
        };
        guardarEnStorage(estadoMemoria);
      }
    },
    sincronizar(lista: readonly Negocio[]) {
      for (const neg of lista) {
        estadoMemoria.negocios[negocioKey(neg.id)] = neg;
      }
      guardarEnStorage(estadoMemoria);
    },
  },

  capacidades: {
    listar(): readonly DefinicionCapacidad[] {
      return Object.values(estadoMemoria.capacidades);
    },
    obtenerPorId(id: IdentificadorUnico): DefinicionCapacidad | null {
      return estadoMemoria.capacidades[id] ?? null;
    },
    guardar(cap: DefinicionCapacidad) {
      estadoMemoria.capacidades[cap.id] = cap;
      guardarEnStorage(estadoMemoria);
    },
    sincronizar(lista: readonly DefinicionCapacidad[]) {
      for (const cap of lista) {
        estadoMemoria.capacidades[cap.id] = cap;
      }
      guardarEnStorage(estadoMemoria);
    },
  },

  comercial: {
    obtener(negocioId: IdentificadorUnico): InformacionComercial | null {
      return estadoMemoria.comercial[negocioId] ?? null;
    },
    guardar(info: InformacionComercial) {
      estadoMemoria.comercial[info.negocio_id] = info;
      guardarEnStorage(estadoMemoria);
    },
    actualizarEstado(negocioId: IdentificadorUnico, estado: EstadoComercial) {
      if (estadoMemoria.comercial[negocioId]) {
        estadoMemoria.comercial[negocioId] = {
          ...estadoMemoria.comercial[negocioId],
          estado_comercial: estado,
        };
        guardarEnStorage(estadoMemoria);
      }
    },
  },

  recibos: {
    guardarRecibo(recibo: ReciboEjecucion) {
      estadoMemoria.recibos[recibo.evento_id] = recibo;
      guardarEnStorage(estadoMemoria);
    },
    guardarProcesamiento(proc: ResultadoProcesamiento) {
      estadoMemoria.procesamientos[proc.recibo_id] = proc;
      guardarEnStorage(estadoMemoria);
    },
    obtenerProcesamiento(reciboId: IdentificadorUnico): ResultadoProcesamiento | null {
      return estadoMemoria.procesamientos[reciboId] ?? null;
    },
    listarPorNegocio(negocioId: IdentificadorUnico): readonly ReciboEjecucion[] {
      return Object.values(estadoMemoria.recibos).filter(
        (r) => r.negocio_id_origen === negocioId || r.negocio_id_proveedor === negocioId
      );
    },
  },
};

function negocioKey(id: string): string {
  return id;
}

export async function conTiempoLimite<T>(promesa: Promise<T>, tiempoMs = 3000): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Firebase RTDB timeout')), tiempoMs);
  });
  return Promise.race([promesa, timeout]).finally(() => clearTimeout(timer));
}
