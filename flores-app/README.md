# Flores de María

App móvil (iOS/Android) para gestionar los pedidos de brigadeiros de la
parroquia: pedidos, caja y gastos. Construida con **Expo + React Native** e
implementada 1:1 desde el handoff de diseño (`../design-handoff`).

> *Sólo Dios basta*

## Pantallas

1. **Login / Crear cuenta** — ingreso con email y contraseña; registro
   self-service (nombre, email, contraseña) con Firebase Auth.
2. **Pedidos** — resumen de pendiente de cobro, filtro *Todos / Mis pedidos*,
   tarjetas con estado de entrega y cobro (toggleables), *toast* con deshacer,
   y alta de pedido (hoja inferior).
3. **Nuevo pedido** — cliente, cantidad de cajas (chica/grande con stepper),
   monto sugerido, fecha de entrega, estado de entrega/cobro y nota.
4. **Caja** — saldo real calculado desde el libro de caja (`cash_movements`):
   ingresos, egresos, lista de movimientos y alta de entrega a parroquia /
   ajuste manual.
5. **Gastos** — total en insumos, movimientos y alta de gasto con comprobante.

## Cómo correr

```bash
npm install
npm run ios      # o: npm run android · npm start
```

Sin credenciales de Firebase la app funciona contra un **backend mock en
memoria** con los datos de ejemplo del diseño, así que se puede probar todo el
flujo de inmediato.

## Firebase

La capa de datos está detrás de servicios (`src/services`) listos para Firebase:

| Servicio          | Backend real      | Colección / recurso        |
| ----------------- | ----------------- | -------------------------- |
| `firebaseService` | Init del SDK      | Auth · Firestore · Storage |
| `authService`     | Firebase Auth     | `users/{uid}`              |
| `orderService`    | Cloud Firestore   | `orders`                   |
| `cashService`     | Cloud Firestore   | `cash_movements`           |
| `expenseService`  | Cloud Firestore   | `expenses`                 |
| `storageService`  | Firebase Storage  | `comprobantes/`            |

### Libro de caja (`cash_movements`)

La caja **no** depende de una sola colección de ingresos: cada cambio se registra
como un movimiento unificado con `type` (`order_payment` · `expense` ·
`parish_delivery` · `adjustment`) y `direction` (`in` · `out`). El saldo y los
totales se derivan de ahí (`cashService.getCashSummary`):
`balance = totalIn − totalOut`.

Consistencia entre colecciones:
- **Cobrar un pedido** crea un `order_payment` y guarda su id en
  `order.paymentMovementId` (descobrar lo revierte; nunca se duplica).
- **Crear un gasto** escribe el `expenses` doc y su `cash_movement` (type
  `expense`) en un **write batch** atómico, tras subir el comprobante a Storage.
- **Entregas a la parroquia** y **ajustes manuales** se cargan desde la pantalla
  de Caja.

Se usa el **Firebase JavaScript SDK** (compatible con Expo managed workflow). La
sesión de Auth persiste con AsyncStorage y Firestore usa long-polling
auto-detectado para evitar cuelgues de conexión en Android.

Para conectar el proyecto real:

1. Copiá tu config de Firebase a `flores-app/.env` (usá `.env.example` de guía).
   Completá las seis claves `EXPO_PUBLIC_FIREBASE_*`, incluido `STORAGE_BUCKET`.
2. **Publicá las reglas de seguridad** (Firestore está en modo *Production* →
   por defecto niega todo). En la consola de Firebase pegá:
   - `firestore.rules` → Firestore Database → Reglas
   - `storage.rules` → Storage → Reglas
3. Reiniciá el bundler. `isFirebaseConfigured` pasa a `true` y todos los
   servicios usan Firebase automáticamente (sin tocar las pantallas).
4. Registrá la primera cuenta desde **Crear cuenta** en la app (o en
   **Authentication → Users** de la consola). El alta crea el usuario en Auth y
   su documento `users/{uid}` (`role: "user"`, `active: true`).

> `localStorage` **no** se usa como persistencia principal. AsyncStorage guarda
> sólo la sesión de Auth; el resto de los datos vive en Firebase. Sin `.env` la
> app corre contra el mock en memoria.

## Estructura

```
src/
  components/   UI reutilizable (Flower, OrderCard, SegmentedControl, Stepper, BottomSheet…)
  screens/      Login, Register, Pedidos, NuevoPedido, Caja, NuevoMovimiento, Gastos, NuevoGasto
  services/     firebaseService, authService, orderService, cashService, expenseService, storageService (+ mock)
  navigation/   RootNavigator (auth gate) + MainTabs (tab bar custom)
  theme/        colors, fonts, shadows
  lib/          auth context, formato es-AR, constantes
  types/        modelos de dominio (Order, Expense, CashMovement, UserProfile…)
```
