# Informe Detallado de la Plataforma: BejMen (Panel de Gestión de Turnos)

## 1. Resumen Ejecutivo
La plataforma es una aplicación web diseñada para la **gestión, programación y asignación de turnos** enfocada en mensajeros (o personal logístico) y clientes. Permite llevar un control detallado de las agendas de trabajo, optimizando el emparejamiento de turnos y personal mediante la visualización interactiva y el uso de Inteligencia Artificial.

## 2. Stack Tecnológico y Arquitectura
El proyecto es una aplicación moderna de React construida sobre el framework Next.js, utilizando Vercel para la infraestructura en la nube.

- **Framework Principal:** Next.js (versión 15.3.8) con React 18 y el empaquetador Turbopack.
- **Lenguaje:** TypeScript, garantizando tipado estático y mayor seguridad en el código.
- **Estilos y UI:** 
  - Tailwind CSS para utilidades de diseño.
  - Radix UI y shadcn/ui para componentes accesibles y personalizables.
  - `next-themes` para soporte de modos Claro/Oscuro.
  - `lucide-react` para la iconografía.
- **Gestión de Formularios y Validación:** `react-hook-form` junto con `zod` para validaciones de esquemas robustos.
- **Infraestructura (Backend/Hosting):** Firebase (App Hosting, con SDK v11.9.1).
- **Inteligencia Artificial:** `@genkit-ai/googleai` y `genkit` (v1.13.0) para implementar flujos basados en LLMs (modelos de lenguaje grandes).
- **Utilidades:** `date-fns` para la compleja manipulación de fechas y calendarios, y `jspdf` para exportación de reportes.

## 3. Modelos de Datos Principales
El sistema gira en torno a tres entidades clave (definidas en `src/lib/types.ts`):

1. **Mensajeros (`Messenger`):**
   - Tienen estados específicos: activo, inmovilizado, de baja, etc.
   - Guardan sus preferencias de turno (día, noche, cualquiera).
   - Tienen un registro de los días de la semana en los que están disponibles.
2. **Clientes (`Client`):**
   - Entidades a las que se les prestan los servicios y se les asocian los turnos.
3. **Turnos (`Shift`):**
   - Contienen la fecha, bloque horario (ej. "08:00 - 16:00"), ID del cliente y, opcionalmente, el ID del mensajero asignado.
   - Permiten guardar notas o requerimientos especiales.

## 4. Funcionalidades Principales de la Aplicación
El dashboard interactivo (`DashboardClient`) concentra gran parte de las operaciones:

- **Vistas Múltiples:** Dispone de una vista general de "Agenda" (calendario mensual/semanal) y una vista específica orientada a cada "Mensajero".
- **Gestión CRUD Completa:** Permite crear, leer, actualizar y eliminar Clientes, Mensajeros y Turnos utilizando diálogos modales.
- **Herramientas de Productividad de Agenda:** 
  - Copiar turnos en lote de un día hacia otro.
  - Eliminación masiva de turnos (por día o por semana).
  - Filtrado avanzado (ver turnos sin asignar, filtrar por cliente) y agrupamiento (por cliente o mensajero).
- **Exportación de Datos:** Funcionalidad para exportar el registro de la información.
- **Autenticación Básica / Token:** Incluye un sistema de "Token de Acceso de Administrador" para poder sincronizar dispositivos o brindar acceso restringido al panel.
- **Personalización Visual:** Soporte para cambiar entre modo oscuro y claro.

## 5. Integración pendiente para Inteligencia Artificial (Genkit)
La plataforma integrara flujos avanzados de IA que resuelven problemas operativos:

1. **Asignación Inteligente de Turnos (`suggest-shift-assignments.ts`):** 
   - Un flujo que toma como parámetros la disponibilidad de los mensajeros, los requisitos del turno y restricciones de horario, y devuelve sugerencias estructuradas sobre qué mensajero debería cubrir qué turno, optimizando el calendario y minimizando conflictos. Incluye justificaciones textuales elaboradas por la IA para explicar las decisiones.
2. **Automatización de Backups en la Nube (`drive-backup-flow.ts`):** 
   - Un flujo automatizado que consolida todos los datos de la aplicación (clientes, mensajeros, turnos) en un archivo JSON (`turno_maestro_backup.json`) y lo respalda automáticamente dentro de una carpeta específica de Google Drive. Permite tanto guardar el estado actual como restaurar la base de datos a partir del backup.

## 6. Estructura del Proyecto

- `src/app/`: Contiene las rutas principales de Next.js (layout global y página principal del panel).
- `src/components/`: Conjunto robustgit o de componentes de interfaz. Destacan los diálogos interactivos de acción y los componentes que arman la tabla de turnos. Incluye la carpeta `/ui` con primitivas de shadcn.
- `src/ai/`: Lógica de inteligencia artificial y Genkit. Contiene la configuración (`genkit.ts`) y las carpetas de flujos (`flows/`).
- `src/hooks/`: Hooks personalizados de React, que manejan el estado global de los datos, el enrutamiento y las notificaciones.
- `src/lib/`: Utilidades generales y definición formal de tipos.
- `apphosting.yaml`: Archivo para el despliegue nativo en Firebase App Hosting.
- `package.json`: Define el entorno Node, con scripts para inicializar tanto el servidor de Next.js como la interfaz de desarrollador de Genkit (`genkit:dev`).