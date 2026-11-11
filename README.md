# notes-cli

Una app de notas por línea de comandos, en TypeScript. Node corre el TypeScript directo, sin build.
Es uno de los repos del taller "Software factories with Claude Code".

## Cómo funciona

La fábrica toma un ticket (un issue de este repo) y lo convierte en un pull request: cuatro agentes de Claude
(`planner`, `builder`, `checker`, `reviewer`), cada uno en su propia sesión y sin conocerse entre sí, más tus
revisiones automáticas (los gates). **Te pregunta una sola cosa:** después del plan espera a que lo apruebes o
lo rechaces con lo que hay que cambiar. Desde ahí sigue sola y siempre termina en un PR, aprobado o
`[REJECTED]` con el motivo.

## 1. Copia el repo (antes del taller)

Necesitas una cuenta de Claude con Claude Code, `gh` con sesión iniciada (`gh auth login`, luego
`gh auth setup-git`) y Node 24 o más nuevo (`node --version`).

```zsh
gh repo fork sgomezahumada/notes-cli --clone && cd notes-cli
npm ci
node src/cli.ts add "mi primera nota" && node src/cli.ts list
./doctor.sh      # repítelo hasta que diga "doctor: all green"
```

Es un fork, no solo un clone: así tienes tu propia copia en GitHub, la fábrica puede subir tu rama y abrir
el PR de vuelta a este repo, donde lo vemos todos.

## 2. Antes de arrancar, cambia lo que quieras

| Archivo | Qué controla |
|---|---|
| `AGENTS.md` | el contexto y las reglas que leen los agentes |
| `gates/` | tus revisiones automáticas (lee [`gates/README.md`](gates/README.md)) |
| `.claude/agents/` | quién es cada agente: un archivo por fase (`planner.md`, `builder.md`, `checker.md`, `reviewer.md`), con su prompt debajo del frontmatter. No le cambies el `name:` |
| `factory.conf` (avanzado) | qué rutas pueden cambiar los agentes (`SCOPE`), qué comandos pueden correr, el modelo |

No toques `factory.sh`, `lib/` ni `doctor.sh`: son el motor. Después, haz commit en `main`:

```zsh
git add -A && git commit -m "mi fábrica"
```

## 3. Arranca

El día del taller, primero pega en la terminal las tres líneas `export …` que mostramos en pantalla (son
para el tablero de la sala). Luego:

```zsh
./factory.sh 1   # el número del ticket
```

Primero el `planner` escribe el plan (`.factory/plan.md`) y la fábrica te espera: léelo y escribe `y` + Enter
para aprobarlo, o `n <qué cambiar>` + Enter para que escriba otro con tu comentario. Después corre sola, unos 2
minutos. No toques el repo mientras corre. Mira la terminal: cada fase muestra lo que hace.

## 4. Lee el PR, cambia una cosa, repite

Tu PR aparece en https://github.com/sgomezahumada/notes-cli/pulls. Nada se mergea: los PRs sirven para comparar
el tuyo con el de los demás para el mismo ticket. Al terminar vuelves a `main`: haz tu siguiente cambio ahí
y vuelve a correr.

## Los tickets

- #1 y #2: búsqueda y etiquetas.
- #3 pide colores con una librería que no está en `package.json`. Este repo trae `gates/no-new-deps.sh`, que lo detecta.
