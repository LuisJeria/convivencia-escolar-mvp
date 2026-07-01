# Progreso — Convivencia Escolar MVP

## Estado del deploy

- **Repositorio:** `https://github.com/LuisJeria/convivencia-escolar-mvp`
- **Hosting:** Vercel (Next.js 16.2.9)
- **Base de datos:** Neon (PostgreSQL serverless)
- **URL producción:** _completar con la URL de Vercel_

## Configuración de deploy

- `vercel.json` creado con:
  - Framework: `nextjs`
  - Build command: `prisma generate && prisma migrate deploy && next build`
- `package.json`: scripts `build`, `vercel-build` y `postinstall` (`prisma generate`)
- Variable de entorno `DATABASE_URL` configurada en Vercel con la URL de Neon
- Auto-deploy desde GitHub vía push a `master`

## Base de datos

- **Provider:** PostgreSQL (Neon)
- **Migraciones:** aplicadas automáticamente en cada build (`prisma migrate deploy`)
- **Seed:** ejecutado manualmente (crea 1 admin, 1 encargado, 2 docentes, 15 estudiantes, 2 apoderados, 5 cursos, 4 incidentes de prueba y transacciones de puntos)

## Pendiente para próxima sesión

1. **Auth real:** reemplazar demo auth por NextAuth.js (o similar)
2. **URL de producción:** confirmar y documentar
3. **Pruebas:** verificar flujo completo con cada rol
4. **Fase 1:** implementar siguientes features según roadmap

## Archivos clave

| Archivo              | Propósito                                      |
|----------------------|------------------------------------------------|
| `vercel.json`        | Configuración de build en Vercel               |
| `prisma/schema.prisma` | Modelo de datos (6 modelos)                 |
| `prisma/seed.ts`     | Datos de prueba                                |
| `src/lib/auth.ts`    | Demo auth (cookies)                            |
| `src/middleware.ts`  | Protección de rutas `/dashboard/*`             |
| `src/lib/actions.ts` | Server Actions (CRUD incidentes y puntos)      |
