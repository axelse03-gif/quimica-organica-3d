# Química Orgánica 3D

Plataforma didáctica e interactiva de Química Orgánica y nomenclatura IUPAC.
Toda la información química sale de `src/data/quimica_organica_3d.json` (única fuente de datos).

**Stack:** React 19 · Vite · Three.js + `@react-three/fiber` + `@react-three/drei` · Tailwind CSS v4 · lucide-react

## Instalar y ejecutar

```bash
npm install
npm run dev        # http://localhost:5173
```

Otros comandos:

```bash
npm run build      # build de producción en dist/
npm run preview    # sirve el build en http://localhost:4173
npm run test:all   # motor + nomenclatura + constructor ampliado + práctica + manual + preguntas + componentes + escena 3D
```

Requiere Node 20.19+ (probado con Node 22).

## Módulos

| Módulo | Qué hace |
|---|---|
| **Visor 3D** | Esferas CPK y cilindros (simple / doble / triple / aromático) generados desde cada compuesto. Rotación orbital, zoom, pan, reset, 3 estilos (bolas y varillas, espacio lleno, varillas), ocultar H, etiquetas, auto-rotación. Buscador en tiempo real (nombre, fórmula, familia o grupo funcional) y filtro por familia. Panel con nombres, fórmulas, familia, hibridación, geometría, prioridad IUPAC y ficha didáctica. |
| **Familias y nomenclatura** | Las 14 familias de `familias_y_grupos` con fórmula general, hibridación, geometría y escalera de prioridad; teoría con los 5 pasos del algoritmo, la tabla de raíces (1–14 C) y la jerarquía de grupos. |
| **Constructor** | Cadenas de 1 a 10 carbonos: clic en un enlace para sencillo → doble → triple. Grupos terminales (-CHO, -COOH, -CONH₂, -C≡N, ésteres -COOCH₃/-COOC₂H₅/-COOC₃H₇/-COOCH(CH₃)₂) y sustituyentes: -OH, =O, aminas primarias, secundarias y terciarias (-NHCH₃, -N(CH₃)₂…), éteres (alcoxi: metoxi, etoxi, propoxi, isopropoxi), halógenos (F, Cl, Br, I) y ramas metil, etil, propil e isopropil. Valencias controladas, regla de la cadena más larga y nombre IUPAC dinámico con la traza del algoritmo, detección de coincidencia con la base y botón **Renderizar en 3D**. |
| **Manual** | Manual de estudio: fundamentos, método de 5 pasos, sustituyentes, una sección por familia (13) con regla, ejemplos resueltos, errores frecuentes e isomería, prioridad de grupos, isomería y checklist de parcial. Cada ejemplo se puede **armar en el Constructor**, ver en 3D o abrir en el visor; el progreso («estudiada») queda guardado en el navegador. |
| **Práctica** | Práctica de parcial: ejercicios **aleatorios** (con semilla, por familia, cantidad, tipo y dificultad) o las **hojas fijas** (Tema A, Tema B, Práctica A y B). En cada uno se **clasifica** el compuesto y se **nombra** la fórmula o se **construye** la estructura de un nombre dentro del espacio del Constructor. Modo práctica (corrección inmediata, pistas, 3D, traza del nombre) o simulacro (sin ayudas, nota /10 al final con tabla de resultados, repetir los fallados). La corrección acepta «2-pentanona» y «pentan-2-ona». |
| **Desafíos** | Quiz con puntaje, racha, feedback instantáneo y repaso. Banco de 105 preguntas: 3 del JSON, 92 generadas desde sus datos (hibridación, fórmulas generales, prioridades, sufijos/prefijos, raíces, nombres) y 10 complementarias de isomería/hibridación (marcadas como tales en la interfaz). |

## Cómo funciona el motor 3D (`src/lib/chem/`)

El JSON sólo trae `nodos_3d` para 4 de 19 compuestos (y sin hidrógenos, salvo el metano). Por eso:

1. `formulaParser.js` convierte `formula_semidesarrollada` (`CH3-CH(CH3)-CH2-CH3`, `CH3-CHOH-COOH`, `(CH2)4`…) en un grafo con todos los H explícitos y valencias verificadas.
2. `embed3d.js` calcula las coordenadas por relajación de restricciones: longitudes de enlace, ángulos según hibridación (sp³ 109.5°, sp² 120°, sp 180°), anillos, conformación escalonada, planaridad y cis/trans en dobles enlaces (el nombre `trans-…` del JSON decide la estereoquímica).
3. Las `pos_3d_hint` del JSON se usan como semilla; si el JSON trae *todos* los átomos (metano) se usan tal cual.
4. `nomenclature.js` implementa el algoritmo de nombrado leyendo prefijos de cadena y jerarquía directamente de `reglas_nomenclatura`.

## Estructura

```
src/
  data/            JSON + índices/búsqueda + preguntas complementarias + manual.js + hojas.js
  lib/chem/        parser, geometría 3D, modelo de cadena, nomenclatura, huella canónica
  lib/quiz.js      banco y sorteo de preguntas
  lib/practice.js  generador aleatorio, hojas, corrección y nota de la Práctica
  components/      MoleculeScene (R3F), MoleculeStage (toolbar), CompoundList, CompoundInfo, Formula, ChainEditor, NamePanel
  views/           ViewerView, ExplorerView, BuilderView, ManualView, PracticeView, QuizView
scripts/           pruebas del motor en Node
tests/             pruebas de componentes y de la escena 3D (Vitest)
```

## Agregar contenido

- Compuestos del visor: `src/data/quimica_organica_3d.json` → `base_compuestos`.
- Hojas de práctica propias: `src/data/hojas.js` (cada ítem es `F(fórmula, modelo)` o `N(nombre, modelo)`).
- Teoría y ejemplos: `src/data/manual.js`. `npm run test:engine` verifica que cada ejemplo del manual produzca el nombre que declara.

## Notas sobre los datos

- `comp_07` (ciclobutano) describe su isomería con el 1-buteno como «de función»; en rigor es isomería ciclo-cadena (de cadena). Se muestra tal cual está en el JSON.
- La jerarquía del JSON no incluye prefijo para cicloalcanos ni aromáticos; la interfaz lo indica en lugar de inventarlo.

## Publicar en GitHub y actualizar

```bash
git init -b main
git add .
git commit -m "Primera versión"
git remote add origin https://github.com/TU_USUARIO/quimica-organica-3d.git
git push -u origin main
```

En GitHub: **Settings → Pages → Source: GitHub Actions**. Cada `git push` a `main` corre las pruebas, compila y publica en `https://TU_USUARIO.github.io/quimica-organica-3d/`.

Para actualizar: editar → `npm run test:all` → `git add .` → `git commit -m "qué cambié"` → `git push`.
