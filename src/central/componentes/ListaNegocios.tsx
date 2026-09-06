import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { Negocio, Categoria, IdentificadorUnico } from '../../../contratos';

interface PropsListaNegocios {
  readonly negocios: readonly Negocio[];
  readonly categorias: readonly Categoria[];
  readonly negocioSeleccionadoId: IdentificadorUnico | null;
  readonly onSeleccionarNegocio: (id: IdentificadorUnico) => void;
}

export const ListaNegocios: React.FC<PropsListaNegocios> = ({
  negocios,
  categorias,
  negocioSeleccionadoId,
  onSeleccionarNegocio,
}) => {
  const mapaCategorias = React.useMemo(() => {
    const mapa = new Map<string, string>();
    for (const cat of categorias) {
      mapa.set(cat.id, cat.nombre);
    }
    return mapa;
  }, [categorias]);

  if (negocios.length === 0) {
    return (
      <View style={estilos.contenedorVacio}>
        <Text style={estilos.textoVacio}>No hay negocios registrados para esta selección.</Text>
      </View>
    );
  }

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.cabeceraSeccion}>
        <Text style={estilos.tituloSeccion}>NEGOCIOS REGISTRADOS</Text>
        <Text style={estilos.conteoTotal}>{negocios.length} negocios</Text>
      </View>

      <View style={estilos.lista}>
        {negocios.map((negocio) => {
          const seleccionado = negocioSeleccionadoId === negocio.id;
          const nombreCategoria = mapaCategorias.get(negocio.categoriaId) ?? 'Sin categoría';

          // Contar capacidades activas
          const capacidades = Object.values(negocio.configuracion.capacidades);
          const activas = capacidades.filter((c) => c.activa).length;
          const totalCapacidades = capacidades.length;

          return (
            <TouchableOpacity
              key={negocio.id}
              style={[
                estilos.tarjeta,
                seleccionado && estilos.tarjetaSeleccionada,
              ]}
              onPress={() => onSeleccionarNegocio(negocio.id)}
              activeOpacity={0.7}
            >
              <View style={estilos.columnaPrincipal}>
                <View style={estilos.filaCabeceraTarjeta}>
                  <Text
                    style={[
                      estilos.nombreComercial,
                      seleccionado && estilos.textoSeleccionado,
                    ]}
                  >
                    {negocio.nombreComercial}
                  </Text>
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
                      {negocio.activo ? 'Activo' : 'Inactivo'}
                    </Text>
                  </View>
                </View>

                <Text style={estilos.razonSocial}>{negocio.nombre}</Text>

                <View style={estilos.filaMeta}>
                  <View style={estilos.badgeCategoria}>
                    <Text style={estilos.textoBadgeCategoria}>{nombreCategoria}</Text>
                  </View>

                  <Text style={estilos.textoCapacidades}>
                    Capacidades: <Text style={estilos.valorCapacidades}>{activas}/{totalCapacidades} activas</Text>
                  </Text>
                </View>
              </View>

              <View style={estilos.columnaIndicador}>
                <View
                  style={[
                    estilos.circuloSeleccion,
                    seleccionado && estilos.circuloSeleccionActivo,
                  ]}
                >
                  {seleccionado && <View style={estilos.puntoInterno} />}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const estilos = StyleSheet.create({
  contenedor: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cabeceraSeccion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tituloSeccion: {
    fontSize: 11,
    fontWeight: '800',
    color: '#374151',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  conteoTotal: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  lista: {
    gap: 10,
  },
  tarjeta: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  tarjetaSeleccionada: {
    borderColor: '#059669',
    backgroundColor: '#f0fdf4',
  },
  columnaPrincipal: {
    flex: 1,
  },
  filaCabeceraTarjeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
    marginRight: 10,
  },
  nombreComercial: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  textoSeleccionado: {
    color: '#065f46',
  },
  badgeEstado: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  textoBadgeEstado: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  razonSocial: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  filaMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  badgeCategoria: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  textoBadgeCategoria: {
    fontSize: 11,
    color: '#1f2937',
    fontWeight: '600',
  },
  textoCapacidades: {
    fontSize: 11,
    color: '#6b7280',
  },
  valorCapacidades: {
    fontWeight: '700',
    color: '#111827',
  },
  columnaIndicador: {
    paddingLeft: 8,
  },
  circuloSeleccion: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circuloSeleccionActivo: {
    borderColor: '#059669',
  },
  puntoInterno: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#059669',
  },
  contenedorVacio: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
  },
  textoVacio: {
    fontSize: 13,
    color: '#6b7280',
    fontStyle: 'italic',
  },
});
