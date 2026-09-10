import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { Negocio, Categoria, IdentificadorUnico } from '../../../contratos';

interface PropsListaNegocios {
  readonly negocios: readonly Negocio[];
  readonly categorias: readonly Categoria[];
  readonly negocioSeleccionadoId: IdentificadorUnico | null;
  readonly onSeleccionarNegocio: (id: IdentificadorUnico) => void;
  readonly onCrearNuevoNegocio: () => void;
}

export const ListaNegocios: React.FC<PropsListaNegocios> = ({
  negocios,
  categorias,
  negocioSeleccionadoId,
  onSeleccionarNegocio,
  onCrearNuevoNegocio,
}) => {
  const mapaCategorias = React.useMemo(() => {
    const mapa = new Map<string, string>();
    for (const cat of categorias) {
      mapa.set(cat.id, cat.nombre);
    }
    return mapa;
  }, [categorias]);

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.cabeceraSeccion}>
        <Text style={estilos.tituloSeccion}>Negocios ({negocios.length})</Text>
        <TouchableOpacity 
          style={estilos.botonCrear}
          onPress={onCrearNuevoNegocio}
          activeOpacity={0.7}
        >
          <Text style={estilos.textoBotonCrear}>+ Crear Negocio</Text>
        </TouchableOpacity>
      </View>

      {negocios.length === 0 ? (
        <View style={estilos.contenedorVacio}>
          <Text style={estilos.textoVacio}>
            No hay negocios registrados. Usa el botón "Crear Negocio" para agregar el primero.
          </Text>
        </View>
      ) : (
        <View style={estilos.lista}>
          {negocios.map((negocio) => {
            const seleccionado = negocioSeleccionadoId === negocio.id;
            const nombreCategoria = mapaCategorias.get(negocio.categoria_id) ?? 'Sin categoría';

            // Contar capacidades activas
            const capacidades = Object.values(negocio.configuracion.capacidades);
            const activas = capacidades.filter((c) => c.activa).length;

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
                  <Text style={estilos.nombreComercial}>
                    {seleccionado ? '▶ ' : ''}{negocio.nombre_comercial}
                  </Text>
                  <Text style={estilos.meta}>
                    {nombreCategoria} • {activas} capacidades activas • {negocio.activo ? '🟢' : '🔴'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

const estilos = StyleSheet.create({
  contenedor: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
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
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  botonCrear: {
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  textoBotonCrear: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  lista: {
    gap: 8,
  },
  tarjeta: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tarjetaSeleccionada: {
    borderColor: '#059669',
    backgroundColor: '#f0fdf4',
    borderWidth: 2,
  },
  columnaPrincipal: {
    flex: 1,
  },
  nombreComercial: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  meta: {
    fontSize: 12,
    color: '#6b7280',
  },
  contenedorVacio: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  textoVacio: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
  },
});
