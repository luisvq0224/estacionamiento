"use strict";

/* ================================================================
   PARKCONTROL - PRÁCTICA DIDÁCTICA CON JAVASCRIPT PURO
   1) Constantes y variables  2) Funciones  3) Condicionales
   4) Bucles y arrays  5) DOM y eventos  6) localStorage
   ================================================================ */

// PASO 1. CONFIGURACIÓN DEL NEGOCIO (modifica aquí las tarifas).
const CAPACIDAD = 20;
const TARIFAS = Object.freeze({ auto: 5, moto: 3, camioneta: 7 });
const DESCUENTO_FRECUENTE = 0.15;
const CLAVE_ALMACENAMIENTO = "parkcontrol-demo-v1";
const moneda = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });
const fechaLegible = new Intl.DateTimeFormat("es-PE", { dateStyle: "short", timeStyle: "short" });

// PASO 2. ESTADO DEL SISTEMA. Cada registro tiene un ID único.
let registros = cargarRegistros();
let idSalidaPendiente = null;

// PASO 3. ACCESO A ELEMENTOS DEL DOM.
const $ = (selector) => document.querySelector(selector);
const formulario = $("#formIngreso");
const tablaActivos = $("#tablaActivos");
const tablaHistorial = $("#tablaHistorial");
const modalSalida = $("#modalSalida");

// PASO 4. FUNCIONES UTILITARIAS Y DE VALIDACIÓN.
function fechaParaInput(date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}
function normalizarPlaca(valor) {
  return valor.trim().toUpperCase().replace(/\s+/g, "");
}
function placaValida(placa) {
  return /^[A-Z0-9-]{5,9}$/.test(placa) && /[A-Z]/.test(placa) && /\d/.test(placa);
}
function fechaValida(texto) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(texto)) return null;
  const fecha = new Date(texto);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}
function nombreTipo(tipo) {
  return ({ auto: "Auto", moto: "Moto", camioneta: "Camioneta" })[tipo] || "Desconocido";
}
function mostrarMensaje(texto, error = false) {
  const caja = $("#mensajeFormulario");
  caja.textContent = texto;
  caja.className = error ? "mensaje mensaje--error" : "mensaje";
  caja.hidden = false;
}
function limpiarMensaje() { $("#mensajeFormulario").hidden = true; }
function idUnico() {
  return (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// PASO 5. PERSISTENCIA LOCAL. La app no utiliza un backend.
function cargarRegistros() {
  try {
    const almacenados = JSON.parse(localStorage.getItem(CLAVE_ALMACENAMIENTO) || "[]");
    if (!Array.isArray(almacenados)) return [];
    return almacenados.filter(r => r && typeof r.id === "string" && typeof r.placa === "string"
      && Object.hasOwn(TARIFAS, r.tipo) && Number.isFinite(r.ingreso)
      && (r.salida === null || Number.isFinite(r.salida)));
  } catch (error) {
    console.warn("No se pudieron leer los datos guardados:", error);
    return [];
  }
}
function guardarRegistros() {
  try {
    localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(registros));
    return true;
  } catch (error) {
    alert("No se pudo guardar en este navegador. Comprueba el almacenamiento disponible.");
    console.error(error);
    return false;
  }
}
function activos() { return registros.filter(r => r.salida === null); }
function finalizados() { return registros.filter(r => r.salida !== null); }

// PASO 6. LÓGICA DEL NEGOCIO: HORAS INICIADAS, TARIFAS Y DESCUENTO.
function calcularCobro(registro, salidaMs) {
  const minutos = Math.max(0, (salidaMs - registro.ingreso) / 60000);
  const horasCobradas = Math.max(1, Math.ceil(minutos / 60));
  const subtotal = horasCobradas * TARIFAS[registro.tipo];
  const descuento = registro.frecuente ? Math.round(subtotal * DESCUENTO_FRECUENTE * 100) / 100 : 0;
  const total = Math.round((subtotal - descuento) * 100) / 100;
  return { minutos, horasCobradas, subtotal, descuento, total };
}

// PASO 7. EVENTO SUBMIT: REGISTRAR INGRESO Y VALIDAR PLACA/CAPACIDAD.
formulario.addEventListener("submit", (event) => {
  event.preventDefault(); // Evita recargar la página.
  limpiarMensaje();
  const placa = normalizarPlaca($("#placa").value);
  const tipo = $("#tipo").value;
  const fecha = fechaValida($("#fechaIngreso").value);
  const conductor = $("#conductor").value.trim();
  const frecuente = $("#frecuente").checked;
  const ahora = Date.now();

  if (!placaValida(placa)) return mostrarMensaje("Placa inválida: usa entre 5 y 9 caracteres, con letras y números.", true);
  if (!Object.hasOwn(TARIFAS, tipo)) return mostrarMensaje("Selecciona un tipo de vehículo válido.", true);
  if (!fecha || fecha.getTime() > ahora) return mostrarMensaje("La fecha de ingreso debe existir y no puede ser futura.", true);
  if (activos().length >= CAPACIDAD) return mostrarMensaje("Estacionamiento completo. No quedan espacios disponibles.", true);
  if (activos().some(r => r.placa === placa)) return mostrarMensaje("Esa placa ya tiene un ingreso activo.", true);
  if (conductor.length > 60) return mostrarMensaje("El nombre del conductor es demasiado largo.", true);

  const nuevo = { id: idUnico(), placa, tipo, ingreso: fecha.getTime(), conductor,
    frecuente, salida: null, pago: null, cobro: null };
  registros.push(nuevo);
  if (!guardarRegistros()) { registros.pop(); return; }
  formulario.reset();
  $("#fechaIngreso").value = fechaParaInput(new Date());
  mostrarMensaje(`Ingreso registrado: ${placa}.`);
  renderizar();
});

// PASO 8. CREAR TABLAS MEDIANTE EL DOM SIN INSERTAR HTML DEL USUARIO.
function celda(fila, texto, clase = "") {
  const td = document.createElement("td");
  td.textContent = String(texto);
  if (clase) td.className = clase;
  fila.appendChild(td);
  return td;
}
function renderizarActivos() {
  tablaActivos.replaceChildren();
  const busqueda = $("#buscarActivos").value.trim().toLocaleUpperCase("es-PE");
  const visibles = activos().filter(r => `${r.placa} ${r.conductor}`.toLocaleUpperCase("es-PE").includes(busqueda))
    .sort((a,b) => b.ingreso - a.ingreso);
  $("#contadorActivos").textContent = activos().length;
  $("#vacioActivos").hidden = visibles.length !== 0;
  for (const registro of visibles) { // Bucle for...of
    const tr = document.createElement("tr");
    celda(tr, registro.placa, "placa");
    celda(tr, nombreTipo(registro.tipo));
    celda(tr, registro.conductor || "—");
    celda(tr, fechaLegible.format(registro.ingreso));
    celda(tr, registro.frecuente ? "Frecuente" : "Regular");
    const acciones = celda(tr, "");
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "boton-tabla";
    boton.textContent = "Registrar salida";
    boton.dataset.id = registro.id;
    acciones.appendChild(boton);
    tablaActivos.appendChild(tr);
  }
}
function renderizarHistorial() {
  tablaHistorial.replaceChildren();
  const terminados = finalizados().sort((a,b) => b.salida - a.salida);
  $("#vacioHistorial").hidden = terminados.length !== 0;
  for (const r of terminados) {
    const tr = document.createElement("tr");
    celda(tr, r.placa, "placa");
    celda(tr, nombreTipo(r.tipo));
    celda(tr, fechaLegible.format(r.ingreso));
    celda(tr, fechaLegible.format(r.salida));
    celda(tr, r.cobro.horasCobradas);
    celda(tr, moneda.format(r.cobro.descuento));
    celda(tr, moneda.format(r.cobro.total), "placa");
    celda(tr, r.pago);
    tablaHistorial.appendChild(tr);
  }
}
function renderizarKPIs() {
  const ocupados = activos().length;
  const salidas = finalizados();
  const ingresos = salidas.reduce((suma, r) => suma + r.cobro.total, 0);
  $("#kpiOcupados").textContent = ocupados;
  $("#kpiLibres").textContent = CAPACIDAD - ocupados;
  $("#kpiCapacidad").textContent = CAPACIDAD;
  $("#kpiSalidas").textContent = salidas.length;
  $("#kpiRecaudacion").textContent = moneda.format(ingresos);
  $("#ocupacionTexto").textContent = `${ocupados} de ${CAPACIDAD} espacios`;
  $("#barraProgresoRelleno").style.width = `${100 * ocupados / CAPACIDAD}%`;
  $("#barraProgreso").setAttribute("aria-valuenow", String(ocupados));
}
function renderizar() { renderizarKPIs(); renderizarActivos(); renderizarHistorial(); }

// PASO 9. DELEGACIÓN DE EVENTOS: UN LISTENER PARA TODA LA TABLA.
tablaActivos.addEventListener("click", event => {
  const boton = event.target.closest("button[data-id]");
  if (!boton) return;
  abrirModalSalida(boton.dataset.id);
});
$("#buscarActivos").addEventListener("input", renderizarActivos);

// PASO 10. PREVISUALIZACIÓN DE COBRO Y CONFIRMACIÓN DE SALIDA.
function abrirModalSalida(id) {
  const r = activos().find(item => item.id === id);
  if (!r) return;
  idSalidaPendiente = id;
  const salida = Date.now();
  const cobro = calcularCobro(r, salida);
  const horas = Math.floor(cobro.minutos / 60);
  const minutos = Math.floor(cobro.minutos % 60);
  $("#descripcionModal").textContent = `${r.placa} · ${nombreTipo(r.tipo)} · Entrada: ${fechaLegible.format(r.ingreso)}`;
  $("#cobroDuracion").textContent = `${horas} h ${minutos} min`;
  $("#cobroHoras").textContent = `${cobro.horasCobradas} h`;
  $("#cobroSubtotal").textContent = moneda.format(cobro.subtotal);
  $("#cobroDescuento").textContent = `− ${moneda.format(cobro.descuento)}`;
  $("#cobroTotal").textContent = moneda.format(cobro.total);
  $("#metodoPago").value = "";
  modalSalida.showModal();
}
function cerrarModal() { modalSalida.close(); idSalidaPendiente = null; }
$("#btnCerrarModal").addEventListener("click", cerrarModal);
$("#btnCancelarSalida").addEventListener("click", cerrarModal);
modalSalida.addEventListener("close", () => { idSalidaPendiente = null; });
$("#formSalida").addEventListener("submit", event => {
  event.preventDefault();
  const pago = $("#metodoPago").value;
  if (!pago) { $("#metodoPago").reportValidity(); return; }
  const r = activos().find(item => item.id === idSalidaPendiente);
  if (!r) { cerrarModal(); return; }
  const salida = Date.now();
  const cobro = calcularCobro(r, salida); // Se recalcula al confirmar.
  r.salida = salida;
  r.pago = pago;
  r.cobro = cobro;
  if (!guardarRegistros()) { r.salida = null; r.pago = null; r.cobro = null; return; }
  cerrarModal();
  renderizar();
  alert(`Salida registrada: ${r.placa}\nTotal cobrado: ${moneda.format(cobro.total)}`);
});

// PASO 11. EXPORTAR CSV CON HISTORIAL Y LIMPIAR DATOS CON CONFIRMACIÓN.
function celdaCSV(valor) {
  const texto = String(valor ?? "");
  // Evitar fórmulas al abrir CSV en programas de hojas de cálculo.
  const seguro = /^[\s]*[=+@\-\t\r]/.test(texto) ? `'${texto}` : texto;
  return `"${seguro.replaceAll('"', '""')}"`;
}
$("#btnExportar").addEventListener("click", () => {
  const salidas = finalizados();
  if (!salidas.length) return alert("No hay salidas para exportar.");
  const filas = [["Placa", "Tipo", "Conductor", "Ingreso", "Salida", "Horas cobradas", "Subtotal", "Descuento", "Total", "Pago"]];
  for (const r of salidas) filas.push([r.placa, nombreTipo(r.tipo), r.conductor, fechaLegible.format(r.ingreso), fechaLegible.format(r.salida), r.cobro.horasCobradas, r.cobro.subtotal, r.cobro.descuento, r.cobro.total, r.pago]);
  const csv = "\uFEFF" + filas.map(f => f.map(celdaCSV).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "historial_estacionamiento.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
$("#btnLimpiarHistorial").addEventListener("click", () => {
  if (!finalizados().length) return alert("El historial está vacío.");
  if (!confirm("¿Eliminar definitivamente el historial de salidas? Los vehículos estacionados se conservarán.")) return;
  const copia = registros;
  registros = activos();
  if (!guardarRegistros()) { registros = copia; return; }
  renderizar();
});

// PASO 12. INICIALIZACIÓN DEL SITIO.
$("#fechaIngreso").value = fechaParaInput(new Date());
renderizar();
