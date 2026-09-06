import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { EstadoCentral } from '../estado/useEstadoCentral';
import { CONFIGURACION_FIREBASE_CENTRAL } from '../../../configuracion/firebase';

interface PropsPanelEstadoCentral {
  readonly estado: EstadoCentral;
}

export const PanelEstadoCentral: React.FC<PropsPanelEstadoCentral> = ({ estado }) => {
  const {
    conectadoRtdb,
    cargando,
    ejecutandoInicializacion,
    guardandoCapacidad,
    resumen,
    negocioSeleccionado,
    error,
    mensajeOperacion,
    recargar,
    inicializar,
    seleccionarNegocio,
    cambiarEstadoCapacidad,
  } = estado;

  const estaInicializado = Boolean(resumen?.inicializado);

  // Mapa de nombres de categorías para mostrar contexto del negocio
  const mapaCategorias = React.useMemo(() => {
    const mapa = new Map<string, string>();
    if (resumen?.categorias) {
      for (const cat of resumen.categorias) {
        mapa.set(cat.id, cat.nombre);
      }
    }
    return mapa;
  }, [resumen?.categorias]);

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.seccionCabecera}>
        <Text style={estilos.etiquetaSistema}>UNIDAD CENTRAL</Text>
        <Text style={estilos.tituloModulo}>CENTRAL</Text>
        <Text style={estilos.subtitulo}>Gestión de catálogo y configuración de negocios</Text>
      </View>

      {/* 1. Infraestructura técnica */}
      <View style={estilos.bloqueTecnico}>
        <Text style={estilos.tituloSeccion}>INFRAESTRUCTURA TÉCNICA</Text>

        <View style={estilos.filaEstado}>
          <Text style={estilos.etiquetaCampo}>Proyecto Firebase:</Text>
          <Text style={estilos.valorCampo}>{CONFIGURACION_FIREBASE_CENTRAL.idProyecto}</Text>
        </View>

        <View style={estilos.filaEstado}>
          <Text style={estilos.etiquetaCampo}>Aplicación web:</Text>
          <Text style={estilos.valorCampo}>{CONFIGURACION_FIREBASE_CENTRAL.nombreAplicacion}</Text>
        </View>

        <View style={estilos.filaEstado}>
          <Text style={estilos.etiquetaCampo}>Enlace RTDB:</Text>
          <View style={estilos.indicadorConexion}>
            <View
              style={[
                estilos.puntoEstado,
                { backgroundColor: conectadoRtdb ? '#10b981' : '#f59e0b' },
              ]}
            />
            <Text style={estilos.valorCampo}>
              {conectadoRtdb ? 'Conectado (En línea)' : 'Verificando enlace / En espera'}
            </Text>
          </View>
        </View>

        <View style={estilos.filaEstado}>
          <Text style={estilos.etiquetaCampo}>Estructura Central:</Text>
          <Text
            style={[
              estilos.valorCampo,
              { color: estaInicializado ? '#047857' : '#b45309' },
            ]}
          >
            {estaInicializado ? 'Inicializada' : 'Sin inicializar'}
          </Text>
        </View>
      </View>

      {/* 2. Resumen y selección de negocios */}
      <View style={estilos.bloqueTecnico}>
        <Text style={estilos.tituloSeccion}>NEGOCIOS REGISTRADOS EN RTDB</Text>

        {cargando ? (
          <ActivityIndicator size="small" color="#2563eb" style={estilos.cargador} />
        ) : error ? (
          <View style={estilos.cajaAlerta}>
            <Text style={estilos.textoAlerta}>Aviso técnico: {error}</Text>
          </View>
        ) : !estaInicializado ? (
          <View style={estilos.cajaInfo}>
            <Text style={estilos.textoInfo}>
              La estructura base aún no ha sido inicializada en la RTDB. Usa el botón inferior para
              crear las categorías y negocios iniciales.
            </Text>
          </View>
        ) : (
          <View>
            <View style={estilos.filaResumenConteo}>
              <Text style={estilos.etiquetaConteo}>
                Categorías: <Text style={estilos.valorConteo}>{resumen?.totalCategorias ?? 0}</Text>
              </Text>
              <Text style={estilos.etiquetaConteo}>
                Negocios: <Text style={estilos.valorConteo}>{resumen?.totalNegocios ?? 0}</Text>
              </Text>
              <Text style={estilos.etiquetaConteo}>
                Capacidades: <Text style={estilos.valorConteo}>{resumen?.totalCapacidades ?? 0}</Text>
              </Text>
            </View>

            <Text style={estilos.subtituloListado}>
              Selecciona un negocio para administrar sus capacidades:
            </Text>

            <View style={estilos.grillaNegocios}>
              {resumen?.negocios.map((negocio) => {
                const seleccionado = negocioSeleccionado?.id === negocio.id;
                const nombreCat = mapaCategorias.get(negocio.categoriaId) ?? 'Sin categoría';

                return (
                  <TouchableOpacity
                    key={negocio.id}
                    style={[
                      estilos.tarjetaNegocio,
                      seleccionado && estilos.tarjetaNegocioSeleccionada,
                    ]}
                    onPress={() => seleccionarNegocio(negocio.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        estilos.nombreNegocio,
                        seleccionado && estilos.textoNegocioSeleccionado,
                      ]}
                    >
                      {negocio.nombreComercial}
                    </Text>
                    <Text
                      style={[
                        estilos.categoriaNegocio,
                        seleccionado && estilos.textoCategoriaSeleccionada,
                      ]}
                    >
                      {nombreCat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </View>

      {/* 3. Panel de capacidades del negocio seleccionado */}
      {negocioSeleccionado && (
        <View style={estilos.bloqueCapacidades}>
          <View style={estilos.cabeceraCapacidades}>
            <View>
              <Text style={estilos.tituloSeccion}>CONFIGURACIÓN INDIVIDUAL</Text>
              <Text style={estilos.nombreNegocioActivo}>
                {negocioSeleccionado.nombreComercial}
              </Text>
              <Text style={estilos.subtituloNegocioActivo}>
                Categoría: {mapaCategorias.get(negocioSeleccionado.categoriaId)}
              </Text>
            </View>
            {guardandoCapacidad && (
              <ActivityIndicator size="small" color="#047857" style={estilos.cargadorCapacidad} />
            )}
          </View>

          <View style={estilos.listaCapacidades}>
            {resumen?.capacidades.map((cap) => {
              const ajuste = negocioSeleccionado.configuracion.capacidades[cap.clave];
              const estaActiva = Boolean(ajuste?.activa);

              return (
                <View key={cap.id} style={estilos.filaCapacidad}>
                  <View style={estilos.infoCapacidad}>
                    <View style={estilos.encabezadoFilaCapacidad}>
                      <Text style={estilos.nombreCapacidad}>{cap.nombre}</Text>
                      <View
                        style={[
                          estilos.etiquetaPill,
                          { backgroundColor: estaActiva ? '#d1fae5' : '#f3f4f6' },
                        ]}
                      >
                        <Text
                          style={[
                            estilos.textoPill,
                            { color: estaActiva ? '#065f46' : '#6b7280' },
                          ]}
                        >
                          {estaActiva ? 'Activa' : 'Inactiva'}
                        </Text>
                      </View>
                    </View>
                    <Text style={estilos.descripcionCapacidad}>{cap.descripcion}</Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      estilos.botonToggle,
                      estaActiva ? estilos.botonDesactivar : estilos.botonActivar,
                    ]}
                    onPress={() => cambiarEstadoCapacidad(cap.clave, !estaActiva)}
                    disabled={guardandoCapacidad}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        estilos.textoBotonToggle,
                        estaActiva ? estilos.textoDesactivar : estilos.textoActivar,
                      ]}
                    >
                      {estaActiva ? 'Desactivar' : 'Activar'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* 4. Mensajes de confirmación */}
      {mensajeOperacion && (
        <View style={estilos.cajaExito}>
          <Text style={estilos.textoExito}>{mensajeOperacion}</Text>
        </View>
      )}

      {/* 5. Acciones principales */}
      <View style={estilos.contenedorBotones}>
        {!estaInicializado && (
          <TouchableOpacity
            style={[
              estilos.botonPrimario,
              (ejecutandoInicializacion || cargando) && estilos.botonDeshabilitado,
            ]}
            onPress={inicializar}
            disabled={ejecutandoInicializacion || cargando}
            activeOpacity={0.8}
          >
            <Text style={estilos.textoBotonPrimario}>
              {ejecutandoInicializacion
                ? 'Inicializando...'
                : 'Inicializar categorías y negocios base'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={estilos.botonSecundario}
          onPress={recargar}
          disabled={cargando || ejecutandoInicializacion}
          activeOpacity={0.8}
        >
          <Text style={estilos.textoBotonSecundario}>
            {cargando ? 'Consultando RTDB...' : 'Revalidar lectura RTDB'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const estilos = StyleSheet.create({
  contenedor: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    width: '100%',
    maxWidth: 620,
  },
  seccionCabecera: {
    borderBottomWidth: 2,
    borderBottomColor: '#111827',
    paddingBottom: 14,
    marginBottom: 16,
  },
  etiquetaSistema: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6b7280',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  tituloModulo: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    marginTop: 2,
  },
  subtitulo: {
    fontSize: 13,
    color: '#4b5563',
    marginTop: 2,
  },
  bloqueTecnico: {
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  tituloSeccion: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
    letterSpacing: 1,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  filaEstado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  etiquetaCampo: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  valorCampo: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
  },
  indicadorConexion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  puntoEstado: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cargador: {
    marginVertical: 12,
  },
  cajaAlerta: {
    backgroundColor: '#fef3c7',
    padding: 10,
    borderRadius: 4,
    marginTop: 6,
  },
  textoAlerta: {
    color: '#92400e',
    fontSize: 12,
  },
  cajaInfo: {
    backgroundColor: '#f3f4f6',
    padding: 10,
    borderRadius: 4,
    marginTop: 4,
  },
  textoInfo: {
    color: '#4b5563',
    fontSize: 12,
    lineHeight: 18,
  },
  filaResumenConteo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  etiquetaConteo: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  valorConteo: {
    color: '#111827',
    fontWeight: '700',
  },
  subtituloListado: {
    fontSize: 12,
    color: '#4b5563',
    marginBottom: 8,
    fontWeight: '500',
  },
  grillaNegocios: {
    gap: 8,
  },
  tarjetaNegocio: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tarjetaNegocioSeleccionada: {
    borderColor: '#047857',
    backgroundColor: '#ecfdf5',
  },
  nombreNegocio: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  textoNegocioSeleccionado: {
    color: '#065f46',
  },
  categoriaNegocio: {
    fontSize: 12,
    color: '#6b7280',
  },
  textoCategoriaSeleccionada: {
    color: '#047857',
    fontWeight: '500',
  },
  bloqueCapacidades: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    padding: 14,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#047857',
  },
  cabeceraCapacidades: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 10,
    marginBottom: 12,
  },
  nombreNegocioActivo: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  subtituloNegocioActivo: {
    fontSize: 12,
    color: '#047857',
    fontWeight: '600',
    marginTop: 2,
  },
  cargadorCapacidad: {
    marginTop: 4,
  },
  listaCapacidades: {
    gap: 10,
  },
  filaCapacidad: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  infoCapacidad: {
    flex: 1,
    marginRight: 10,
  },
  encabezadoFilaCapacidad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nombreCapacidad: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  descripcionCapacidad: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  etiquetaPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  textoPill: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  botonToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
    minWidth: 84,
    alignItems: 'center',
  },
  botonActivar: {
    backgroundColor: '#111827',
  },
  botonDesactivar: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  textoBotonToggle: {
    fontSize: 12,
    fontWeight: '600',
  },
  textoActivar: {
    color: '#ffffff',
  },
  textoDesactivar: {
    color: '#991b1b',
  },
  cajaExito: {
    backgroundColor: '#d1fae5',
    padding: 10,
    borderRadius: 4,
    marginBottom: 12,
  },
  textoExito: {
    color: '#065f46',
    fontSize: 13,
    fontWeight: '500',
  },
  contenedorBotones: {
    gap: 8,
    marginTop: 4,
  },
  botonPrimario: {
    backgroundColor: '#047857',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  botonDeshabilitado: {
    opacity: 0.6,
  },
  textoBotonPrimario: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  botonSecundario: {
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  textoBotonSecundario: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
