# Mapa mundial más simple + multijugador simétrico

Copia estos archivos encima de los de tu repo (mismas rutas), o aplica el parche:

    git apply mapa-simple-y-simetrico.patch

Solo frontend. No hay que reconstruir el backend ni tocar la base de datos.

## 1. Mapa mundial más simple (/mapa-mundial)

Era la página que más desentonaba: fondo de estrellas, viñeta, océano con degradados y brillo de
globo, cuadrícula, halo dorado, anillos con resplandor, paneles de cristal y una ficha con degradado
y silueta de marca de agua. Ahora usa la misma paleta plana que el resto de la web.

- `WorldMapCanvas.jsx`: sin océano pintado, cuadrícula, borde de esfera ni brillos. Tierra de un solo
  color sobre el fondo de la página (los mismos tonos que los mapas del juego). Al pasar el ratón o
  abrir un país: relleno + contorno fino (para localizar países diminutos). Zoom, paneo,
  disponibilidad y tooltip funcionan igual.
- `WorldMapPage.jsx`: cabecera de una sola línea; fuera la regla de escala («0 – 2000 km», que
  además no era exacta) y la silueta decorativa de la ficha.
- `WorldMap.css`: reescrito en plano (paneles #123049, líneas #1f4666, acento dorado, esquinas rectas,
  sin degradados ni desenfoques). El botón «Explore regions» es el mismo botón dorado del juego.
  La ficha sigue siendo una hoja inferior en móvil.

## 2. Multijugador simétrico

El backend ya era simétrico (cada acierto suma 1 al jugador que lo hace y el ganador sale de comparar
marcadores, sin ventaja para quien envió el reto). La asimetría estaba en la interfaz:

- `MatchPage.jsx` (sala previa): antes cada uno se veía en un sitio distinto (el anfitrión a la
  izquierda, el invitado a la derecha) y con etiquetas «host / guest». Ahora los dos ven lo mismo: tú a
  la izquierda, el rival a la derecha («You» / «Opponent»), igual que en la partida.
- `PlayScreen.jsx`: el botón «Menu» ocupaba solo el lado izquierdo de la cabecera y descentraba los
  marcadores. Pasa a la barra inferior (junto a «Leave match», como ya estaba «Back to menu» al
  terminar). La cabecera queda en espejo: dos lados del mismo ancho, cada marcador sobre su mapa.
- `MatchPlay.css` / `Match.css`: cada jugador tiene su color (dorado el tuyo, naranja el del rival) en
  avatar, barra, marcador cuando va ganando y etiqueta del mapa. Antes solo tu avatar tenía color.

Lo que sigue siendo distinto a propósito: solo tu mapa tiene zoom y botones (el del rival es de solo
lectura), y quien envía el reto es quien elige país/tiempo (el otro acepta o rechaza).
