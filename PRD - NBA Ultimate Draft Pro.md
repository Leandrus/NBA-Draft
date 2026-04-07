# **PRD: NBA Ultimate Draft \- Simulador Competitivo de Baloncesto**

## **1\. Visión General del Producto**

**NBA Ultimate Draft** es un simulador web interactivo diseñado para dos jugadores locales que puedan jugar sin internet. El objetivo es armar un quinteto ideal (o un tirador en modo especial) mediante una mecánica de "Draft" de cartas aleatorias y enfrentar a los equipos en una simulación de alta velocidad basada en estadísticas reales de jugadores históricos y actuales de la NBA.

## **2\. Experiencia de Usuario (UX) y Flujo del Juego**

El juego debe seguir estrictamente este orden de pantallas:

1. **Menú de Selección de Modo:** Selección entre:  
   * Normal  
   * Libre  
   * 3x3  
   * Finales  
2. **Configuración de Equipos:** Pantalla para ingresar los nombres del Equipo 1 y Equipo 2\.  
3. **Fase de Draft (Jugador 1):** Selección de 5 posiciones (C, PF, SF, SG, PG).  
4. **Fase de Draft (Jugador 2):** Repetición del proceso para el segundo jugador.  
5. **Arena Ready (Matchup):** Visualización de ambos rosters, sus ratings calculados y botón de "Tip Off".  
6. **Simulación en Vivo:** Cronómetro fluido, marcador dinámico, historial de jugadas (log) y tablas de estadísticas.  
7. **Resultados Finales:** Resultado final del partido, MVP del partido y Box Score (Estadísticas) detallado de cada jugador.  
8. **Resultados Finales de Serie:** Mostrar al equipo campeón al ganar los 4 partidos de los 7 en el modo Finales y mostrar el MVP del partido y de la serie completa.  
9. **Settings**: Sección para mostrar la lista de jugadores en la BD,con todos sus ratings y ordenados por posición de juego y alfabéticamente.

## **3\. Modos de Juego**

* **Modo Normal:**  
  * Las 20 cartas del draft están ocultas.  
  * Botón de **Scout** disponible: Revela 5 cartas al azar (Foto \+ Nombre) con una penalización del 5% en el rendimiento del equipo durante la simulación.  
* **Modo Libre:**  
  * Las 20 cartas están reveladas desde el inicio (Foto \+ Nombre). No hay botón de Scout ni penalización.  
* **Modo 3x3:**  
  * Duelo 3 vs 3\. Los jugadores solo eligen tres jugadores por equipo.  
  * La simulación se basa exclusivamente en los jugadores de las posiciones PF, SF y SG y PG. Todos mezclados.  
* **Modo Finales:**  
  * La misma mecánica del modo normal, pero debe ser una serie de (7) partidos simulados donde gana el primero en ganar (4) partidos.

## **4\. Mecánicas de Draft y Base de Datos**

### **4.1 Base de Datos de Jugadores**

* **Volumen:** Si una BD no se otorga, entonces generar el TOP 50 jugadores reales únicos por posición (C, PF, SF, SG, PG). Total: 250 jugadores.  
  * Importante: Es estrictamente necesario que los 50 jugadores de cada posición, realmente pertenezcan y jueguen esa posición y pertenezcan al top 50 en la historia de la NBA.  
* **Atributos por Jugador:**  
  * id: ID oficial de la NBA para imágenes.  
  * n: Nombre completo.  
  * t: Equipo representativo.

  t2: Rating de Anotaciones (1-99).

  * blk: Rating de Bloqueos (1-99).  
  * stl: Rating de Robos (1-99).  
  * reb: Rating de Rebote (1-99).  
  * t3: Rating de Triples (1-99).  
  * ast: Rating de Pases (1-99).  
  * rat: Rating General (Promedio de atributos).  
* **Carga de Imágenes:** Para cargar imágenes de los jugadores, usar el CDN: https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/{id}.png.

### **4.2 Lógica del Draft**

* En cada turno (por posición), el sistema debe mezclar los jugadores de la posición específica del momento y seleccionar de forma aleatoria **20 cartas únicas** para mostrar.  
* El pool de 20 debe ser independiente para cada jugador y cada posición.  
* **Revelación (Reveal):** Al seleccionar, se debe mostrar un modal animado con la foto del jugador, su nombre, equipo y todos sus ratings.

## **5\. Motor de Simulación**

### **5.1 Tiempos y Ritmo**

* **Duración del Cuarto:** Exactamente 30 segundos reales.  
* **Cronómetro (Clock):** Debe descender de 12:00 a 0:00 (segundos NBA simulados) de forma ultra fluida (segundo a segundo).  
* **Pausa entre Cuartos:** 3 segundos reales. Durante la pausa, mostrar un modal centrado con el marcador parcial y el aviso del siguiente periodo.  
* **Overtime (OT):** Si hay empate al final del 4to cuarto, simular periodos extra de 5 minutos ( NBA) hasta que haya un ganador.

### **5.2 Lógica Probabilística**

* Cada "tick" del reloj tiene una probabilidad de generar una acción.  
* El éxito de la acción depende del **Rating General**, el **Rating de la habilidad** específica del jugador y la penalización de **Scout** si fue activada.  
* **Acciones con Emojis:**  
  * 🏀 Puntos (2pt según rating t2 o 3pt según rating t3).  
  * 👐 Rebote (basado en rating reb).  
  * 👟 Asistencia (basado en el rating de ast)  
  * 🚫 Bloqueo (basado en rating blk).  
  * 🥷Robo (basado en rating de stl).  
* **Visualización:**   
  * El marcador debe parpadear con el color del equipo (Rojo/Azul) cuando anote.  
  * La fila de un jugador en la tabla de estadísticas debe resaltar también tras una acción.  
  * Las acciones del log debe estar resaltado del color del equipo para diferenciar los mismos.

## **6\. Interfaz y Diseño (UI/UX)**

* **Estética:** Tema oscuro (\#020b13), fuentes tipográficas tipo "Bebas Neue" o "Inter Black", colores NBA (Rojo: \#C9082A, Azul: \#17408B, Oro: \#f1c40f).  
* **Responsividad (Muy importante):**  
  * **Mobile:** Grid de cartas de 3 o 4 columnas. Tablas con scroll horizontal o compactas. Todos los elementos deben ser responsivos permitiendo una visualización de todo de forma agradable al usuario.  
  * **PC/TV:** Marcadores gigantes y tablas de estadísticas.  
* **Historial de Jugadas (Logs):** Una columna con texto alineado a la **izquierda** para que los emojis sean legibles al inicio. Mínimo 5 líneas de log visible, máximo 10 líneas visibles.  
* **Pantalla de Resultados:**  
  * Marcador final gigante y centrado.  
  * Tarjeta MVP resaltada con el equipo ganador y su color de equipo.  
  * **Box Score Final:** Tablas completas de ambos equipos debajo del MVP para ver el rendimiento de todos los jugadores y resaltando también al MVP.

## **7\. Requerimientos Técnicos**

* **Framework:** Archivo único en HTML, utilizando Javascript.  
* **Estilos:** CSS3 con animaciones keyframes para transiciones de pantalla y modales.  
* **Estado:** Manejar estados independientes para gameMode, matchStatus, p1\_stats y p2\_stats.  
* **Sin duplicados:** Validar simplemente que los 20 jugadores de cada turno sean únicos entre sí.  
* **Responsivo**: todos los elementos del juego deben ser responsivos y adaptarse a pantallas pequeñas o grandes.

**FIN DEL DOCUMENTO**