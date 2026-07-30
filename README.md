# Plan TOEFL — Meta 90 en 17 semanas

App de preparación para el TOEFL iBT. Next.js (App Router) + TypeScript + Tailwind CSS v4, 100% del lado del cliente.

## Arrancar

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Primer uso
1. Se te pedirá crear una contraseña (mínimo 6 caracteres). A partir de ahí todos tus datos se cifran con AES-256 (PBKDF2 + AES-GCM vía Web Crypto) directamente en tu navegador — nadie puede leer tu calendario, tus puntajes o tus notas sin ella.
2. **Si olvidas la contraseña, no hay forma de recuperar los datos** (así funciona el cifrado real). Usa **"Exportar respaldo"** de vez en cuando para guardar una copia sin cifrar en un lugar seguro. **"Importar"** la restaura.

## Qué incluye
- **Premio (Semanas 1–8):** progreso hacia ganarte la tablet — constancia (días de estudio marcados en el calendario) + mejora real en el Checkpoint 2 frente a tu diagnóstico.
- **Calculadora de metas:** entra tu diagnóstico y calcula automáticamente tus metas para las semanas 4, 8, 12 y 16.
- **Calendario de estudio y ánimo:** marca cada día si estudiaste, cómo te sentiste (1–5) y una nota corta.
- **Planning semanal:** plan editable por día para cualquier semana.
- **Las 17 semanas:** el plan completo con lecciones específicas de tus cursos y libros, con checkboxes.
- **Registro de progreso:** tabla y gráfico de tus puntajes reales en cada checkpoint.

## Estructura del proyecto

```
src/
  app/              # App Router: layout, página raíz, estilos globales
  components/       # Componentes de UI (todos tipados, sin lógica de negocio)
  context/          # PlanStore: auth (cifrado/login) + estado de datos de la app
  lib/              # crypto, fechas, tipos, cálculo de metas/premio/racha (funciones puras)
  data/             # Contenido del plan (17 semanas, checkpoints) como datos tipados
```

La app se monta solo en el cliente (`next/dynamic` con `ssr: false`) porque todo su estado vive en `localStorage` cifrado — no hay nada que renderizar en el servidor.

## Scripts

```bash
npm run dev     # servidor de desarrollo
npm run build   # build de producción (incluye chequeo de tipos)
npm run start   # sirve el build de producción
npm run lint    # ESLint
```

## Sobre la nube (Supabase)
Por ahora todo se guarda **solo en este dispositivo**. Cuando se conecte el MCP de Supabase, se puede migrar este modelo de datos (mismo esquema: `baseline`, `weekDone`, `tracker`, `studyLog`, `weeklyPlan`, ver `src/lib/types.ts`) a tablas reales con Supabase Auth reemplazando el login local — el botón "Exportar respaldo" es el puente para no perder lo ya registrado.
