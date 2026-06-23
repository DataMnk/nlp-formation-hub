# Formation Hub
### Plataforma de formación con autenticación, roles y chatbot RAG

Formation Hub es una aplicación full-stack para gestionar consagraciones de formación espiritual: programas secuenciales de formación mensual (cartas), con acceso diferenciado por rol y un chatbot de preguntas y respuestas basado en el contenido de las cartas (RAG).

---

## Aplicación en vivo

https://whimsical-salamander-0c7593.netlify.app/

---

## Resumen

La aplicación está construida alrededor de un sistema de roles seguro: los usuarios se autentican vía Supabase, gestionan su perfil, y los administradores gestionan programas y cartas de formación. Los miembros consultan las cartas publicadas de su programa y pueden interactuar con un chatbot que responde basándose únicamente en el contenido de esas cartas.

- El frontend maneja la UI, el ruteo y el estado del cliente.
- Supabase gestiona autenticación, base de datos, RLS y Edge Functions.
- pgvector habilita búsqueda semántica sobre el contenido de las cartas.
- Las Edge Functions manejan de forma segura la generación de embeddings y la orquestación del RAG.

---

## Funcionalidades principales

### Autenticación y control de acceso por rol
- Autenticación por email/contraseña vía Supabase Auth
- Sesión persistente
- Rutas diferenciadas por rol (`admin` y `member`)
- Row Level Security para aislar datos por usuario y programa

### Perfiles de usuario editables
- Ver y actualizar información de perfil
- Acceso únicamente a los propios datos bajo políticas RLS

### Arquitectura de base de datos (Supabase + PostgreSQL)

Tablas principales:
- `programs` — consagraciones (programas de formación secuenciales)
- `profiles` — perfil de usuario, rol, programa asignado
- `letters` — cartas de formación mensuales, con preguntas de comprensión
- `letter_chunks` — fragmentos vectorizados de las cartas (pgvector)

Características:
- Relaciones por foreign key
- Políticas de Row Level Security en todas las tablas
- Extensión pgvector habilitada
- Reglas de propiedad de datos seguras

### Búsqueda vectorial y pipeline RAG

1. El contenido de las cartas se fragmenta (chunking).
2. Se generan embeddings vía Edge Function.
3. Los vectores se almacenan con pgvector.
4. La pregunta del usuario activa una búsqueda por similitud (top-k).
5. Los fragmentos relevantes se inyectan en el prompt del LLM.
6. El LLM genera una respuesta contextual, citando las cartas como fuente.

### Supabase Edge Functions

- `ingest-letters` — fragmenta el contenido y genera embeddings.
- `rag-chat` — realiza la búsqueda por similitud y genera la respuesta contextual.

Los secretos se almacenan de forma segura en las variables de entorno de Supabase y nunca se exponen al frontend.

---

## Stack técnico

**Frontend**
- React 19 (Vite + TypeScript)
- React Router
- CSS custom (variables CSS, sin librería de UI externa)

**Backend**
- Supabase (Auth + PostgreSQL + Edge Functions)

**IA y búsqueda**
- pgvector
- Embeddings vía Edge Function (OpenAI)
- Respuestas contextuales con GPT-4o-mini

**Deployment**
- Netlify (CI/CD vía GitHub)

---

## Variables de entorno

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Los secretos de las Edge Functions se configuran en Supabase, no aquí.

---

## Desarrollo local

```bash
git clone https://github.com/DataMnk/nlp-formation-hub.git
cd nlp-formation-hub
npm install
npm run dev
```

---

## Deployment

La aplicación se despliega vía Netlify con CI/CD habilitado desde la rama `main`. Cada push a `main` dispara un build de producción automático.

---

## Notas de arquitectura

- El estado de autenticación persiste tras refrescar la página.
- RLS asegura que los usuarios no puedan acceder a registros de otros usuarios o programas.
- La búsqueda por similitud vectorial usa distancia coseno.
- Los embeddings se generan del lado del servidor vía Edge Functions.

---

## Licencia

MIT License — ver `LICENSE.MD`.