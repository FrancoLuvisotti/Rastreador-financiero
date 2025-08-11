document.addEventListener("DOMContentLoaded", () => {
  // Elementos DOM
  const ingresoMensualInput = document.getElementById("inputIngresoMensual");
  const btnGuardarIngreso = document.getElementById("btnGuardarIngreso");
  const asignacionNecesidadInput = document.getElementById("inputAsignacionNecesidad");
  const asignacionDeseoInput = document.getElementById("inputAsignacionDeseo");
  const asignacionAhorroInput = document.getElementById("inputAsignacionAhorro");
  const sugerenciaNecesidad = document.getElementById("sugerenciaNecesidad");
  const sugerenciaDeseo = document.getElementById("sugerenciaDeseo");
  const sugerenciaAhorro = document.getElementById("sugerenciaAhorro");
  const totalAsignadoSpan = document.getElementById("totalAsignado");
  const errorAsignacion = document.getElementById("errorAsignacion");
  const ingresoMensualMostrado = document.getElementById("ingresoMensualMostrado");
  const barraAsignacion = document.getElementById("barraAsignacion");

  const formMovimiento = document.getElementById("formMovimiento");
  const tablaMovimientosBody = document.querySelector("#tablaMovimientos tbody");
  const movimientosTotales = document.getElementById("movimientosTotales");
  const saldoSemanalDiv = document.getElementById("saldoSemanal");
  const saldoMensualDiv = document.getElementById("saldoMensual");
  const resumenMensualBody = document.querySelector("#resumenMensual tbody");
  const btnResetear = document.getElementById("btnResetear");
  const filtroCategoria = document.getElementById("filtroCategoria");
  const btnExportarCSV = document.getElementById("btnExportarCSV");

  // Variables
  let movimientos = JSON.parse(localStorage.getItem("movimientos")) || [];
  let ingresoMensual = parseFloat(localStorage.getItem("ingresoMensual")) || 100000;
  let asignaciones = JSON.parse(localStorage.getItem("asignaciones")) || {
    Necesidad: ingresoMensual * 0.5,
    Deseo: ingresoMensual * 0.3,
    Ahorro: ingresoMensual * 0.2
  };

  ingresoMensualInput.value = ingresoMensual;
  ingresoMensualMostrado.textContent = ingresoMensual.toFixed(2);

  function calcularSugerencias() {
    const sugerencias = {
      Necesidad: ingresoMensual * 0.5,
      Deseo: ingresoMensual * 0.3,
      Ahorro: ingresoMensual * 0.2
    };
    sugerenciaNecesidad.textContent = `Recomendado: $${sugerencias.Necesidad.toFixed(2)}`;
    sugerenciaDeseo.textContent = `Recomendado: $${sugerencias.Deseo.toFixed(2)}`;
    sugerenciaAhorro.textContent = `Recomendado: $${sugerencias.Ahorro.toFixed(2)}`;
    return sugerencias;
  }

  function actualizarTotalAsignado() {
    const totalAsignado =
      parseFloat(asignacionNecesidadInput.value || 0) +
      parseFloat(asignacionDeseoInput.value || 0) +
      parseFloat(asignacionAhorroInput.value || 0);
    totalAsignadoSpan.textContent = totalAsignado.toFixed(2);

    if (totalAsignado > ingresoMensual) {
      errorAsignacion.textContent = "⚠ El total asignado supera el ingreso mensual.";
      errorAsignacion.style.display = "block";
      btnGuardarIngreso.disabled = true;
    } else if (totalAsignado < ingresoMensual) {
      errorAsignacion.textContent = "⚠ El total asignado es menor que el ingreso mensual.";
      errorAsignacion.style.display = "block";
      btnGuardarIngreso.disabled = true;
    } else {
      errorAsignacion.style.display = "none";
      btnGuardarIngreso.disabled = false;
    }

    // Actualizar barra visual
    const necesidadPct = (parseFloat(asignacionNecesidadInput.value || 0) / ingresoMensual) * 100;
    const deseoPct = (parseFloat(asignacionDeseoInput.value || 0) / ingresoMensual) * 100;
    const ahorroPct = (parseFloat(asignacionAhorroInput.value || 0) / ingresoMensual) * 100;

    barraAsignacion.innerHTML = `
      <div class="barra-seccion barra-necesidad" style="width:${necesidadPct}%" title="Necesidad ${necesidadPct.toFixed(1)}%"></div>
      <div class="barra-seccion barra-deseo" style="width:${deseoPct}%" title="Deseo ${deseoPct.toFixed(1)}%"></div>
      <div class="barra-seccion barra-ahorro" style="width:${ahorroPct}%" title="Ahorro ${ahorroPct.toFixed(1)}%"></div>
    `;
  }

  function guardarAsignaciones() {
    asignaciones = {
      Necesidad: parseFloat(asignacionNecesidadInput.value) || 0,
      Deseo: parseFloat(asignacionDeseoInput.value) || 0,
      Ahorro: parseFloat(asignacionAhorroInput.value) ||

Ahorro: parseFloat(asignacionAhorroInput.value) || 0
    };
    localStorage.setItem("asignaciones", JSON.stringify(asignaciones));
  }

  // Calcula semana del mes considerando lunes como inicio de semana
  function calcularSemanaDelMes(fechaStr) {
    const fecha = new Date(fechaStr);
    const primerDiaMes = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
    // Día de semana ajustado (lunes=1,...domingo=7)
    const diaSemanaPrimerDia = (primerDiaMes.getDay() + 6) % 7;
    const diaMes = fecha.getDate();
    return Math.ceil((diaMes + diaSemanaPrimerDia) / 7);
  }

  // Renderizar movimientos con opción a filtro y acciones
  function renderMovimientos() {
    const filtro = filtroCategoria.value;
    tablaMovimientosBody.innerHTML = "";
    let totales = { Necesidad: 0, Deseo: 0, Ahorro: 0 };

    // Filtrar movimientos
    let movsFiltrados = filtro ? movimientos.filter(m => m.categoria === filtro) : movimientos;

    movsFiltrados.forEach((mov, idx) => {
      const tr = document.createElement("tr");
      const fechaObj = new Date(mov.fecha);
      const diaSemanaStr = fechaObj.toLocaleDateString("es-AR", { weekday: "short" });

      tr.innerHTML = `
        <td data-label="Fecha">${mov.fecha}</td>
        <td data-label="Día">${diaSemanaStr}</td>
        <td data-label="Semana">${mov.semana}</td>
        <td data-label="Categoría">${mov.categoria}</td>
        <td data-label="Subcategoría">${mov.subcategoria}</td>
        <td data-label="Monto ($)">${mov.monto.toFixed(2)}</td>
        <td data-label="Acciones">
          <button class="btnEditar" data-index="${idx}" aria-label="Editar movimiento">✏️</button>
          <button class="btnBorrar" data-index="${idx}" aria-label="Eliminar movimiento">🗑️</button>
        </td>
      `;
      tablaMovimientosBody.appendChild(tr);
      totales[mov.categoria] += mov.monto;
    });

    movimientosTotales.textContent = `Movimientos mostrados: ${movsFiltrados.length}`;

    actualizarSaldos(totales);
    actualizarResumen(totales);
  }

  // Actualizar saldos mensual y semanal con colores y alertas
  function actualizarSaldos(totales) {
    // Saldo mensual
    saldoMensualDiv.innerHTML = Object.keys(asignaciones).map(cat => {
      const restante = asignaciones[cat] - (totales[cat] || 0);
      const color = restante >= 0 ? "var(--verde)" : "var(--rojo)";
      return `<div style="color:${color}; font-weight: 600;">
        ${cat}: $${restante.toFixed(2)} restante
      </div>`;
    }).join("");

    // Saldo semanal (simplificado: divide asignación mensual / 4 semanas)
    const semanasMes = 4;
    const totalesPorSemana = { Necesidad: 0, Deseo: 0, Ahorro: 0 };
    const semanaActual = getSemanaActual();

    movimientos.forEach(mov => {
      if (mov.semana === semanaActual) {
        totalesPorSemana[mov.categoria] = (totalesPorSemana[mov.categoria] || 0) + mov.monto;
      }
    });

    saldoSemanalDiv.innerHTML = Object.keys(asignaciones).map(cat => {
      const saldoSem = asignaciones[cat] / semanasMes - (totalesPorSemana[cat] || 0);
      const color = saldoSem >= 0 ? "var(--verde)" : "var(--rojo)";
      return `<div style="color:${color}; font-weight: 600;">
        ${cat} (semana ${semanaActual}): $${saldoSem.toFixed(2)} restante
      </div>`;
    }).join("");
  }

  function getSemanaActual() {
    const hoy = new Date();
    return calcularSemanaDelMes(hoy.toISOString().slice(0, 10));
  }

  // Actualiza resumen mensual tabla y gráfico
  let chartResumen = null;
  function actualizarResumen(totales) {
    resumenMensualBody.innerHTML = Object.keys(asignaciones).map(cat => {
      const totalGastado = totales[cat] || 0;
      const porcentaje = asignaciones[cat] > 0 ? (totalGastado / asignaciones[cat]) * 100 : 0;
      return `<tr>
        <td>${cat}</td>
        <td>${totalGastado.toFixed(2)}</td>
        <td>${porcentaje.toFixed(1)}%</td>
      </tr>`;
    }).join("");

    // Actualizar gráfico
    const ctx = document.getElementById("graficoResumen").getContext("2d");
    const data = {
      labels: Object.keys(asignaciones),
      datasets: [{
        label: "Gasto mensual",
        data: Object.keys(asignaciones).map(cat => totales[cat] || 0),
        backgroundColor: ['var(--verde)', 'var(--amarillo)', 'var(--azul)'],
        borderWidth: 1
      }]
    };

    if (chartResumen) {
      chartResumen.data = data;
      chartResumen.update();
    } else {
      chartResumen = new Chart(ctx, {
        type: "bar",
        data,
        options: {
          scales: {
            y: { beginAtZero: true }
          },
          plugins: {
            legend: { display: false }
          }
        }
      });
    }
  }

  // Eventos
  btnGuardarIngreso.addEventListener("click", () => {
    ingresoMensual = parseFloat(ingresoMensualInput.value) || 0;
    if (ingresoMensual <= 0) {
      alert("El ingreso mensual debe ser mayor que cero.");
      return;
    }
    localStorage.setItem("ingresoMensual", ingresoMensual);
    ingresoMensualMostrado.textContent = ingresoMensual.toFixed(2);

    const sugerencias = calcularSugerencias();

    // Validar asignaciones y pedir confirmación si son distintas a sugeridas
    ["Necesidad", "Deseo", "Ahorro"].forEach(cat => {
      const input = {
        Necesidad: asignacionNecesidadInput,
        Deseo: asignacionDeseoInput,
        Ahorro: asignacionAhorroInput
      }[cat];
      if (parseFloat(input.value) !== sugerencias[cat]) {
        if (!confirm(`Has puesto un valor diferente al recomendado para ${cat} ($${input.value}). ¿Seguro que quieres continuar?`)) {
          input.value = sugerencias[cat].toFixed(2);
        }
      }
    });

    guardarAsignaciones();
    actualizarTotalAsignado();
    renderMovimientos();
  });

  // Actualiza total asignado y barra cuando cambia cualquier input de asignación
  [asignacionNecesidadInput, asignacionDeseoInput, asignacionAhorroInput].forEach(input => {
    input.addEventListener("input", () => {
      actualizarTotalAsignado();
    });
  });

  // Al enviar movimiento nuevo
  formMovimiento.addEventListener("submit", e => {
    e.preventDefault();
    const fecha = document.getElementById("inputFecha").value;
    const categoria = document.getElementById("selectCategoria").value;
    const subcategoria = document.getElementById("inputSubcategoria").value.trim();
    const monto = parseFloat(document.getElementById("inputMonto").value);

    if (!fecha || !categoria || !subcategoria || !monto || monto <= 0) {
      alert("Complete todos los campos correctamente.");
      return;
    }

    // Validar saldo disponible
    const gastado = movimientos.filter(m => m.categoria === categoria).reduce((acc, cur) => acc + cur.monto, 0);
    const saldoDisponible = asignaciones[categoria] - gastado;

    if (monto > saldoDisponible) {
      if (!confirm(`Este gasto supera el saldo disponible de ${categoria} ($${saldoDisponible.toFixed(2)}). ¿Quieres registrarlo igualmente?`)) {
        return;
      }
    }

    movimientos.push({
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

  // Filtro categoría
  filtroCategoria.addEventListener("change", () => {
    localStorage.setItem("filtroCategoria", filtroCategoria.value);
    renderMovimientos();
  });

  // Cargar filtro guardado
  const filtroGuardado = localStorage.getItem("filtroCategoria") || "";
  filtroCategoria.value = filtroGuardado;

  // Botones editar y borrar con delegación
  tablaMovimientosBody.addEventListener("click", (e) => {
    if (e.target.classList.contains("btnBorrar")) {
      const idx = e.target.getAttribute("data-index");
      if (confirm("¿Seguro que quieres eliminar este movimiento?")) {
        movimientos.splice(idx, 1);
        localStorage.setItem("movimientos", JSON.stringify(movimientos));
        renderMovimientos();
      }
    } else if (e.target.classList.contains("btnEditar")) {
      const idx = e.target.getAttribute("data-index");
      editarMovimiento(idx);
    }
  });

  // Función para editar un movimiento
  function editarMovimiento(idx) {
    const mov = movimientos[idx];
    // Usaremos prompt para simplicidad; en producción se recomienda un modal
    const nuevaFecha = prompt("Editar fecha (YYYY-MM-DD):", mov.fecha);
    if (!nuevaFecha) return;
    const nuevaCategoria = prompt("Editar categoría (Necesidad, Deseo, Ahorro):", mov.categoria);
    if (!["Necesidad","Deseo","Ahorro"].includes(nuevaCategoria)) {
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

    movimientos[idx] = {
      fecha: nuevaFecha,
      semana: calcularSemanaDelMes(nuevaFecha),
      categoria: nuevaCategoria,
      subcategoria: nuevaSubcategoria,
      monto: nuevoMonto
    };
    localStorage.setItem("movimientos", JSON.stringify(movimientos));
    renderMovimientos();
  }

  // Botón resetear mes
  btnResetear.addEventListener("click", () => {
    if (confirm("¿Seguro que quieres resetear todo para un nuevo mes?")) {
      movimientos = [];
      localStorage.removeItem("movimientos");
      renderMovimientos();
    }
  });

  // Exportar resumen mensual a CSV (Excel)
  btnExportarCSV.addEventListener("click", () => {
    const filas = [
      ["Categoría", "Total gastado ($)", "% respecto presupuesto"]
    ];
    const totales = { Necesidad: 0, Deseo: 0, Ahorro: 0 };
    movimientos.forEach(m => {
      totales[m.categoria] = (totales[m.categoria] || 0) + m.monto;
    });
    Object.keys(asignaciones).forEach(cat => {
      const totalGastado = totales[cat] || 0;
      const porcentaje = asignaciones[cat] > 0 ? (totalGastado / asignaciones[cat]) * 100 : 0;
      filas.push([cat, totalGastado.toFixed(2), porcentaje.toFixed(1) + "%"]);
    });

    const csvContent = filas.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "resumen_mensual.csv";
    a.click();
    URL.revokeObjectURL(url);
  });

  // Inicialización
  const sugerencias = calcularSugerencias();

  if (!localStorage.getItem("asignaciones")) {
    asignacionNecesidadInput.value = sugerencias.Necesidad.toFixed(2);
    asignacionDeseoInput.value = sugerencias.Deseo.toFixed(2);
    asignacionAhorroInput.value = sugerencias.Ahorro.toFixed(2);
    guardarAsignaciones();
  } else {
    asignacionNecesidadInput.value = asignaciones.Necesidad;
    asignacionDeseoInput.value = asignaciones.Deseo;
    asignacionAhorroInput.value = asignaciones.Ahorro;
  }

  actualizarTotalAsignado();
  renderMovimientos();

});