# Unidad Central - Módulo Central

## 1. ¿Qué es Unidad Central?
Unidad Central es el núcleo de supervisión, catálogo e infraestructura transversal de la red de soluciones y negocios. No es una aplicación operativa de venta directa ni logística de última milla; es la autoridad central de configuración, identidades y gobernanza de la red.

## 2. ¿Qué es Central?
Central es la primera unidad funcional del proyecto Unidad Central. Es el nodo responsable de gestionar el catálogo maestro:
- Categorías sectoriales (ej. Marisquerías, Verdulerías, Hornos de Pan).
- Negocios registrados dentro de cada categoría.
- Capacidades operativas y su configuración individual por negocio.
- Persistencia centralizada en Firebase Realtime Database (RTDB).

## 3. Principio Fundamental de Dominio
```
CATEGORÍA (Contexto sectorial)
     ↓
NEGOCIO (Identidad propia)
     ↓
CONFIGURACIÓN PROPIA (Ajustes particulares)
     ↓
CAPACIDADES (Mostrador, básculas, pesaje, etc.)
```
**Categoría no es igual a Negocio**: Múltiples negocios pertenecen a una misma categoría pero pueden poseer capacidades y configuraciones operativas completamente distintas.

## 4. Alcance de esta Primera Implementación
- **Incluido**:
  - Contratos base de identidad, categoría, negocio, capacidad y configuración (libres de dependencias de UI/Firebase).
  - Infraestructura técnica encapsulada hacia Firebase RTDB del proyecto `base-principal-ma1`.
  - Repositorios de persistencia tipados en español latino.
  - Servicio de lógica de Central para orquestar altas, validaciones y resúmenes.
  - Estado de conexión y resumen desacoplado (`useEstadoCentral`).
  - Superficie visual mínima técnica para validar estado y conectividad.
  - Suite de pruebas unitarias y script de validación.

- **Explícitamente Fuera de Alcance**:
  - Torre de Control.
  - Mapas y geolocalización.
  - Aplicaciones operativas de negocios (Marisquerías, Verdulerías, etc.).
  - Motor logístico y ADIRepart.
  - Pedidos, repartidores e inventarios.
  - Dashboards comerciales o analítica avanzada.

## 5. Organización del Código
```
Unidad_Central/
├── app/                  # Rutas y layout de Expo Router (sin lógica pesada)
├── configuracion/        # Parámetros y credenciales centralizadas de Firebase
├── contratos/            # Contratos puros de dominio (sin dependencias externas)
├── documentacion/        # Documentación técnica esencial
├── pruebas/              # Pruebas unitarias reales de contratos y servicios
├── scripts/              # Scripts de automatización y verificación
└── src/
    ├── central/          # Lógica, persistencia, estado y UI de Central
    ├── compartido/       # Tipos y utilidades compartidas (ej. Resultado)
    └── plataforma/       # Infraestructura técnica (conexión e init Firebase)
```
