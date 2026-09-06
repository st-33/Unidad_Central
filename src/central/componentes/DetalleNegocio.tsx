import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import type { Negocio, Categoria, DefinicionCapacidad, ClaveCapacidad } from '../../../contratos';

interface PropsDetalleNegocio {
  readonly negocio: Negocio | null;
  readonly categorias: readonly Categoria[];
  readonly capacidadesCatalogo: readonly DefinicionCapacidad[];
  readonly guardandoCapacidad: boolean;
  readonly onAlternarCapacidad: (claveCapacidad: ClaveCapacidad, activa: boolean) => void;
}

export const DetalleNegocio: React.FC<PropsDetalleNegocio> = ({
  negocio,
  categorias,
  capacidadesCatalogo,
  guardandoCapacidad,
  onAlternarCapacidad,
}) => {
  if (!negocio) {
    return (
      <View style={estilos.contenedorSinSeleccion}>
        <View style={estilos.iconoPlaceholder}>
          <Text style={estilos.textoIcono}>ℹ</Text>
        </View>
        <Text style={estilos.tituloSinSeleccion}>Ningún negocio seleccionado</Text>
        <Text style={estilos.subtituloSinSeleccion}>
          Selecciona un negocio del listado para inspeccionar su identidad, contexto de categoría y
          administrar sus capacidades operativas en la RTDB.
        </Text>
      </View>
    );
  }

  const categoria = categorias.find((c) => c.id === negocio.categoriaId);

  return (
    <View style={estilos.contenedor}>
      {/* Cabecera del detalle */}
      <View style={estilos.cabeceraDetalle}>
        <View style={estilos.bloqueIdentidad}>
          <View style={estilos.filaBadgeContexto}>
            <View style={estilos.badgeCategoria}>
              <Text style={estilos.textoBadgeCategoria}>
                Categoría: {categoria?.nombre ?? negocio.categoriaId}
              </Text>
            </View>
            <View
              style={[
                estilos.badgeEstado,
                { backgroundColor: negocio.activo ? '#ecfdf5' : '#fef2f2' },
              ]}
            >
              <Text
                style={[
                  estilos.textoBadgeEstado,
                  { color: negocio.activo ? '#059669' : '#dc2626' },
                ]}
              >
                {negocio.activo ? 'Operativo' : 'Inactivo'}
              </Text>
            </View>
          </View>

          <Text style={estilos.nombreComercial}>{negocio.nombreComercial}</Text>
          <Text style={estilos.razonSocial}>Razón Social: {negocio.nombre}</Text>
          <Text style={estilos.idRegistro}>ID en RTDB: {negocio.id}</Text>
        </View>

        {guardandoCapacidad && (
          <View style={estilos.indicadorGuardado}>
            <ActivityIndicator size="small" color="#059669" />
            <Text style={estilos.textoGuardado}>Actualizando RTDB...</Text>
          </View>
        )}
      </View>

      {/* Sección de capacidades operativas */}
      <View style={estilos.seccionCapacidades}>
        <View style={estilos.filaTituloCapacidades}>
          <Text style={estilos.tituloSeccion}>CONFIGURACIÓN DE CAPACIDADES</Text>
          <Text style={estilos.subtituloCapacidades}>
            Las capacidades modificadas se persisten directamente en el registro propio del negocio.
          </Text>
        </View>

        <View style={estilos.listaCapacidades}>
          {capacidadesCatalogo.map((cap) => {
            const ajuste = negocio.configuracion.capacidades[cap.clave];
            const estaHabilitada = Boolean(ajuste?.activa);

            return (
              <View
                key={cap.id}
                style={[
                  estilos.tarjetaCapacidad,
                  estaHabilitada && estilos.tarjetaCapacidadHabilitada,
                ]}
              >
                <View style={estilos.infoCapacidad}>
                  <View style={estilos.filaEncabezadoCapacidad}>
                    <Text style={estilos.nombreCapacidad}>{cap.nombre}</Text>
                    <View
                      style={[
                        estilos.pillEstadoCapacidad,
                        { backgroundColor: estaHabilitada ? '#d1fae5' : '#f3f4f6' },
                      ]}
                    >
                      <Text
                        style={[
                          estilos.textoPillCapacidad,
                          { color: estaHabilitada ? '#065f46' : '#6b7280' },
                        ]}
                      >
                        {estaHabilitada ? 'Habilitada' : 'Deshabilitada'}
                      </Text>
                    </View>
                  </View>

                  <Text style={estilos.claveCapacidad}>Clave: {cap.clave}</Text>
                  <Text style={estilos.descripcionCapacidad}>{cap.descripcion}</Text>
                </View>

                <TouchableOpacity
                  style={[
                    estilos.botonAlternar,
                    estaHabilitada ? estilos.botonDeshabilitar : estilos.botonHabilitar,
                    guardandoCapacidad && estilos.botonDeshabilitado,
                  ]}
                  onPress={() => onAlternarCapacidad(cap.clave, !estaHabilitada)}
                  disabled={guardandoCapacidad}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      estilos.textoBotonAlternar,
                      estaHabilitada ? estilos.textoDeshabilitar : estilos.textoHabilitar,
                    ]}
                  >
                    {estaHabilitada ? 'Desactivar' : 'Activar'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const estilos = StyleSheet.create({
  contenedor: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#059669',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  contenedorSinSeleccion: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
  },
  iconoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  textoIcono: {
    fontSize: 20,
    color: '#6b7280',
    fontWeight: '700',
  },
  tituloSinSeleccion: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  subtituloSinSeleccion: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 420,
  },
  cabeceraDetalle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingBottom: 14,
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 12,
  },
  bloqueIdentidad: {
    flex: 1,
    minWidth: 240,
  },
  filaBadgeContexto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  badgeCategoria: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  textoBadgeCategoria: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065f46',
  },
  badgeEstado: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  textoBadgeEstado: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  nombreComercial: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  razonSocial: {
    fontSize: 13,
    color: '#4b5563',
    marginTop: 2,
  },
  idRegistro: {
    fontSize: 11,
    color: '#9ca3af',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  indicadorGuardado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  textoGuardado: {
    fontSize: 11,
    color: '#065f46',
    fontWeight: '600',
  },
  seccionCapacidades: {
    gap: 12,
  },
  filaTituloCapacidades: {
    marginBottom: 4,
  },
  tituloSeccion: {
    fontSize: 11,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  subtituloCapacidades: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  listaCapacidades: {
    gap: 10,
  },
  tarjetaCapacidad: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tarjetaCapacidadHabilitada: {
    borderColor: '#a7f3d0',
    backgroundColor: '#fafdfb',
  },
  infoCapacidad: {
    flex: 1,
    marginRight: 12,
  },
  filaEncabezadoCapacidad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  nombreCapacidad: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  pillEstadoCapacidad: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  textoPillCapacidad: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  claveCapacidad: {
    fontSize: 10,
    color: '#059669',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  descripcionCapacidad: {
    fontSize: 12,
    color: '#4b5563',
    lineHeight: 16,
  },
  botonAlternar: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonHabilitar: {
    backgroundColor: '#111827',
  },
  botonDeshabilitar: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  botonDeshabilitado: {
    opacity: 0.5,
  },
  textoBotonAlternar: {
    fontSize: 12,
    fontWeight: '700',
  },
  textoHabilitar: {
    color: '#ffffff',
  },
  textoDeshabilitar: {
    color: '#b91c1c',
  },
});
