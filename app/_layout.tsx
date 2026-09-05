import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/**
 * Layout principal de navegación en Expo Router.
 * Configura los proveedores de entorno visual y la pila de rutas de Unidad Central.
 */
export default function LayoutRaiz() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#111827',
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'Unidad Central',
            headerShown: false,
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
