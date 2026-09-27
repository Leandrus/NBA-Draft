# 🏀 Ultimate Draft

[![NBA](https://img.shields.io/badge/NBA-Oficial-17408B.svg?style=for-the-badge&logo=nba)](https://www.nba.com)
[![Jugadores](https://img.shields.io/badge/Jugadores-1%2C000%20Atletas%20Reales-C9082A.svg?style=for-the-badge)](data/players.json)
[![Estado](https://img.shields.io/badge/Estado-Producci%C3%B3n%20Lista-f1c40f.svg?style=for-the-badge)](#)
[![Plataformas](https://img.shields.io/badge/Plataformas-Smart%20TV%20%7C%20PC%20%7C%20M%C3%B3vil-blueviolet.svg?style=for-the-badge)](#)
[![Offline](https://img.shields.io/badge/Offline-100%25%20Funcional-success.svg?style=for-the-badge)](#)

> **Simulador web interactivo y competitivo de baloncesto para dos jugadores locales.**  
> Selecciona a tus leyendas y estrellas favoritas mediante mecánicas de **Draft con cartas aleatorias**, personaliza tus franquicias y enfréntate en una **simulación a alta velocidad basada en estadísticas reales de la NBA**.

---

## 📸 Vista General y Captura de Pantallas

| Menú Principal | Fase de Draft | Cancha Lista (Enfrentamiento) |
| :---: | :---: | :---: |
| 4 modos de juego con audio integrado | 20 cartas aleatorias por posición | Comparativa de plantillas y ratings OVR |

| Simulación en Vivo | Resultados & Estadísticas | Base de Datos (1,000 Jugadores) |
| :---: | :---: | :---: |
| Reloj ultra fluido y marcador dinámico | MVP del partido y estadísticas completas | Filtros por posición, búsqueda y ordenamiento |

---

## 🚀 Características Principales

### 1. 🌟 Base de Datos Real de 1,000 Jugadores NBA
- **200 jugadores por cada una de las 5 posiciones oficiales:**
  - ⛹️‍♂️ **Base (PG)**: Magic Johnson, Stephen Curry, Oscar Robertson, John Stockton, Chris Paul, Isiah Thomas, Steve Nash, Jason Kidd, Gary Payton, Russell Westbrook, etc.
  - 🎯 **Escolta (SG)**: Michael Jordan, Kobe Bryant, Dwyane Wade, Jerry West, Allen Iverson, James Harden, Clyde Drexler, Reggie Miller, Ray Allen, etc.
  - 🦅 **Alero (SF)**: LeBron James, Larry Bird, Kevin Durant, Julius Erving, Scottie Pippen, Kawhi Leonard, Luka Dončić, Elgin Baylor, Dominique Wilkins, etc.
  - 🔨 **Ala-Pívot (PF)**: Tim Duncan, Karl Malone, Kevin Garnett, Dirk Nowitzki, Charles Barkley, Giannis Antetokounmpo, Anthony Davis, Bob Pettit, Dennis Rodman, etc.
  - 🛡️ **Pívot (C)**: Kareem Abdul-Jabbar, Wilt Chamberlain, Bill Russell, Shaquille O'Neal, Hakeem Olajuwon, Nikola Jokić, David Robinson, Moses Malone, Patrick Ewing, etc.
- **IDs Oficiales de la NBA**: Carga directa de fotos de alta calidad desde la CDN oficial de la NBA (`https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/{id}.png`) con fallback SVG sin dependencias rotas.
- **6 Ratings Calibrados por Jugador**:
  - `t2`: Tiro de 2 puntos y anotación interior (1-99).
  - `t3`: Tiro de triples (1-99).
  - `reb`: Habilidad reboteadora (1-99).
  - `ast`: Capacidad de pase y asistencias (1-99).
  - `stl`: Robos de balón y anticipación defensiva (1-99).
  - `blk`: Bloqueos e intimidación bajo el aro (1-99).
  - `rat`: Rating General ponderado (OVR 75-99).

### 2. 🎮 4 Modos de Juego Completos
- 🃏 **Modo Normal**: Las 20 cartas del draft inician ocultas. Incluye la función **Scout**, que revela 5 cartas al azar (foto + nombre) aplicando una penalización del 5% en el rendimiento del equipo durante el partido.
- 👁️ **Modo Libre**: Todas las cartas están descubiertas desde el inicio. Sin penalizaciones.
- ⚡ **Modo 3x3**: Duelo veloz en media cancha con quintetos reducidos a 3 jugadores. El pool de draft combina jugadores de posiciones PF, SF, SG y PG mezclados.
- 🏆 **Las Finales (Bo7)**: Serie completa al mejor de 7 partidos (gana el primero en ganar 4 encuentros). Rastreador de partidos, retención de quintetos y coronación del Campeón y MVP de la Serie.

### 3. ⏱️ Motor de Simulación Probabilístico Fluido
- **Duración del Cuarto**: 30 segundos reales cronometrados.
- **Reloj NBA**: Desciende de `12:00` a `0:00` segundo a segundo con precisión digital.
- **Pausa de Entretiempo**: 3 segundos reales con modal centralizado de marcador parcial.
- **Tiempo Extra (Overtime)**: Si hay empate al término del 4to cuarto, se disputan periodos extra de 5 minutos NBA hasta definir un ganador.
- **Play-by-Play en Vivo**: Registro dinámico de jugadas con emojis (🏀 Canastas, 👐 Rebotes, 👟 Asistencias, 🚫 Bloqueos, 🥷 Robos) resaltados con el color de cada franquicia.
- **Box Score Detallado**: Tablas completas con PTS, REB, AST, ROB, TAP, TC y FG%.

### 4. 🔊 Motor de Audio y Música (Web Audio API & BGM)
- **Música de fondo continua (`music_bkg_loop.mp3`)**: Bucle infinito inmersivo con atenuación inteligente (*ducking*) durante celebraciones.
- **Fanfarria de victoria y MVP (`music_victory.mp3`)**: Sonido especial de celebración reproducido una única vez al coronar al equipo ganador y MVP.
- **Efectos procedurales sintetizados en tiempo real (Web Audio API)**:
  - 📯 Bocina de arena (buzzer) en finales de cuarto y partido.
  - 💨 Sonido realista de *swish* de red al encestar.
  - 🎺 Silbato arbitral en el salto inicial y faltas.
  - 🛡️ Sonidos de impacto para taponazos y robos defensivos.
  - 👏 Ovación y clamor del público en victorias y momentos MVP.
  - 🃏 Sonido de volteo de carta en el draft.
  - 🔕 Control de silencio con memoria en `localStorage`.

### 5. 📺 Navegación Espacial Multi-Dispositivo (10ft Smart TV, PC y Móvil)
- **Smart TVs y Consolas**: Compatible con mandos direccionales (D-Pad: Arriba, Abajo, Izquierda, Derecha, Enter/OK, Back/Escape) y Gamepads USB/Bluetooth (estándar HTML5 Gamepad API). Foco visual de alto contraste dorado.
- **PC**: Soporte completo con ratón, efectos hover 3D y atajos de teclado.
- **Mobile**: Diseño *touch-first* con rejilla adaptable (2 a 5 columnas) y tablas horizontales desplazables.

---

## 📂 Arquitectura del Proyecto

El código está modularizado y desacoplado para máxima mantenibilidad y rendimiento:

```text
Ultimate-Draft/
├── audio/
│   ├── music_bkg_loop.mp3   # Música de fondo continua en bucle infinito
│   └── music_victory.mp3    # Fanfarria de victoria y coronación MVP
├── css/
│   └── style.css            # Sistema de diseño, glassmorphism, paleta NBA y animaciones
├── data/
│   └── players.json         # Base de datos en JSON con 1,000 jugadores (200 x posición)
├── js/
│   ├── data/
│   │   └── players.js       # Módulo exportable de la base de datos de jugadores
│   ├── app.js               # Controlador principal, ciclo de vida, draft y UI routing
│   ├── audio.js             # Motor de efectos de sonido y pistas musicales
│   ├── simulation.js        # Motor de simulación en vivo, cuartos, probabilidades y MVP
│   └── spatial-nav.js       # Sistema de navegación espacial para Smart TVs y Gamepads
├── scripts/
│   ├── build_final_database.py   # Pipeline ETL para calibrar y exportar la base de datos
│   ├── download_nba_players.py   # Descarga e indexación de IDs oficiales NBA
│   └── scrape_wiki_positions.py  # Clasificación de jugadores históricos por categoría
├── favicon.svg              # Icono vectorial de baloncesto para el navegador
├── index.html               # Interfaz semántica estructurada y accesible
├── PRD - NBA Ultimate Draft Pro.md  # Documento de requerimientos del producto
└── README.md                # Documentación oficial del proyecto
```

---

## 🕹️ Guía de Controles

| Acción | Smart TV / D-Pad | Teclado PC | Gamepad | Móvil |
| :--- | :---: | :---: | :---: | :---: |
| **Navegar Elementos** | Flechas Dirección | `↑` `↓` `←` `→` | D-Pad / Stick Izq. | Tocar pantalla |
| **Seleccionar / Aceptar** | Botón OK / Enter | `Enter` / `Espacio` | Botón `A` (Cruz) | Tap directo |
| **Volver / Cerrar Modal** | Back / Return | `Escape` / `Backspace` | Botón `B` (Círculo) | Botón cerrar |
| **Silenciar Audio** | Foco en icono 🔊 | Click en 🔊 | — | Tap en 🔊 |

---

## 💻 Instalación y Ejecución Local

Este proyecto no requiere de Node.js, compiladores complejos ni dependencias externas pesadas. Funciona inmediatamente abriendo el archivo en cualquier navegador moderno:

### Opción 1: Abrir directamente
1. Clona el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/NBA-Draft.git
   cd NBA-Draft
   ```
2. Haz doble click sobre el archivo `index.html` para abrirlo en Chrome, Edge, Safari, Firefox o en el navegador de tu Smart TV.

### Opción 2: Servidor local ligero (Python)
Para una experiencia idéntica a un entorno de producción o para probar en Smart TV vía red local:
```bash
# Inicia un servidor HTTP en el puerto 8000
python -m http.server 8000
```
Abre en tu navegador `http://localhost:8000` (o `http://[IP-DE-TU-PC]:8000` desde tu televisor o teléfono conectado a la misma red WiFi).

---

## 📊 Base de Datos: Estructura de Jugadores

Cada uno de los 1,000 jugadores en `data/players.json` y `js/data/players.js` cuenta con el siguiente esquema estandarizado:

```json
{
  "id": 893,
  "n": "Michael Jordan",
  "t": "Bulls",
  "t2": 99,
  "t3": 82,
  "reb": 82,
  "blk": 78,
  "ast": 85,
  "stl": 96,
  "rat": 99
}
```

- **`id`**: Identificador oficial de jugador en stats.nba.com.
- **`n`**: Nombre y apellido del jugador.
- **`t`**: Franquicia más representativa en su carrera.
- **`t2`**: Anotación interior y tiros de media distancia (1-99).
- **`t3`**: Efectividad en lanzamientos de 3 puntos (1-99).
- **`reb`**: Capacidad en el rebote ofensivo y defensivo (1-99).
- **`blk`**: Bloqueos y presencia intimidatoria (1-99).
- **`ast`**: Creación de juego y asistencias (1-99).
- **`stl`**: Percepción de robos en línea de pase (1-99).
- **`rat`**: Calificación General (OVR) NBA.

---

## 🛠️ Tecnologías Empleadas

- **HTML5**: Estructura semántica, accesible y responsiva.
- **Vanilla CSS3**: Sistema de diseño con variables CSS, animaciones keyframes fluidas, glassmorphism y paleta oficial NBA.
- **JavaScript Moderno (ES6+)**: Arquitectura basada en módulos de responsabilidad única (`App`, `SimulationEngine`, `SoundEngine`, `SpatialNavigation`).
- **Web Audio API**: Generación procedural de audio en tiempo real sin archivos de sonido externos.
- **Python 3**: Scripts ETL para indexación, validación y sincronización de datos con la NBA.

---

## 📄 Licencia

Este proyecto es de código abierto bajo la licencia [MIT](LICENSE). Las marcas, nombres y logos de equipos pertenecen a la **National Basketball Association (NBA)**.
