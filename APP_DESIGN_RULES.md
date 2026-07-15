# Portable App Design Rules

Guia portable para dashboards administrativos y apps operativas. Este archivo esta pensado como base de implementacion para otros proyectos y debe leerse como especificacion visual y estructural, no como simple lista de ideas.

## Objetivo

Definir un sistema de reglas lo bastante preciso para replicar un dashboard shell sobrio, compacto y estilado, con sidebar colapsable, header sticky, breadcrumb contenido, paginas con paddings controlados, paneles de acciones, contadores y menus con una jerarquia visual consistente.

## Principios Base

- La interfaz debe priorizar trabajo operativo sobre decoracion.
- La app debe sentirse compacta, clara y premium, no pesada ni corporativa vieja.
- Los radios deben ser generosos.
- Los bordes deben ser suaves y de contraste medio-bajo.
- Las sombras deben ser discretas en cards y profundas solo en overlays.
- El color primario debe usarse como tinte de superficie, no solo como texto.
- El layout debe ser estable entre paginas: sidebar fijo, header fijo, contenido respirable y predecible.
- El usuario debe poder reconocer patrones de inmediato sin reaprender cada pantalla.

## Direccion Visual

- Superficies principales:
  - fondo general neutro
  - cards y paneles levemente diferenciados
  - overlays casi opacos con blur
- Bordes:
  - usar bordes suaves, nunca cajas duras de alto contraste
- Radios recomendados:
  - pequenos: 0.5rem a 0.75rem
  - medios: 0.875rem a 1rem
  - grandes: 1.25rem a 1.6rem
  - circulares: `rounded-full` para avatares, pills y triggers
- Sombras:
  - cards: `shadow-sm`
  - dropdowns y popovers: `shadow-2xl`
- Blur:
  - usar en header sticky, menus y paneles flotantes

## Blueprint del Dashboard Shell

Esta es la pieza mas importante del sistema. Si un proyecto implementa este shell bien, el resto de la app hereda claridad automaticamente.

### Estructura General

- El dashboard se compone de:
  1. sidebar desktop persistente
  2. sidebar mobile como sheet
  3. header superior sticky
  4. contenido principal en columna
- El shell no debe incluir hero decorativo.
- La sensacion debe ser de herramienta de trabajo, no de pagina de marketing interna.

### Medidas Base del Sidebar

- Ancho expandido desktop: `16rem`
- Ancho mobile sheet: `18rem`
- Ancho colapsado icon-only: `3rem`
- Altura: `100svh`
- El sidebar vive fijo al costado izquierdo.
- El contenido principal no se superpone: el layout reserva el gap real del sidebar.

### Variante Recomendada del Sidebar

- Usar sidebar flotante o visualmente desacoplado del contenido.
- El sidebar debe poder colapsarse a modo icon-only.
- En modo colapsado no desaparece: sigue siendo un rail funcional de navegacion.
- El sidebar debe mantener:
  - header
  - search compacta
  - navegacion principal
  - navegacion secundaria
  - user menu al final

### Padding Interno del Sidebar

- Header base: `p-2`
- Footer base: `p-2`
- Cada grupo de navegacion: sin padding externo extra o con `p-0`
- La lista de items debe respirar con `px-2`
- Los items deben separarse con gaps minimos, casi `gap-px` o `gap-1`

### Items del Sidebar

- Altura base item normal: `h-9`
- Altura de item grande como switcher: `h-14`
- Item colapsado: `size-8`
- Padding base item: `px-3 py-2`
- En colapsado:
  - remover label visible
  - mantener icono centrado
  - usar tooltip lateral en desktop
- Estado hover:
  - cambiar fondo a accent suave
- Estado activo:
  - fondo accent
  - texto mas fuerte
  - peso medio o semibold

### Search del Sidebar

- Debe ubicarse debajo del switcher en el header.
- Altura recomendada: `h-10`
- Radio: `rounded-xl`
- Padding izquierdo suficiente para icono interno
- Debe incluir:
  - icono de busqueda al inicio
  - boton derecho contextual
- Boton derecho:
  - si hay texto, limpia
  - si no hay texto, muestra shortcut
- Shortcut recomendado:
  - una sola letra visible en mini pill, por ejemplo `F`
- La search debe desaparecer visualmente cuando el sidebar se colapsa.

### Switcher del Sidebar

- Debe ser la primera pieza del sidebar.
- En expandido:
  - altura aproximada `h-14`
  - avatar o logo a la izquierda
  - nombre truncado
  - slug o subtitulo pequeno debajo
  - trigger circular a la derecha
- En colapsado:
  - mostrar solo avatar o logo
- El dropdown del switcher debe:
  - abrir alineado al sidebar
  - tener ancho cercano a `20.5rem`
  - incluir busqueda arriba
  - lista scrolleable
  - opcion de crear nueva entidad si aplica

### Borde que Expande y Colapsa

- El trigger principal para abrir y cerrar el sidebar debe ser el mismo borde lateral del shell.
- No usar un boton suelto separado del rail como unico mecanismo desktop.
- El borde debe actuar como rail interactivo:
  - una linea vertical muy sutil
  - al hover revelar un control circular centrado verticalmente
  - ese control debe mostrar flecha segun estado
- Medidas sugeridas del rail:
  - ancho interactivo total: `w-5`
  - control circular interno: `size-7`
- El control debe:
  - usar borde suave
  - fondo del sistema
  - sombra de separacion contra el fondo
  - aparecer con transicion de opacidad

### Sidebar Mobile

- En mobile, el sidebar debe abrir como sheet lateral.
- Ancho recomendado: `18rem`
- Debe reutilizar la misma estructura interna del sidebar desktop.
- El boton cerrar del sheet puede ocultarse si la UX ya esta resuelta con gestos o control propio.

## Header del Dashboard

### Estructura

- El header debe ser sticky arriba del contenido.
- Debe usar una grilla de tres zonas:
  1. izquierda: trigger o espacio de control
  2. centro: breadcrumb
  3. derecha: notificaciones y cuenta

### Medidas

- Altura principal: `h-16`
- Cuando el shell se compacta por colapso del sidebar, puede bajar a `h-14`
- Padding horizontal:
  - mobile: `px-4`
  - desktop pequeno: `sm:px-6`
- Gap interno: `gap-3`

### Estilo del Header

- Debe llevar:
  - borde inferior suave
  - fondo casi opaco
  - blur
- El header debe sentirse compacto, no monumental.
- No usar titulo grande dentro del header global.

### Trigger Izquierdo del Header

- El trigger visible del header puede existir, pero el rail lateral sigue siendo el mecanismo mas importante de expandir y colapsar.
- El trigger visible debe ser pequeno y redondeado.
- Variante recomendada:
  - outline
  - forma circular
  - sombra leve
  - fondo semitransparente

### Lado Derecho del Header

- Debe incluir, en este orden:
  - campana de notificaciones
  - avatar o cuenta
- Cada trigger debe ser pequeno, circular y consistente.
- Tamano recomendado:
  - `size-10`
- Estilo:
  - borde suave
  - fondo semitransparente
  - hover discreto

## Breadcrumb

### Funcion

- El breadcrumb del dashboard no es un hero, es solo contexto compacto.
- Debe permanecer centrado dentro del header.

### Estilo

- Tipografia:
  - `text-sm`
- Separacion:
  - `gap-2`
- Comportamiento:
  - wrap permitido
  - truncado por item
- Color:
  - segmentos anteriores en `muted`
  - ultimo segmento en `foreground` con `font-semibold`
- Separador:
  - slash simple `/`

### Regla de Contenido

- Omitir ids crudos, uuids y segmentos tecnicos.
- Convertir segmentos a labels legibles.
- El ultimo item nunca debe ser link.

## Area Principal de Pagina

### Padding y Anchura

- El contenido del dashboard debe vivir dentro de un contenedor flexible que ocupe todo el ancho disponible.
- Padding base:
  - mobile: `p-4`
  - desktop: `sm:p-6`
- Padding superior interno:
  - `pt-4`
- No usar un `max-width` estrecho global para todas las paginas operativas.
- La mayor parte de las paginas debe trabajar a `w-full`.

### Ritmo Vertical

- Gap principal entre bloques: `gap-6`
- En layouts mas apretados, usar `gap-4`
- Bottom padding recurrente de pagina: `pb-6`

### Filosofia de Anchura

- Las paginas de dashboard no deben sentirse embotelladas en una columna central estrecha.
- Se permite `max-width` solo en:
  - settings
  - formularios aislados
  - detail views que requieran lectura mas enfocada

## Pages Dentro del Dashboard

### Tipos de Pagina

- overview
- data pages
- detail pages
- settings pages
- navigation hub pages

### Overview del Dashboard

- Puede ser un poco mas editorial que una data page, pero sigue siendo operativa.
- Estructura recomendada:
  1. resumen de contadores
  2. quick links
  3. grid de secciones de actividad
- Grid de contadores:
  - `gap-3`
  - `sm:grid-cols-2`
  - `xl:grid-cols-5`
- Grid de dos columnas para secciones largas:
  - `xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]`

## Top Panel, Acciones y Contadores

Esta zona debe convertirse en patron reusable para la mayoria de data pages.

### Cuando Usarlo

- Solo si la pagina tiene:
  - contadores
  - acciones globales
  - o ambas

### Grid Base

- Grid de top panel:
  - `gap-3`
  - desde `md:grid-cols-2`
  - puede escalar hasta `xl:grid-cols-6` u `xl:grid-cols-8`

### Stat Tiles

- Base visual:
  - borde suave
  - fondo de card
  - padding `p-4`
  - radio `rounded-xl` o `rounded-[1.25rem]`
- Estructura interna:
  - icono opcional arriba
  - label pequeno uppercase
  - valor grande abajo
- Altura minima sugerida:
  - `min-h-28`
- Label:
  - `text-[11px]`
  - uppercase
  - tracking amplio
- Valor:
  - `text-3xl`
  - `font-semibold`

### Action Tiles

- Deben verse como tarjetas clicables, no botones inflados.
- Base visual:
  - borde sutil con tinte primario
  - fondo primario translcido
  - `rounded-xl`
  - `shadow-sm`
- Altura minima sugerida:
  - `min-h-28`
- Contenido:
  - icono grande arriba
  - titulo
  - descripcion opcional
  - badge opcional
- El badge debe ir arriba a la derecha.
- Las action tiles pueden:
  - navegar
  - abrir sheet
  - abrir dialog

### Separacion con Filtros

- Si hay top panel, la fila de search y filtros debe empezar con `mt-5`.

## Data Pages

### Estructura Recomendada

1. top panel si aplica
2. fila de busqueda y filtros
3. tabla o contenido principal
4. paginacion

### Search y Filtros

- Deben compartir la misma fila mientras el ancho lo permita.
- No envolver esta fila en una card adicional.
- La search debe ser dominante en anchura.
- Los filtros deben vivir en dropdown o controles compactos.
- Los filtros deben aplicar en vivo.
- El reset debe verse como accion real, no como texto perdido.

### Tabla

- Debe vivir dentro de una superficie con:
  - borde suave
  - fondo levemente diferenciado
  - overflow-x-auto
  - sombra ligera
- Encabezado de tabla:
  - fondo suave
  - tipografia discreta
- Filas:
  - hover sutil
  - borde separador suave
- No poner acciones inline por fila.
- El item principal de la fila debe ser el punto de navegacion al detalle.

### Paginacion

- Debe vivir fuera de la tabla.
- Distribucion recomendada:
  - prev
  - resumen de rango
  - next
- Mantenerla simple y horizontal.

## Detail Pages

- Deben seguir usando el shell del dashboard.
- Pueden usar pagina mas enfocada, pero sin romper paddings globales.
- Se permite reducir ancho maximo en detail pages densas o forms largos.
- El back mobile puede vivir en un header de pagina compacto.

## Settings Pages

- Para settings, usar ancho controlado.
- Recomendacion:
  - contenedor principal centrado
  - `max-w-4xl`
- Construir como pila vertical de cards.
- Gap vertical recomendado entre cards: `gap-5` o `gap-6`

### Settings Card

- Radio recomendado:
  - `1.5rem` a `1.6rem`
- Padding:
  - `p-5`
- Header de card:
  - titulo
  - descripcion opcional
  - accesorio opcional
- Footer:
  - acciones alineadas a la derecha

## User Menu

### En Sidebar Footer

- Debe vivir al final del sidebar.
- El trigger debe ocupar el ancho disponible.
- Layout del trigger:
  - avatar
  - nombre
  - email
  - chevron
- Estilo:
  - `rounded-4xl`
  - hover de fondo suave
  - estado focus visible claro

### En Header

- Debe reducirse a trigger circular.
- Medida recomendada:
  - `size-10`
- El dropdown debe:
  - abrir con borde suave
  - fondo casi opaco
  - blur
  - radio grande
  - `shadow-2xl`

### Contenido del Menu

- Cabecera de identidad resumida
- Preferencias o theme
- Links personales
- Acceso a shells relacionados si aplica

## Notificaciones

- El trigger debe ser circular y visualmente parejo al avatar del header.
- El badge debe ser pequeno pero legible.
- El panel debe tener:
  - header corto
  - contador de no leidas
  - lista scrolleable
  - footer con acciones masivas
- Altura maxima recomendada:
  - alrededor de `26rem`

## Popovers y Dropdowns

- Ancho tipico:
  - `min(22rem, calc(100vw - 2rem))`
- Radio:
  - `1.5rem` a `1.75rem`
- Padding general:
  - `p-2` exterior
  - `px-3 py-3` en bloques internos
- Fondo:
  - casi opaco
- Borde:
  - suave
- Sombra:
  - profunda
- Blur:
  - activo

## Forms

- Todo campo debe soportar error inline.
- Todo form debe emitir feedback global de exito o error.
- Los submits deben mostrar loading visible.
- Inputs principales:
  - altura comoda, idealmente `h-12`
  - radios amplios
- En formularios de settings:
  - accion principal alineada a la derecha
- En auth:
  - puede usarse boton full width o natural segun composicion

## Paginas de Autenticacion

- Deben usar shell diferente al dashboard.
- Desktop:
  - layout de dos columnas
  - visual a un lado
  - formulario al otro
- El panel del formulario debe ser la prioridad en movil.
- La autenticacion debe sentirse cuidada, no como una card generica en medio de la pantalla.

## Reglas de Copy

- En data pages, omitir titulos y descripciones largos salvo necesidad real.
- El texto secundario debe explicar utilidad operativa.
- No mostrar detalles internos del sistema.
- Los labels de acciones deben ser concretos.

## Reglas de Feedback

- Todo flujo importante debe tener feedback inmediato.
- Tipos recomendados:
  - exito
  - error
  - warning
  - info
- Los toasts deben vivir en una posicion estable, normalmente esquina superior derecha.
- Para estados persistentes, complementar con alertas inline dentro del flujo.

## Regla de Delete en Detail Routes

- Si se elimina un registro desde su propia vista de detalle, la app debe sacar al usuario de esa ruta antes de intentar re-renderizar el item eliminado.
- La redireccion debe vivir en la mutacion principal o en servidor.
- Si se necesita mensaje de exito tras redireccion, usar flash state o flag transitorio.

## Estructura Recomendada para Nuevos Proyectos

- capa de primitives visuales
- capa de primitives de app shell
- capa por feature
- capa de paginas y rutas
- capa de i18n y copy

## Checklist de Implementacion

- El sidebar usa `16rem` expandido, `3rem` colapsado y rail interactivo real.
- El borde lateral del sidebar sirve como trigger de colapso y expansion.
- El header es sticky, compacto y de `h-16`.
- El breadcrumb es pequeno, centrado y no muestra ids tecnicos.
- Las paginas internas usan `p-4` en mobile y `sm:p-6` en desktop.
- El contenido de dashboard trabaja a `w-full`, no en una columna angosta global.
- Los top panels usan grid de `gap-3`.
- Las stat tiles y action tiles tienen `min-h-28`.
- Las filas de filtros viven fuera de cards innecesarias.
- Las tablas no usan acciones inline por fila.
- El user menu vive al final del sidebar y el avatar del header es circular y compacto.
- Los dropdowns usan radio grande, blur y sombra profunda.
- Las reglas pueden aplicarse en otro repo sin depender de nombres internos.

