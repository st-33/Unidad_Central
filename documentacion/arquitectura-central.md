# Unidad Central

## Descripción

**Unidad Central** es la autoridad administrativa del ecosistema ADI. Gestiona el catálogo maestro de categorías, negocios y capacidades operativas que son consumidas por los repositorios operativos (Marisquerías, Verdulerías, Servicio a Domicilio, etc.).

### ¿Qué Administra Central?

✅ **Identidades de negocios** — Registro y contexto de cada negocio  
✅ **Estructura de categorías** — Definición de rubros y sectores  
✅ **Catálogo de capacidades** — Funcionalidades disponibles en el ecosistema  
✅ **Configuración de capacidades por negocio** — Qué capacidades están activas en cada negocio

### ¿Qué NO Administra Central?

❌ Operación de negocios (pedidos, ventas, transacciones)  
❌ Logística (repartidores, rutas, zonas de reparto)  
❌ Recursos operativos (inventarios, precios, horarios)  
❌ Analítica (métricas, KPIs, reportes)

## Jerarquía Canónica

Central implementa y valida la siguiente jerarquía:

```
CAPACIDAD GLOBAL (ej: "mostrador", "reparto", "horno")
    ↓
CATEGORÍA (ej: "Marisquerías" permite ["mostrador", "bascula", "reparto"])
    ↓
NEGOCIO (ej: "Puerto Libres" activa ["mostrador", "bascula"], desactiva "reparto")
```

### Regla Arquitectónica Inquebrantable

**CAPACIDAD EXISTE GLOBALMENTE → CATEGORÍA DEFINE SI APLICA → NEGOCIO DEFINE SI ESTÁ ACTIVA**

Las validaciones se aplican en este orden:
1. ✅ La capacidad existe globalmente
2. ✅ La capacidad está disponible (no obsoleta)
3. ✅ La categoría del negocio permite esa capacidad
4. ✅ Solo entonces se puede activar/desactivar en el negocio

## Estructura del Proyecto

```
Unidad_Central/
├── app/                      # Rutas Expo Router
├── configuracion/            # Configuración de Firebase RTDB
├── contratos/                # Contratos puros de dominio
│   ├── identidad.ts         # IdentificadorUnico, EntidadIdentificable
│   ├── categoria.ts         # Categoria (con capacidadesPermitidas)
│   ├── capacidad.ts         # DefinicionCapacidad (con disponible)
│   ├── configuracion.ts     # ConfiguracionNegocio
│   ├── negocio.ts           # Negocio
│   └── exportacion.ts       # Payloads de exportación para consumo externo
├── documentacion/
│   ├── arquitectura-central.md      # Arquitectura y diseño
│   └── integracion-ecosistema.md    # Guía de integración para otros repos
├── pruebas/
│   ├── configuracion-firebase.test.ts
│   └── contratos-y-servicio-central.test.ts
└── src/
    ├── central/
    │   ├── componentes/     # Componentes UI
    │   ├── estado/          # useEstadoCentral hook
    │   ├── logica/          # ServicioCentral
    │   ├── pantallas/       # PantallaCentral
    │   └── persistencia/    # Repositorios RTDB
    ├── compartido/          # Resultado<T, E>
    └── plataforma/          # Inicialización de Firebase
```

## Contratos de Exportación

Central expone tres métodos principales para que los repositorios operativos consuman su configuración:

### 1. Configuración de Negocio

```typescript
await servicioCentral.exportarConfiguracionNegocio("neg-puerto-libres");
```

Retorna:
```typescript
{
  idNegocio: "neg-puerto-libres",
  nombreComercial: "Marisquería Puerto Libres",
  categoriaId: "cat-marisquerias",
  categoriaNombre: "Marisquerías",
  categoriaClave: "marisquerias",
  capacidadesActivas: ["mostrador", "bascula"],  // Solo las activas
  activo: true
}
```

### 2. Catálogo de Capacidades

```typescript
await servicioCentral.exportarCatalogoCapacidades();
```

Retorna todas las capacidades disponibles en el sistema.

### 3. Información de Categoría

```typescript
await servicioCentral.exportarCategoria("cat-marisquerias");
```

Retorna la categoría con sus capacidades permitidas.

## Instalación y Uso

### Requisitos

- Node.js 18+
- npm o yarn
- Expo CLI
- Firebase proyecto configurado

### Instalación

```bash
npm install
```

### Desarrollo

```bash
npm start
```

### Pruebas

```bash
npm test
```

### Verificación del Sistema

```bash
npm run verificar
```

## Estado del Proyecto

✅ TypeScript compilando sin errores  
✅ 10/10 pruebas pasando  
✅ Jerarquía canónica consolidada  
✅ Motor de capacidades con validaciones exhaustivas  
✅ Contratos de exportación listos  
✅ UI optimizada y contextual  
✅ Documentación exhaustiva  
✅ Sin fugas de autoridad

## Documentación

- [Arquitectura de Central](./documentacion/arquitectura-central.md)
- [Guía de Integración con el Ecosistema](./documentacion/integracion-ecosistema.md)

## Tecnologías

- **React Native** con Expo
- **TypeScript** (nomenclatura en español)
- **Firebase Realtime Database** (proyecto: base-principal-ma1)
- **Node.js Test Runner** para pruebas

## Licencia

Propietario — ADI Ecosystem

---

**Unidad Central** — Autoridad administrativa del ecosistema ADI
