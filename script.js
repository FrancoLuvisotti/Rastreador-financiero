document.addEventListener("DOMContentLoaded", () => {
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

    const formMovimiento = document.getElementById("formMovimiento");
    const tablaMovimientosBody = document.querySelector("#tablaMovimientos tbody");
    const movimientosTotales = document.getElementById("movimientosTotales");
    const saldoSemanalDiv = document.getElementById("saldoSemanal");
    const saldoMensualDiv = document.getElementById("saldoMensual");
    const resumenMensualBody = document.querySelector("#resumenMensual tbody");
    const btnResetear = document.getElementById("btnResetear");

    let movimientos = JSON.parse(localStorage.getItem("movimientos")) || [];
    let ingresoMensual = parseFloat(localStorage.getItem("ingresoMensual")) || 100000;
    let asignaciones = JSON.parse(localStorage.getItem("asignaciones")) || {
        Necesidad: ingresoMensual * 0.5,
        Deseo: ingresoMensual * 0.3,
        Ahorro: ingresoMensual * 0.2
    };

    ingresoMensualInput.value = ingresoMensual;

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
        } else {
            errorAsignacion.style.display = "none";
        }
    }

    function guardarAsignaciones() {
        asignaciones = {
            Necesidad: parseFloat(asignacionNecesidadInput.value) || 0,
            Deseo: parseFloat(asignacionDeseoInput.value) || 0,
            Ahorro: parseFloat(asignacionAhorroInput.value) || 0
        };
        localStorage.setItem("asignaciones", JSON.stringify(asignaciones));
    }

    btnGuardarIngreso.addEventListener("click", () => {
        ingresoMensual = parseFloat(ingresoMensualInput.value) || 0;
        localStorage.setItem("ingresoMensual", ingresoMensual);
        const sugerencias = calcularSugerencias();

        // Advertencia si valores distintos
        [asignacionNecesidadInput, asignacionDeseoInput, asignacionAhorroInput].forEach((input, idx) => {
            const keys = ["Necesidad", "Deseo", "Ahorro"];
            if (parseFloat(input.value) !== sugerencias[keys[idx]]) {
                if (!confirm(`Has puesto un valor diferente al recomendado para ${keys[idx]}. ¿Seguro que quieres continuar?`)) {
                    input.value = sugerencias[keys[idx]];
                }
            }
        });

        guardarAsignaciones();
        actualizarTotalAsignado();
        actualizarResumen();
    });

    function calcularSemanaDelMes(fecha) {
        const f = new Date(fecha);
        const dia = f.getDate();
        return Math.ceil(dia / 7);
    }

    function actualizarResumen() {
        tablaMovimientosBody.innerHTML = "";
        let totales = { Necesidad: 0, Deseo: 0, Ahorro: 0 };
        movimientos.forEach(mov => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${mov.fecha}</td>
                <td>${mov.semana}</td>
                <td>${mov.categoria}</td>
                <td>${mov.subcategoria}</td>
                <td>${mov.monto.toFixed(2)}</td>
            `;
            tablaMovimientosBody.appendChild(tr);
            totales[mov.categoria] += mov.monto;
        });

        // Mostrar saldos
        saldoMensualDiv.innerHTML = Object.keys(asignaciones).map(cat => {
            const restante = asignaciones[cat] - totales[cat];
            return `<div style="color:${restante >= 0 ? 'green' : 'red'}">
                        ${cat}: $${restante.toFixed(2)} restante
                    </div>`;
        }).join("");

        // Resumen mensual
        resumenMensualBody.innerHTML = Object.keys(asignaciones).map(cat => {
            const porcentaje = asignaciones[cat] > 0 ? (totales[cat] / asignaciones[cat]) * 100 : 0;
            return `<tr>
                        <td>${cat}</td>
                        <td>${totales[cat].toFixed(2)}</td>
                        <td>${porcentaje.toFixed(1)}%</td>
                    </tr>`;
        }).join("");
    }

    formMovimiento.addEventListener("submit", e => {
        e.preventDefault();
        const fecha = document.getElementById("inputFecha").value;
        const categoria = document.getElementById("selectCategoria").value;
        const subcategoria = document.getElementById("inputSubcategoria").value;
        const monto = parseFloat(document.getElementById("inputMonto").value);

        // Verificar saldo antes de registrar
        const gastado = movimientos.filter(m => m.categoria === categoria).reduce((a, b) => a + b.monto, 0);
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
        actualizarResumen();
        formMovimiento.reset();
    });

    btnResetear.addEventListener("click", () => {
        if (confirm("¿Seguro que quieres resetear todo para un nuevo mes?")) {
            movimientos = [];
            localStorage.removeItem("movimientos");
            actualizarResumen();
        }
    });

    // Inicializar
    asignacionNecesidadInput.value = asignaciones.Necesidad;
    asignacionDeseoInput.value = asignaciones.Deseo;
    asignacionAhorroInput.value = asignaciones.Ahorro;
    calcularSugerencias();
    actualizarTotalAsignado();
    actualizarResumen();
});