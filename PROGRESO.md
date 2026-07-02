# Progreso — Convivencia Escolar MVP

## Estado del deploy

- **Repositorio:** `https://github.com/LuisJeria/convivencia-escolar-mvp`
- **Hosting:** Vercel (Next.js 16.2.9)
- **Base de datos:** Neon (PostgreSQL serverless)
- **URL producción:** _completar con la URL de Vercel_

## Última revisión (2026-07-02)

### Cambios aplicados

| Área        | Cambio                                                                 |
|-------------|------------------------------------------------------------------------|
| Auth        | Cookie `demo_user` ahora es `secure` en producción + validación Zod del rol |
| Server Actions | Validación de inputs con Zod (createIncident, awardPoints, completeStep, resolveIncident, closeIncident) |
| API routes  | `/api/current-user` y `/api/students` ahora validan sesión y rol     |
| Dashboard   | "Cursos activos" ya no es hardcodeado (consulta real) + manejo APODERADO |
| UX          | `<a>` → `<Link>` en navegación interna, `redirect()` si no hay sesión |
| Next.js 16  | `middleware.ts` → `proxy.ts` (convención nueva, quita deprecation warning) |
| Tipos       | `any` → `Prisma.IncidentWhereInput`, type-safe en seed.ts            |
| vercel.json | Simplificado a `{ "framework": "nextjs" }` (build en package.json)   |
| Lint        | 0 errores, 0 warnings                                                 |
| Build       | Compila sin warnings (TypeScript strict + ESLint)                     |

### Configuración de deploy

- `vercel.json`: solo `{ "framework": "nextjs" }`
- `package.json`:
  - `postinstall`: `prisma generate` (necesario para Vercel)
  - `build`: `prisma migrate deploy && next build` (aplica migraciones en cada build)
- Variable de entorno `DATABASE_URL` configurada en Vercel con la URL de Neon (con `?sslmode=require`)
- Auto-deploy desde GitHub vía push a `master`

### Base de datos

- **Provider:** PostgreSQL (Neon en prod, Docker en local)
- **Migraciones:** aplicadas automáticamente en cada build (`prisma migrate deploy`)
- **Seed:** ejecutado manualmente (crea 1 admin, 1 encargado, 2 docentes, 15 estudiantes, 2 apoderados, 5 cursos, 4 incidentes de prueba y transacciones de puntos)

## Pendiente para próxima sesión

1. **Auth real:** reemplazar demo auth por NextAuth.js (o similar)
2. **URL de producción:** confirmar y documentar
3. **Pruebas:** verificar flujo completo con cada rol
4. **Fase 1:** implementar siguientes features según roadmap

## Archivos clave

| Archivo                | Propósito                                              |
|------------------------|--------------------------------------------------------|
| `vercel.json`          | `{ "framework": "nextjs" }`                            |
| `prisma/schema.prisma` | Modelo de datos (6 modelos)                            |
| `prisma/seed.ts`       | Datos de prueba                                        |
| `src/lib/auth.ts`      | Demo auth (cookies httpOnly + secure en prod)          |
| `src/lib/actions.ts`   | Server Actions con validación Zod                      |
| `src/proxy.ts`         | Protección de rutas `/dashboard/*` (Next.js 16)        |
| `src/app/api/*`        | Endpoints con auth check                               |
