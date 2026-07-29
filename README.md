# Movimiento Universitario — Consulta Electoral (versión con servidor)

Esta versión resuelve la búsqueda **en el servidor**. El navegador nunca
recibe el padrón completo (los 670 registros): solo pide `/api/consulta?valor=...`
y el servidor responde únicamente con el registro que coincide, si existe.

## Estructura

```
mu-servidor/
├── api/
│   ├── consulta.js      ← función serverless (hace la búsqueda)
│   └── registros.json   ← el padrón completo (solo vive aquí, en el servidor)
├── public/
│   └── index.html       ← la página que ve la gente (sin datos incrustados)
├── package.json
└── vercel.json
```

## Cómo publicarla (Vercel, gratis)

**Opción A — Sin usar la terminal:**

1. Crea una cuenta gratis en https://vercel.com (puedes entrar con GitHub, GitLab o email).
2. Sube esta carpeta a un repositorio de GitHub (puedes arrastrar los archivos
   directamente en github.com > "Add file" > "Upload files").
3. En Vercel, click en **"Add New… → Project"**, selecciona ese repositorio,
   y dale a **Deploy**. No necesitas cambiar ninguna configuración.
4. En 1–2 minutos te da una URL pública, por ejemplo
   `movimiento-universitario.vercel.app`.

**Opción B — Con la terminal (más rápido si ya tienes Node instalado):**

```bash
npm install -g vercel
cd mu-servidor
vercel --prod
```

Sigue las preguntas en pantalla (te pedirá iniciar sesión la primera vez) y
al final te entrega la URL pública.

## Actualizar el padrón más adelante

Cuando tengas una nueva versión del Excel, solo necesitas regenerar
`api/registros.json` con las mismas columnas (`registro`, `nombre`, `docto`,
`vota`, `mesa`, `delegado`) y volver a desplegar (`vercel --prod` de nuevo, o
un nuevo push a GitHub si usaste la Opción A — Vercel vuelve a desplegar
automáticamente con cada push).

## Seguridad — qué mejora esta versión y qué sigue pendiente

**Mejora respecto a la versión anterior (todo en el HTML):**
- El archivo `registros.json` con nombres y cédulas ya no se descarga al
  navegador de cada visitante — solo lo lee la función en el servidor.
- La respuesta de la API solo incluye registro, nombre, mesa, estado y
  delegatura — nunca la cédula completa ni el resto del padrón.
- Hay un límite simple de 20 consultas por minuto por IP para dificultar que
  alguien intente "barrer" todos los registros probando números al azar.

**Lo que esta versión NO resuelve (queda como siguiente paso si lo necesitas):**
- No hay control de acceso (usuario/contraseña, o restricción a la red de la
  universidad). Cualquiera con el link puede consultar cualquier registro que
  adivine o conozca.
- El límite de 20/min por IP es básico; no protege contra un ataque más
  organizado (múltiples IPs, por ejemplo).
- No hay HTTPS propio que configurar — Vercel lo da automáticamente, pero si
  migras a otro proveedor confirma que también lo incluya.

Si quieres, puedo añadir un inicio de sesión simple (por ejemplo, que cada
estudiante solo pueda consultar su propio registro con una contraseña o con
un enlace único) para cerrar el primer punto.
