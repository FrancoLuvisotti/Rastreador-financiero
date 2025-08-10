(() => {
  const ingresoInput = document.getElementById('inputIngresoMensual');
  const btnGuardarIngreso = document.getElementById('btnGuardarIngreso');
  const formMovimiento = document.getElementById('formMovimiento');
  const tablaMovimientosBody = document.querySelector('#tablaMovimientos tbody');
  const movimientosTotales = document.getElementById('movimientosTotales');
  const saldoSemanalDiv = document.getElementById('saldoSemanal');
  const saldoMensualDiv = document.getElementById('saldoMensual');
  const resumenMensualBody = document.querySelector('#resumenMensual tbody');
  const btnResetear = document.getElementById('btnResetear');

  // Nuevos inputs para asignaciones manuales
  const inputAsignacionNecesidad = document.getElementById('inputAsignacionNecesidad');
  const inputAsignacionDeseo = document.getElementById('inputAsignacionDeseo');
  const inputAsignacionAhorro = document.getElementById('inputAsignacionAhorro');
  const totalAsignadoSpan = document.getElementById('totalAsignado');
  const errorAsignacionSpan = document.getElementById('errorAsignacion');

  const CATEGORIAS = ['Necesidad', 'Deseo', 'Ahorro'];

  const formatMonto = val => val.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function obtenerSemanaDelMes(fecha) {
    const dia = fecha.getDate();
    return Math.ceil(dia / 7);
  }

  function guardarDatos() {
    localStorage.setItem('ingresoMensual', ingresoMensual.toString());
    localStorage.setItem('movimientos', JSON.stringify(movimientos));
    localStorage.setItem('asignacionManual', JSON.stringify(asignacionManual));
  }
  function cargarDatos() {
    const ingresoGuardado = localStorage.getItem('ingresoMensual');
    ingresoMensual = ingresoGuardado ? parseFloat(ingresoGuardado) : 100000;

    const movGuardados = localStorage.getItem('movimientos');
    movimientos = movGuardados ? JSON.parse(movGuardados) : [];

    const asignacionGuardada = localStorage.getItem('asignacionManual');
    asignacionManual = asignacionGuardada
      ? JSON.parse(asignacionGuardada)
      : {
          Necesidad: ingresoMensual * 0.5,
          Deseo: ingresoMensual * 0.3,
          Ahorro: ingresoMensual * 0.2,
        };
  }

  let ingresoMensual = 100000;
  let movimientos = [];
  // Ahora asignacionManual es objeto editable
  let asignacionManual = {
    Necesidad: ingresoMensual * 0.5,
    Deseo: ingresoMensual * 0.3,
    Ahorro: ingresoMensual * 0.2,
  };

  function actualizarIngresoInput() {
    ingresoInput.value = ingresoMensual.toFixed(2);
  }

  function actualizarInputsAsignacion() {
    inputAsignacionNecesidad.value = asignacionManual.Necesidad.toFixed(2);
    inputAsignacionDeseo.value = asignacionManual.Deseo.toFixed(2);
    inputAsignacionAhorro.value = asignacionManual.Ahorro.toFixed(2);
    actualizarTotalAsignado();
  }

  function actualizarTotalAsignado() {
    const total = asignacionManual.Necesidad + asignacionManual.Deseo + asignacionManual.Ahorro;
    totalAsignadoSpan.textContent = formatMonto(total);
    // Mostrar error si total asignado > ingreso mensual
    if (total > ingresoMensual) {
      errorAsignacionSpan.style.display = 'block';
      errorAsignacionSpan.textContent = 'La suma de asignaciones supera el ingreso mensual. Ajusta los valores.';
    } else {
      errorAsignacionSpan.style.display = 'none';
      errorAsignacionSpan.textContent = '';
    }
  }

  function validarAsignacion() {
    const total = asignacionManual.Necesidad + asignacionManual.Deseo + asignacionManual.Ahorro;
    return total <= ingresoMensual;
  }

  function agregarMovimiento({ fecha, categoria, subcategoria, monto }) {
    const fechaObj = new Date(fecha + 'T00:00:00');
    if (isNaN(fechaObj)) return false;
    if (!CATEGORIAS.includes(categoria)) return false;
    if (!subcategoria.trim()) return false;
    if (monto <= 0) return false;

    // Antes de agregar, calculamos saldo actual para saber si supera asignación
    const saldoActual = calcularSaldoPorCategoria();
    const saldoRestante = asignacionManual[categoria] - saldoActual[categoria];

    // Si gasto supera lo que queda en la categoría avisamos en confirmación
    let mensaje = `¿Confirmás registrar