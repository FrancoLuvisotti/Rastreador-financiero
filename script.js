document.addEventListener("DOMContentLoaded", () => {
  // Elementos DOM
  const ingresoSemanalInput = document.getElementById("inputIngresoSemanal");
  const btnGuardarIngreso = document.getElementById("btnGuardarIngreso");
  const asignacionNecesidadInput = document.getElementById("inputAsignacionNecesidad");
  const asignacionDeseoInput = document.getElementById("inputAsignacionDeseo");
  const asignacionAhorroInput = document.getElementById("inputAsignacionAhorro");
  const sugerenciaNecesidad = document.getElementById("sugerenciaNecesidad");
  const sugerenciaDeseo = document.getElementById("sugerenciaDeseo");
  const sugerenciaAhorro = document.getElementById("sugerenciaAhorro");
  const totalAsignadoSpan = document.getElementById("totalAsignado");
  const errorAsignacion = document.getElementById("errorAsignacion");
  const ingresoSemanalMostrado = document.getElementById("ingresoSemanalMostrado");
  const barraAsignacion = document.getElementById("barraAsignacion");

  const formMovimiento = document.getElementById("formMovimiento");
  const tablaMovimientosBody = document.querySelector("#tablaMovimientos-body");
  const movimientosTotales = document.getElementById("movimientosTotales");
  const saldosDiv = document.getElementById("saldos");
  const resumenMensualBody = document.querySelector("#resumenMensual-body");
  const btnIniciarNuevoMes = document.getElementById("btnIniciarNuevoMes");
  const filtroCategoria = document.getElementById("filtroCategoria");
  const filtroTiempo = document.getElementById("filtroTiempo");
  const btnExportarCSV = document.getElementById("btnExportarCSV");
  const historialMesesDiv = document.getElementById('historialMeses');
  const tipoSeguimientoSelect = document.getElementById('tipoSeguimiento');

  // Elementos DOM para la gestión de subcategorías
  const btnSeleccionarSubcategoria = document.getElementById('btnSeleccionarSubcategoria');
  const inputSubcategoria = document.getElementById('inputSubcategoria');
  const modalSubcategorias = document.getElementById('modalSubcategorias');
  const listaSubcategorias = document.getElementById('listaSubcategorias');
  const btnCerrarModal = document.getElementById('btnCerrarModal');
  const inputNuevaSubcategoria = document.getElementById('inputNuevaSubcategoria');
  const btnAgregarSubcategoria = document.getElementById('btnAgregarSubcategoria');

  // Variables
  let movimientos = JSON.parse(localStorage.getItem("movimientos")) || [];
  let ingresoBase = parseFloat(localStorage.getItem("ingresoBase")) || 25000;
  let tipoSeguimiento = localStorage.getItem("tipoSeguimiento") || 'semanal';

  const ingresoLabel = document.querySelector('label[for="inputIngresoSemanal"]');
  ingresoLabel.textContent = tipoSeguimiento === 'semanal' ? 'Ingreso semanal ($):' : 'Ingreso mensual ($):';
  
  // CORRECCIÓN: Aquí nos aseguramos de que el objeto de asignaciones siempre tenga las claves correctas
  let asignaciones = JSON.parse(localStorage.getItem("asignaciones")) || {};
  if (!asignaciones["Gastos Fijos"] && !asignaciones["Gastos Variados"]) {
    // Si no existen las nuevas claves, se crean con los valores por defecto
    asignaciones = {
      "Gastos Fijos": ingresoBase * 0.5,
      "Gastos Variados": ingresoBase * 0.3,
      "Ahorro": ingresoBase * 0.2
    };
  }

  let subcategoriasGuardadas = JSON.parse(localStorage.getItem('subcategorias')) || [];
  let historial = JSON.parse(localStorage.getItem('historial')) || {};

  // Gráficos
  let chartPresupuesto = null;
  let chartTendencia = null;

  // Funciones de utilidad
  function generarUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0,
        v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function formatMoney(amount) {
    return `$${parseFloat(amount).toFixed(2)}`;
  }
  
  function calcularSugerencias() {
    const sugerencias = {
      "Gastos Fijos": ingresoBase * 0.5,
      "Gastos Variados": ingresoBase * 0.3,
      "Ahorro": ingresoBase * 0.2
    };
    sugerenciaNecesidad.textContent = `Recomendado: ${formatMoney(sugerencias["Gastos Fijos"])}`;
    sugerenciaDeseo.textContent = `Recomendado: ${formatMoney(sugerencias["Gastos Variados"])}`;
    sugerenciaAhorro.textContent = `Recomendado: ${formatMoney(sugerencias["Ahorro"])}`;
    return sugerencias;
  }

  function actualizarTotalAsignado() {
    const totalAsignado =
      parseFloat(asignacionNecesidadInput.value || 0) +
      parseFloat(asignacionDeseoInput.value || 0) +
      parseFloat(asignacionAhorroInput.value || 0);
    totalAsignadoSpan.textContent = formatMoney(totalAsignado);

    const isTotalValid = Math.abs(totalAsignado - ingresoBase) < 0.01;
    btnGuardarIngreso.disabled = !isTotalValid;

    if (totalAsignado > ingresoBase) {
      errorAsignacion.textContent = `⚠ El total asignado supera el ingreso ${tipoSeguimiento === 'semanal' ? 'semanal' : 'mensual'}.`;
      errorAsignacion.style.display = "block";
    } else if (totalAsignado < ingresoBase) {
      errorAsignacion.textContent = `⚠ El total asignado es menor que el ingreso ${tipoSeguimiento === 'semanal' ? 'semanal' : 'mensual'}.`;
      errorAsignacion.style.display = "block";
    } else {
      errorAsignacion.style.display = "none";
    }

    const necesidadPct = (parseFloat(asignacionNecesidadInput.value || 0) / ingresoBase) * 100;
    const deseoPct = (parseFloat(asignacionDeseoInput.value || 0) / ingresoBase) * 100;
    const ahorroPct = (parseFloat(asignacionAhorroInput.value || 0) / ingresoBase) * 100;

    barraAsignacion.innerHTML = `
      <div class="barra-seccion barra-necesidad" style="width:${necesidadPct}%" title="Gastos Fijos ${necesidadPct.toFixed(1)}%"></div>
      <div class="barra-seccion barra-deseo" style="width:${deseoPct}%" title="Gastos Variados ${deseoPct.toFixed(1)}%"></div>
      <div class="barra-seccion barra-ahorro" style="width:${ahorroPct}%" title="Ahorro ${ahorroPct.toFixed(1)}%"></div>
    `;
  }

  function guardarAsignaciones() {
    asignaciones = {
      "Gastos Fijos": parseFloat(asignacionNecesidadInput.value) || 0,
      "Gastos Variados": parseFloat(asignacionDeseoInput.value) || 0,
      "Ahorro": parseFloat(asignacionAhorroInput.value) || 0
    };
    localStorage.setItem("asignaciones", JSON.stringify(asignaciones));
  }

  function calcularSemanaDelMes(fechaStr) {
    const fecha = new Date(fechaStr + 'T00:00:00');
    const primerDiaMes = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
    const diaSemanaPrimerDia = (primerDiaMes.getDay() + 6) % 7;
    const diaMes = fecha.getDate();
    return Math.ceil((diaMes + diaSemanaPrimerDia) / 7);
  }

  function getFechasFiltro(filtro) {
    const hoy = new Date();
    if (filtro === 'semana') {
      const diaDeLaSemana = (hoy.getDay() + 6) % 7;
      const inicioSemana = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - diaDeLaSemana);
      const finSemana = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - diaDeLaSemana + 6);
      return { inicio: inicioSemana.toISOString().slice(0, 10), fin: finSemana.toISOString().slice(0, 10) };
    } else { // mes
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
      return { inicio: inicioMes.toISOString().slice(0, 10), fin: finMes.toISOString().slice(0, 10) };
    }
  }

  function renderMovimientos() {
    const filtroCat = filtroCategoria.value;
    const filtroT = tipoSeguimiento;
    const { inicio, fin } = getFechasFiltro(filtroT);

    tablaMovimientosBody.innerHTML = "";
    let movsFiltrados = movimientos.filter(m => m.fecha >= inicio && m.fecha <= fin);

    if (filtroCat) {
      movsFiltrados = movsFiltrados.filter(m => m.categoria === filtroCat);
    }

    movsFiltrados.forEach((mov) => {
      const tr = document.createElement("tr");
      const fechaObj = new Date(mov.fecha + 'T00:00:00');
      const diaSemanaStr = fechaObj.toLocaleDateString("es-AR", { weekday: "short" });

      tr.innerHTML = `
        <td data-label="Fecha">${mov.fecha}</td>
        <td data-label="Día">${diaSemanaStr}</td>
        <td data-label="Semana">${mov.semana}</td>
        <td data-label="Categoría">${mov.categoria}</td>
        <td data-label="Subcategoría">${mov.subcategoria}</td>
        <td data-label="Monto ($)">${formatMoney(mov.monto)}</td>
        <td data-label="Acciones">
          <button class="btnEditar" data-id="${mov.id}" aria-label="Editar movimiento">✏️</button>
          <button class="btnBorrar" data-id="${mov.id}" aria-label="Eliminar movimiento">🗑️</button>
        </td>
      `;
      tablaMovimientosBody.appendChild(tr);
    });

    movimientosTotales.textContent = `Movimientos mostrados: ${movsFiltrados.length}`;
    actualizarSaldos();
    actualizarResumen();
    actualizarGraficos();
  }
  
  function actualizarSaldos() {
    saldosDiv.innerHTML = "";

    const { inicio, fin } = getFechasFiltro(tipoSeguimiento);
    const movimientosPeriodoActual = movimientos.filter(m => m.fecha >= inicio && m.fecha <= fin && m.categoria !== 'Ingreso');
    const totalesPeriodo = movimientosPeriodoActual.reduce((acc, mov) => {
      acc[mov.categoria] = (acc[mov.categoria] || 0) + mov.monto;
      return acc;
    }, { "Gastos Fijos": 0, "Gastos Variados": 0, "Ahorro": 0 });

    // CORRECCIÓN: Usamos Object.keys(asignaciones) para asegurarnos de que solo se usen las categorías existentes
    const saldoHTML = Object.keys(asignaciones).map(cat => {
      const restante = asignaciones[cat] - (totalesPeriodo[cat] || 0);
      const color = restante >= 0 ? "var(--verde)" : "var(--rojo)";
      return `<div style="color:${color}; font-weight: 600;">
        ${cat}: ${formatMoney(restante)} restante
      </div>`;
    }).join("");
    
    const titulo = tipoSeguimiento === 'semanal' ? 'Saldo semanal' : 'Saldo mensual';
    saldosDiv.innerHTML = `<h3>${titulo}</h3>${saldoHTML}`;
  }

  function actualizarResumen() {
    const totales = movimientos.filter(m => m.categoria !== 'Ingreso').reduce((acc, mov) => {
      acc[mov.categoria] = (acc[mov.categoria] || 0) + mov.monto;
      return acc;
    }, { "Gastos Fijos": 0, "Gastos Variados": 0, "Ahorro": 0 });

    resumenMensualBody.innerHTML = Object.keys(asignaciones).map(cat => {
      const totalGastado = totales[cat] || 0;
      const presupuestoTotal = asignaciones[cat] || 0;
      const porcentaje = presupuestoTotal > 0 ? (totalGastado / presupuestoTotal) * 100 : 0;
      return `<tr>
        <td>${cat}</td>
        <td>${formatMoney(presupuestoTotal)}</td>
        <td>${formatMoney(totalGastado)}</td>
        <td>${porcentaje.toFixed(1)}%</td>
      </tr>`;
    }).join("");
  }
  
  function actualizarGraficos() {
    const gastosPeriodoActual = movimientos.filter(m => {
        const { inicio, fin } = getFechasFiltro(tipoSeguimiento);
        return m.fecha >= inicio && m.fecha <= fin && m.categoria !== 'Ingreso';
    }).reduce((acc, mov) => {
        acc[mov.categoria] = (acc[mov.categoria] || 0) + mov.monto;
        return acc;
    }, { "Gastos Fijos": 0, "Gastos Variados": 0, "Ahorro": 0 });

    const presupuestoPeriodo = {
      "Gastos Fijos": asignaciones["Gastos Fijos"] || 0,
      "Gastos Variados": asignaciones["Gastos Variados"] || 0,
      "Ahorro": asignaciones.Ahorro || 0
    };

    // Gráfico de Presupuesto vs Gasto
    const ctxPresupuesto = document.getElementById("graficoPresupuesto").getContext("2d");
    if (chartPresupuesto) chartPresupuesto.destroy();
    chartPresupuesto = new Chart(ctxPresupuesto, {
      type: 'bar',
      data: {
        labels: ['Gastos Fijos', 'Gastos Variados', 'Ahorro'],
        datasets: [{
          label: `Presupuesto ${tipoSeguimiento === 'semanal' ? 'Semanal' : 'Mensual'}`,
          data: [presupuestoPeriodo["Gastos Fijos"], presupuestoPeriodo["Gastos Variados"], presupuestoPeriodo.Ahorro],
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }, {
          label: `Gasto ${tipoSeguimiento === 'semanal' ? 'Semanal' : 'Mensual'}`,
          data: [gastosPeriodoActual["Gastos Fijos"], gastosPeriodoActual["Gastos Variados"], gastosPeriodoActual.Ahorro],
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true }
        }
      }
    });

    // Gráfico de Tendencia Mensual
    const ctxTendencia = document.getElementById("graficoTendencia").getContext("2d");
    if (chartTendencia) chartTendencia.destroy();
    
    const meses = {};
    const nombresMeses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    movimientos.filter(m => m.categoria !== 'Ingreso').forEach(m => {
        const fecha = new Date(m.fecha);
        const mes = `${nombresMeses[fecha.getMonth()]}-${fecha.getFullYear()}`;
        if (!meses[mes]) meses[mes] = 0;
        meses[mes] += m.monto;
    });
    
    Object.keys(historial).forEach(mes => {
        const totalGastado = historial[mes].movimientos.filter(m => m.categoria !== 'Ingreso').reduce((sum, mov) => sum + mov.monto, 0);
        meses[mes] = totalGastado;
    });

    const labelsTendencia = Object.keys(meses).sort((a, b) => {
      const [mesA, anioA] = a.split('-');
      const [mesB, anioB] = b.split('-');
      const fechaA = new Date(`${mesA} 1, ${anioA}`);
      const fechaB = new Date(`${mesB} 1, ${anioB}`);
      return fechaA - fechaB;
    });
    const dataTendencia = labelsTendencia.map(label => meses[label]);

    chartTendencia = new Chart(ctxTendencia, {
      type: 'line',
      data: {
        labels: labelsTendencia,
        datasets: [{
          label: 'Gasto Total',
          data: dataTendencia,
          borderColor: 'var(--azul)',
          backgroundColor: 'rgba(33, 150, 243, 0.2)',
          tension: 0.1,
          fill: true
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }
  
  // Función para renderizar la lista de subcategorías en la modal
  function renderListaSubcategorias() {
    listaSubcategorias.innerHTML = '';
    subcategoriasGuardadas.forEach(sub => {
      const li = document.createElement('li');
      li.innerHTML = `
        <button class="btn-seleccionar-subcategoria" data-subcategoria="${sub}">${sub}</button>
        <button class="btn-eliminar-subcategoria" data-subcategoria="${sub}">❌</button>
      `;
      listaSubcategorias.appendChild(li);
    });
  }

  // Event Listeners
  btnGuardarIngreso.addEventListener("click", () => {
    ingresoBase = parseFloat(ingresoSemanalInput.value) || 0;
    if (ingresoBase <= 0) {
      alert(`El ingreso ${tipoSeguimiento === 'semanal' ? 'semanal' : 'mensual'} debe ser mayor que cero.`);
      return;
    }
    localStorage.setItem("ingresoBase", ingresoBase);
    ingresoSemanalMostrado.textContent = formatMoney(ingresoBase);

    const sugerencias = calcularSugerencias();
    
    const categorias = ["Gastos Fijos", "Gastos Variados", "Ahorro"];
    categorias.forEach(cat => {
        const input = {
            "Gastos Fijos": asignacionNecesidadInput,
            "Gastos Variados": asignacionDeseoInput,
            "Ahorro": asignacionAhorroInput
        }[cat];
        
        if (parseFloat(input.value).toFixed(2) !== sugerencias[cat].toFixed(2)) {
            if (!confirm(`Has puesto un valor diferente al recomendado para ${cat} (${formatMoney(input.value)} vs ${formatMoney(sugerencias[cat])}). ¿Seguro que quieres continuar?`)) {
                input.value = sugerencias[cat].toFixed(2);
            }
        }
    });

    guardarAsignaciones();
    actualizarTotalAsignado();
    renderMovimientos();
  });
  
  tipoSeguimientoSelect.addEventListener('change', () => {
      tipoSeguimiento = tipoSeguimientoSelect.value;
      localStorage.setItem('tipoSeguimiento', tipoSeguimiento);
      const ingresoLabel = document.querySelector('label[for="inputIngresoSemanal"]');
      ingresoLabel.textContent = tipoSeguimiento === 'semanal' ? 'Ingreso semanal ($):' : 'Ingreso mensual ($):';
      actualizarInterfazSegunSeguimiento();
  });
  
  ingresoSemanalInput.addEventListener("input", () => {
    ingresoBase = parseFloat(ingresoSemanalInput.value) || 0;
    ingresoSemanalMostrado.textContent = formatMoney(ingresoBase);
    calcularSugerencias();
    actualizarTotalAsignado();
  });

  [asignacionNecesidadInput, asignacionDeseoInput, asignacionAhorroInput].forEach(input => {
    input.addEventListener("input", () => {
      actualizarTotalAsignado();
    });
  });

  formMovimiento.addEventListener("submit", e => {
    e.preventDefault();
    const fecha = document.getElementById("inputFecha").value;
    const categoria = document.getElementById("selectCategoria").value;
    const subcategoria = inputSubcategoria.value.trim();
    const monto = parseFloat(document.getElementById("inputMonto").value);

    if (!fecha || !categoria || !subcategoria || !monto || monto <= 0) {
      alert("Complete todos los campos correctamente.");
      return;
    }
    
    if (categoria !== 'Ingreso') {
      const { inicio, fin } = getFechasFiltro(tipoSeguimiento);
      const gastadoEnPeriodo = movimientos.filter(m => m.categoria === categoria && m.fecha >= inicio && m.fecha <= fin).reduce((acc, cur) => acc + cur.monto, 0);
      const saldoDisponible = asignaciones[categoria] - gastadoEnPeriodo;
      const periodoNombre = tipoSeguimiento === 'semanal' ? 'semanal' : 'mensual';
  
      if (monto > saldoDisponible) {
        if (!confirm(`Este gasto (${formatMoney(monto)}) supera el saldo disponible ${periodoNombre} de ${categoria} (${formatMoney(saldoDisponible)}). ¿Quieres registrarlo igualmente?`)) {
          return;
        }
      }
    }

    if (!subcategoriasGuardadas.includes(subcategoria)) {
      subcategoriasGuardadas.push(subcategoria);
      localStorage.setItem('subcategorias', JSON.stringify(subcategoriasGuardadas));
    }

    movimientos.push({
      id: generarUUID(),
      fecha,
      semana: calcularSemanaDelMes(fecha),
      categoria,
      subcategoria,
      monto
    });

    localStorage.setItem("movimientos", JSON.stringify(movimientos));
    renderMovimientos();
    formMovimiento.reset();
  });

  filtroCategoria.addEventListener("change", renderMovimientos);
  filtroTiempo.addEventListener("change", renderMovimientos);

  tablaMovimientosBody.addEventListener("click", (e) => {
    const target = e.target;
    const id = target.getAttribute("data-id");
    if (!id) return;

    if (target.classList.contains("btnBorrar")) {
      if (confirm("¿Seguro que quieres eliminar este movimiento?")) {
        movimientos = movimientos.filter(m => m.id !== id);
        localStorage.setItem("movimientos", JSON.stringify(movimientos));
        renderMovimientos();
      }
    } else if (target.classList.contains("btnEditar")) {
      editarMovimiento(id);
    }
  });

  function editarMovimiento(id) {
    const mov = movimientos.find(m => m.id === id);
    if (!mov) return;

    const nuevaFecha = prompt("Editar fecha (YYYY-MM-DD):", mov.fecha);
    if (!nuevaFecha) return;
    const nuevaCategoria = prompt("Editar categoría (Gastos Fijos, Gastos Variados, Ahorro, Ingreso):", mov.categoria);
    if (!["Gastos Fijos", "Gastos Variados", "Ahorro", "Ingreso"].includes(nuevaCategoria)) {
      alert("Categoría inválida");
      return;
    }
    const nuevaSubcategoria = prompt("Editar subcategoría:", mov.subcategoria);
    if (!nuevaSubcategoria) return;
    const nuevoMontoStr = prompt("Editar monto:", mov.monto.toFixed(2));
    const nuevoMonto = parseFloat(nuevoMontoStr);
    if (isNaN(nuevoMonto) || nuevoMonto <= 0) {
      alert("Monto inválido");
      return;
    }

    const movIndex = movimientos.findIndex(m => m.id === id);
    if (movIndex !== -1) {
      movimientos[movIndex] = {
        id: mov.id,
        fecha: nuevaFecha,
        semana: calcularSemanaDelMes(nuevaFecha),
        categoria: nuevaCategoria,
        subcategoria: nuevaSubcategoria,
        monto: nuevoMonto
      };
      localStorage.setItem("movimientos", JSON.stringify(movimientos));
      renderMovimientos();
    }
  }

  // Listeners para el modal de subcategorías
  btnSeleccionarSubcategoria.addEventListener('click', () => {
    renderListaSubcategorias();
    modalSubcategorias.showModal();
  });

  btnCerrarModal.addEventListener('click', () => {
    modalSubcategorias.close();
  });

  listaSubcategorias.addEventListener('click', (e) => {
    const target = e.target;
    if (target.classList.contains('btn-seleccionar-subcategoria')) {
      const subcategoria = target.getAttribute('data-subcategoria');
      inputSubcategoria.value = subcategoria;
      btnSeleccionarSubcategoria.textContent = subcategoria;
      modalSubcategorias.close();
    } else if (target.classList.contains('btn-eliminar-subcategoria')) {
      const subcategoria = target.getAttribute('data-subcategoria');
      if (confirm(`¿Estás seguro de que quieres eliminar la subcategoría "${subcategoria}"?`)) {
        subcategoriasGuardadas = subcategoriasGuardadas.filter(sub => sub !== subcategoria);
        localStorage.setItem('subcategorias', JSON.stringify(subcategoriasGuardadas));
        renderListaSubcategorias();
      }
    }
  });

  btnAgregarSubcategoria.addEventListener('click', () => {
    const nuevaSubcategoria = inputNuevaSubcategoria.value.trim();
    if (nuevaSubcategoria && !subcategoriasGuardadas.includes(nuevaSubcategoria)) {
      subcategoriasGuardadas.push(nuevaSubcategoria);
      localStorage.setItem('subcategorias', JSON.stringify(subcategoriasGuardadas));
      renderListaSubcategorias();
      inputNuevaSubcategoria.value = '';
    } else {
      alert('La subcategoría no puede estar vacía o ya existe.');
    }
  });

  btnIniciarNuevoMes.addEventListener("click", () => {
    if (confirm("¿Estás seguro de que quieres iniciar un nuevo mes? Esto archivará el mes actual y reiniciará todos los movimientos.")) {
      const fechaActual = new Date();
      const mesActual = fechaActual.toLocaleString('es-AR', { month: 'long', year: 'numeric' });
      
      historial[mesActual] = {
        ingresoBase: ingresoBase,
        tipoSeguimiento: tipoSeguimiento,
        asignaciones: asignaciones,
        movimientos: movimientos
      };
      localStorage.setItem('historial', JSON.stringify(historial));

      movimientos = [];
      localStorage.removeItem("movimientos");
      renderMovimientos();
      renderHistorialMeses();
    }
  });

  function renderHistorialMeses() {
    historialMesesDiv.innerHTML = '';
    const mesesDisponibles = Object.keys(historial);
    mesesDisponibles.forEach(mes => {
      const button = document.createElement('button');
      button.textContent = mes;
      button.classList.add('btn-historial');
      button.addEventListener('click', () => {
        mostrarResumenHistorial(mes);
      });
      historialMesesDiv.appendChild(button);
    });
  }

  function mostrarResumenHistorial(mes) {
    const datos = historial[mes];
    if (!datos) return;
    
    let resumen = `--- Resumen de ${mes} ---\n\n`;
    resumen += `Ingreso ${datos.tipoSeguimiento === 'semanal' ? 'Semanal' : 'Mensual'}: ${formatMoney(datos.ingresoBase)}\n`;
    resumen += `Asignaciones:\n`;
    Object.keys(datos.asignaciones).forEach(cat => {
      resumen += `  - ${cat}: ${formatMoney(datos.asignaciones[cat])}\n`;
    });
    
    resumen += `\nDetalles de Movimientos:\n`;
    datos.movimientos.forEach(mov => {
      resumen += `  - ${mov.fecha}: ${mov.categoria} - ${mov.subcategoria}: ${formatMoney(mov.monto)}\n`;
    });

    alert(resumen);
  }

  btnExportarCSV.addEventListener("click", () => {
    const filasMovimientos = [
      ["id", "fecha", "semana", "categoría", "subcategoría", "monto"]
    ];
    movimientos.forEach(m => {
      filasMovimientos.push([m.id, m.fecha, m.semana, m.categoria, m.subcategoria, m.monto.toFixed(2)]);
    });

    const csvContent = "Detalle de Movimientos\n" + filasMovimientos.map(e => e.join(",")).join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "movimientos_financieros.csv";
    a.click();
    URL.revokeObjectURL(url);
  });
  
  function actualizarInterfazSegunSeguimiento() {
    const ingresoLabel = document.querySelector('label[for="inputIngresoSemanal"]');
    ingresoLabel.textContent = tipoSeguimiento === 'semanal' ? 'Ingreso semanal ($):' : 'Ingreso mensual ($):';
    
    if (tipoSeguimiento === 'mensual') {
      filtroTiempo.value = 'mes';
      filtroTiempo.disabled = true;
    } else {
      filtroTiempo.disabled = false;
    }
    
    if (tipoSeguimiento === 'mensual' && localStorage.getItem('ingresoBaseSemanal') !== null) {
      ingresoBase = parseFloat(localStorage.getItem('ingresoBaseSemanal')) * 4;
      localStorage.setItem('ingresoBase', ingresoBase);
      localStorage.removeItem('ingresoBaseSemanal');
    } else if (tipoSeguimiento === 'semanal' && localStorage.getItem('ingresoBaseMensual') !== null) {
      ingresoBase = parseFloat(localStorage.getItem('ingresoBaseMensual')) / 4;
      localStorage.setItem('ingresoBase', ingresoBase);
      localStorage.removeItem('ingresoBaseMensual');
    }
    
    ingresoSemanalInput.value = ingresoBase;
    ingresoSemanalMostrado.textContent = formatMoney(ingresoBase);
    
    const sugerencias = calcularSugerencias();
    asignacionNecesidadInput.value = asignaciones["Gastos Fijos"].toFixed(2);
    asignacionDeseoInput.value = asignaciones["Gastos Variados"].toFixed(2);
    asignacionAhorroInput.value = asignaciones.Ahorro.toFixed(2);

    actualizarTotalAsignado();
    renderMovimientos();
  }

  // Inicialización
  ingresoSemanalInput.value = ingresoBase;
  ingresoSemanalMostrado.textContent = formatMoney(ingresoBase);
  tipoSeguimientoSelect.value = tipoSeguimiento;

  const sugerencias = calcularSugerencias();
  if (!localStorage.getItem("asignaciones")) {
    asignacionNecesidadInput.value = sugerencias["Gastos Fijos"].toFixed(2);
    asignacionDeseoInput.value = sugerencias["Gastos Variados"].toFixed(2);
    asignacionAhorroInput.value = sugerencias.Ahorro.toFixed(2);
    guardarAsignaciones();
  } else {
    asignacionNecesidadInput.value = asignaciones["Gastos Fijos"].toFixed(2);
    asignacionDeseoInput.value = asignaciones["Gastos Variados"].toFixed(2);
    asignacionAhorroInput.value = asignaciones.Ahorro.toFixed(2);
  }
  
  renderHistorialMeses();
  actualizarTotalAsignado();
  actualizarInterfazSegunSeguimiento();
});
