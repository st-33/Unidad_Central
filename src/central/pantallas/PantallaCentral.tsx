import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useEstadoCentral } from '../estado';
import { PanelEstadoCentral } from '../componentes/PanelEstadoCentral';

/**
 * Pantalla principal del sistema Central en Unidad Central.
 * Su responsabilidad es orquestar la vista técnica y coordinar el estado
 * sin tocar directamente persistencia ni Firebase.
 */
export const PantallaCentral: React.FC = () => {
  const estado = useEstadoCentral();

  return (
    <ScrollView
      contentContainerStyle={estilos.contenedorScroll}
      style={estilos.contenedor}
    >
      <View style={estilos.areaCentral}>
        <PanelEstadoCentral estado={estado} />
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  areaCentral: {
    width: '100%',
    alignItems: 'center',
  },
});
