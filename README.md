# Convivencia Escolar MVP

Plataforma de gestión y prevención de la convivencia escolar, gamificada, construida con Next.js 16, Prisma y PostgreSQL.

Permite registrar incidentes de convivencia (maltrato, acoso, agresión, ciberacoso, etc.), seguir un protocolo de 8 pasos alineado a la **Ley 20.536** de Violencia Escolar, y reconocer conductas positivas a través de un sistema de puntos por curso y por estudiante.

## Stack

- **Next.js 16.2** (App Router, Turbopack, Server Actions)
- **React 19**
- **Prisma 5** + **PostgreSQL** (Neon en producción)
- **Tailwind CSS v4** + **shadcn/ui** (base-nova, @base-ui/react)
- **Zod** (validación)
- **TypeScript 5**

## Roles

| Rol          | Capacidades                                                              |
|--------------|--------------------------------------------------------------------------|
| `ADMIN`      | Gestión global del sistema                                               |
| `ENCARGADO`  | Coordina protocolos, resuelve y cierra casos                             |
| `DOCENTE`    | Reporta incidentes, otorga puntos por conducta positiva                 |
| `ESTUDIANTE` | Consulta sus puntos, ranking de su curso e incidentes donde figura        |
| `APODERADO`  | Seguimiento de casos relacionados a su pupilo                            |

> ⚠ El proyecto incluye un **login demo por rol** basado en cookie httpOnly. Reemplazar por NextAuth.js antes de uso productivo real (ver `PROGRESO.md`).

## Estructura

```
src/
├── app/
│   ├── api/                # API routes protegidas
│   ├── dashboard/          # Layout autenticado
│   │   ├── protocolos/     # Lista, detalle y creación de casos
│   │   └── gamificacion/   # Ranking de cursos y otorgamiento de puntos
│   ├── login/              # Selección de rol demo
│   ├── layout.tsx          # Root layout (Sonner, fuentes)
│   └── page.tsx            # Redirect a /login
├── components/ui/          # Componentes shadcn/ui
├── lib/
│   ├── actions.ts          # Server actions (createIncident, awardPoints, …)
│   ├── auth.ts             # Demo auth (cookies httpOnly)
│   ├── constants.ts        # ROLES, tipos, severidades, pasos del protocolo
│   ├── db.ts               # Prisma client singleton
│   └── utils.ts            # cn() helper
└── proxy.ts                # Next.js 16 proxy (antes middleware) – protege /dashboard
prisma/
├── schema.prisma           # 6 modelos: User, Course, Incident, IncidentInvolved, ProtocolStep, PointTransaction
├── migrations/
└── seed.ts                 # Datos de prueba (1 admin, 1 encargado, 2 docentes, 15 estudiantes, 5 cursos, 4 incidentes)
```

## Desarrollo local

### 1. Instalar dependencias

```bash
npm install
```

### 2. Levantar PostgreSQL con Docker

```bash
docker compose up -d
```

Crea un contenedor Postgres con `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/convivencia`.

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Por defecto apunta al Postgres local. Si usas otra URL, edita `.env`.

### 4. Aplicar migraciones y sembrar

```bash
npm run build        # ejecuta prisma migrate deploy + next build
npx prisma db seed   # crea usuarios/cursos/incidentes de prueba
```

O para desarrollo:

```bash
npm run dev
```

### 5. Visitar

http://localhost:3000

Elige cualquier rol en la pantalla de login (no requiere contraseña en el demo).

## Comandos

| Comando               | Descripción                                                 |
|-----------------------|-------------------------------------------------------------|
| `npm run dev`         | Inicia el servidor de desarrollo (Turbopack)                |
| `npm run build`       | Aplica migraciones Prisma y compila para producción         |
| `npm run start`       | Sirve el build de producción                               |
| `npm run lint`        | Ejecuta ESLint                                              |
| `npm run seed`        | Ejecuta el seed manualmente (`tsx prisma/seed.ts`)          |
| `npx prisma studio`   | UI web para inspeccionar/editar la base de datos            |

## Deploy en Vercel

1. Crear cuenta y proyecto en [Neon](https://neon.tech) (Postgres serverless, plan gratuito).
2. Copiar el connection string con `?sslmode=require`.
3. Importar este repositorio en [Vercel](https://vercel.com/new).
4. Configurar variable de entorno en **Project Settings → Environment Variables**:
   - `DATABASE_URL` → la connection string de Neon
5. Deploy.

El `package.json` ya tiene:

- `postinstall`: `prisma generate` (necesario para que el cliente Prisma exista en Vercel)
- `build`: `prisma migrate deploy && next build` (aplica migraciones en cada build)
- `vercel.json`: solo `{ "framework": "nextjs" }` (la lógica de build vive en `package.json`)

Los push a `master` disparan deploys automáticos.

### Seed post-deploy

El seed **no** se ejecuta en cada build (solo las migraciones). Para sembrar la base de producción:

```bash
# Localmente, apuntando a la DB de Neon:
DATABASE_URL="postgresql://..." npx prisma db seed
```

O desde la consola de Vercel → *Functions → Connect to Git → Run Command* (no soportado en plan gratuito; la opción práctica es correr el seed localmente con la URL de Neon).

## Validación y seguridad

- **Server Actions** validados con **Zod** (`src/lib/actions.ts`).
- **Cookie de sesión** httpOnly + `secure` en producción (`src/lib/auth.ts`).
- **Proxy** (`src/proxy.ts`, antes middleware) bloquea `/dashboard/*` sin sesión.
- **API routes** (`/api/current-user`, `/api/students`) requieren sesión válida.
- **TypeScript estricto** (`tsconfig.json` → `strict: true`).

## Pendientes para la próxima fase

Ver [`PROGRESO.md`](./PROGRESO.md).

## Licencia

Privado / MVP.
