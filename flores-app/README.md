# Flores de María

App móvil (iOS/Android) para gestionar los pedidos de brigadeiros de la
parroquia: pedidos, caja y gastos. Construida con **Expo + React Native** e
implementada 1:1 desde el handoff de diseño (`../design-handoff`).

> *Sólo Dios basta*

## Pantallas

1. **Login** — ingreso con email y contraseña.
2. **Pedidos** — resumen de pendiente de cobro, filtro *Todos / Mis pedidos*,
   tarjetas con estado de entrega y cobro (toggleables), *toast* con deshacer,
   y alta de pedido (hoja inferior).
3. **Nuevo pedido** — cliente, cantidad de cajas (chica/grande con stepper),
   monto sugerido, fecha de entrega, estado de entrega/cobro y nota.
4. **Caja** — saldo en caja (ingresos − gastos), totales y cobros recientes.
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

| Servicio          | Backend real        | Colección / recurso        |
| ----------------- | ------------------- | -------------------------- |
| `authService`     | Firebase Auth       | Email/Password             |
| `orderService`    | Cloud Firestore     | `orders`                   |
| `cashService`     | Cloud Firestore     | `incomes`                  |
| `expenseService`  | Firestore + Storage | `expenses` + `comprobantes/` |

Para conectar un proyecto real:

1. Creá un proyecto en Firebase y habilitá **Auth (Email/Password)**,
   **Firestore** y **Storage**.
2. Copiá `.env.example` a `.env` y completá las claves `EXPO_PUBLIC_FIREBASE_*`.
3. Reiniciá el bundler. `isFirebaseConfigured` pasa a `true` y los servicios
   usan Firestore/Auth/Storage automáticamente (sin tocar las pantallas).

> `localStorage` **no** se usa como persistencia principal — sólo el mock en
> memoria para desarrollo. La persistencia real vive en Firebase.

## Estructura

```
src/
  components/   UI reutilizable (Flower, OrderCard, SegmentedControl, Stepper, BottomSheet…)
  screens/      Login, Pedidos, NuevoPedido, Caja, Gastos, NuevoGasto
  services/     authService, orderService, cashService, expenseService (+ firebase, mock)
  navigation/   RootNavigator (auth gate) + MainTabs (tab bar custom)
  theme/        colors, fonts, shadows
  lib/          auth context, formato es-AR, constantes
  types/        modelos de dominio (Order, Expense, Income…)
```
