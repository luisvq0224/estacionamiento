# Actividad Aplicativa 2 ampliada — ParkControl

**Curso:** Fundamentos de Desarrollo Front-End · Semana 5 · JavaScript

## Objetivo
Construir un prototipo de control de estacionamiento con registro de ingresos, salida con cálculo de importe, consulta de vehículos activos, historial, capacidad y almacenamiento local. Los importes son **supuestos académicos**, no tarifas oficiales.

## Ejecutar (sin Node.js)
1. Abre la carpeta `Estacionamiento_Pro_Frontend` en Visual Studio Code.
2. Abre `index.html` y selecciona **Open with Live Server**.
3. Abre la consola con F12 para observar errores y practicar `console.log()`.
4. Los registros se conservan con `localStorage` en ese origen/navegador. Si cambias de puerto u origen, verás otro almacenamiento.

## Reglas del ejemplo
- Capacidad: 20 espacios.
- Auto: S/ 5/h; moto: S/ 3/h; camioneta: S/ 7/h.
- Hora iniciada cuenta como hora completa, mínimo 1 h.
- Descuento: 15 % para cliente frecuente.
- No se admite una placa activa duplicada, una fecha futura ni un tipo desconocido.
- Para probar cobros de varias horas, el formulario permite ingresar una fecha de entrada anterior. La salida utiliza la hora actual.
- El método de pago es un dato informativo; no existe pasarela real.

## Guía de implementación progresiva (60–75 minutos para la versión completa)
| Minutos | Tema | Archivo / sección |
|---|---|---|
| 0–8 | Revisar requisitos, actores, reglas y estructura | `index.html` |
| 8–18 | Variables, constantes, tipos de datos y arrays | `app.js`, pasos 1–2 |
| 18–28 | Validaciones, `if`, `some`, `Math.ceil`, funciones | `app.js`, pasos 4–6 |
| 28–39 | Registrar ingreso con `submit` y `preventDefault` | `app.js`, paso 7 |
| 39–52 | Listar activos: DOM, `for...of`, eventos, búsqueda | `app.js`, pasos 8–9 |
| 52–65 | Cerrar operación y calcular cobro | `app.js`, paso 10 |
| 65–75 | `localStorage`, KPIs, exportación, pruebas | `app.js`, pasos 5, 8 y 11 |

**Si tu actividad dura 40 minutos:** demuestra primero la solución terminada (5 min), enfócate en registro y validaciones (12 min), cálculo y salida (13 min), listado y pruebas (10 min). El desarrollo completo del DOM queda como ampliación para la Semana 6.

## Conceptos pedagógicos
- `const`, `let`, tipos de datos, objetos y arreglos.
- `if`, operadores lógicos (`&&`, `||`), comparaciones y validación de entradas.
- `function`, parámetros, `return`, `Math.ceil` y redondeo monetario.
- `filter`, `find`, `some`, `reduce` y `for...of`.
- DOM: `querySelector`, `createElement`, `textContent`, `replaceChildren`.
- Eventos: `addEventListener('submit'/'click'/'input')`, delegación de eventos.
- Persistencia: JSON y `localStorage`.
- Diseño responsive con Grid, Flexbox y `@media`.

## Casos de prueba para mostrar en clase
| Prueba | Procedimiento | Esperado |
|---|---|---|
| Ingreso válido | Registrar AUTO `ABC-123` | Aparece en estacionados; ocupación aumenta. |
| Placa duplicada | Ingresar de nuevo `ABC-123` | Muestra error, no duplica. |
| Placa inválida | Ingresar `12` | Rechaza el registro. |
| Fecha futura | Seleccionar mañana | Rechaza el registro. |
| Cobro | MOTO por ~90 min, frecuente | 2 h × S/ 3 × 0.85 = **S/ 5.10**. |
| Salida | Elegir método de pago y confirmar | Desaparece de activos, aparece en historial; recalcula KPI. |
| Buscar | Buscar una placa parcial | Filtra tabla. |
| Persistencia | Actualizar página | Se conservan los datos. |
| Exportar | Registrar salida y pulsar CSV | Descarga historial. |
| Eliminar historial | Confirmar limpieza | Elimina solo operaciones terminadas. |
| Capacidad | Registrar 20 vehículos distintos | Rechaza el vigesimoprimero. |

## Ejercicios de extensión
1. Añadir tarifas diferenciadas por horario nocturno.
2. Agregar botón de filtro por tipo de vehículo.
3. Añadir métricas de recaudación por medio de pago.
4. Mostrar advertencia cuando quedan menos de 3 espacios.
5. Crear una pantalla de configuración del tarifario.

## Limitaciones
- Prototipo académico de una sola computadora: `localStorage` no sincroniza usuarios ni ofrece seguridad de servidor.
- La hora de salida depende del reloj de la computadora, que podría alterarse.
- No es un sistema para operación comercial ni reemplaza control transaccional, autenticación o backend.
- Al limpiar datos del sitio o usar modo incógnito se pierden registros.
