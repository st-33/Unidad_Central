import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PropsBannersEstado {
  readonly error: string | null;
  readonly mensajeOperacion: string | null;
}

export const BannersEstado: React.FC<PropsBannersEstado> = ({ error, mensajeOperacion }) => {
  if (!error && !mensajeOperacion) {
    return null;
  }

  return (
    <View style={estilos.contenedor}>
      {error && (
        <View style={estilos.bannerError}>
          <Text style={estilos.textoError}>Aviso técnico: {error}</Text>
        </View>
      )}

      {mensajeOperacion && (
        <View style={estilos.bannerExito}>
          <Text style={estilos.textoExito}>{mensajeOperacion}</Text>
        </View>
      )}
    </View>
  );
};

const estilos = StyleSheet.create({
  contenedor: {
    marginBottom: 16,
    gap: 8,
  },
  bannerError: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  textoError: {
    color: '#991b1b',
    fontSize: 13,
    fontWeight: '500',
  },
  bannerExito: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  textoExito: {
    color: '#065f46',
    fontSize: 13,
    fontWeight: '600',
  },
});
