import React from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Text } from 'react-native';
import { useEstadoCentral } from '../estado';
import {
  CabeceraCentral,
  ListaCategorias,
  ListaNegocios,
  DetalleNegocio,
  BannersEstado,
} from '../componentes';

/**
 * Pantalla principal operativa de Unidad Central.
 * Orquesta la supervisión del catálogo de categorías, el inventario de negocios
 * y la administración directa de capacidades por negocio en la RTDB.
 */
export const PantallaCentral: React.FC = () => {
  const {
    conectadoRtdb,
    cargando,
    ejecutandoInicializacion,
    guardandoCapacidad,
    resumen,
    negocioSeleccionado,
    categoriaFiltroId,
    error,
    mensajeOperacion,
    recargar,
    inicializar,
    seleccionarNegocio,
    filtrarPorCategoria,
    cambiarEstadoCapacidad,
  } = useEstadoCentral();

  const estaInicializado = Boolean(resumen?.inicializado);

  // Filtrado reactivo de negocios por categoría seleccionada
  const negociosFiltrados = React.useMemo(() => {
    if (!resumen?.negocios) {
      return [];
    }
    if (!categoriaFiltroId) {
      return resumen.negocios;
    }
    return resumen.negocios.filter((n) => n.categoria_id === categoriaFiltroId);
  }, [resumen?.negocios, categoriaFiltroId]);

  return (
    <ScrollView
      contentContainerStyle={estilos.contenedorScroll}
      style={estilos.contenedor}
    >
      <View style={estilos.areaPrincipal}>
        {/* Cabecera institucional con control de conexión y actualización */}
        <CabeceraCentral
          conectadoRtdb={conectadoRtdb}
          estaInicializado={estaInicializado}
          cargando={cargando}
          ejecutandoInicializacion={ejecutandoInicializacion}
          onInicializar={inicializar}
          onRecargar={recargar}
        />

        {/* Banners para errores y confirmaciones operativas */}
        <BannersEstado error={error} mensajeOperacion={mensajeOperacion} />

        {cargando && !resumen ? (
          <View style={estilos.cajaCarga}>
            <ActivityIndicator size="large" color="#059669" />
            <Text style={estilos.textoCarga}>Consultando RTDB de Unidad Central...</Text>
          </View>
        ) : !estaInicializado ? (
          <View style={estilos.cajaPendienteInicio}>
            <Text style={estilos.tituloPendiente}>Estructura Base No Inicializada</Text>
            <Text style={estilos.descripcionPendiente}>
              La base de datos de Unidad Central aún no contiene el catálogo maestro de categorías y
              negocios base. Pulsa el botón "Inicializar Red" en la cabecera para crearlos de forma
              segura e idempotente.
            </Text>
          </View>
        ) : (
          <View style={estilos.layoutContenido}>
            {/* Columna izquierda: Categorías y listado de negocios */}
            <View style={estilos.columnaCatalogo}>
              <ListaCategorias
                categorias={resumen?.categorias ?? []}
                negocios={resumen?.negocios ?? []}
                categoriaSeleccionadaId={categoriaFiltroId}
                onSeleccionarCategoria={filtrarPorCategoria}
              />

              <ListaNegocios
                negocios={negociosFiltrados}
                categorias={resumen?.categorias ?? []}
                negocioSeleccionadoId={negocioSeleccionado?.id ?? null}
                onSeleccionarNegocio={seleccionarNegocio}
                onCrearNuevoNegocio={() => {
                  // TODO: Implementar creación de nuevo negocio
                  console.log('Crear nuevo negocio');
                }}
              />
            </View>

            {/* Columna derecha: Detalle del negocio seleccionado y gestión de capacidades */}
            <View style={estilos.columnaDetalle}>
              <DetalleNegocio
                negocio={negocioSeleccionado}
                categorias={resumen?.categorias ?? []}
                capacidadesCatalogo={resumen?.capacidades ?? []}
                guardandoCapacidad={guardandoCapacidad}
                onAlternarCapacidad={cambiarEstadoCapacidad}
              />
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  contenedorScroll: {
    flexGrow: 1,
    padding: 20,
    alignItems: 'center',
  },
  areaPrincipal: {
    width: '100%',
    maxWidth: 1100,
  },
  cajaCarga: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 40,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  textoCarga: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '500',
  },
  cajaPendienteInicio: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 32,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  tituloPendiente: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  descripcionPendiente: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 540,
  },
  layoutContenido: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    alignItems: 'flex-start',
  },
  columnaCatalogo: {
    flex: 1,
    minWidth: 340,
  },
  columnaDetalle: {
    flex: 1,
    minWidth: 340,
  },
});
