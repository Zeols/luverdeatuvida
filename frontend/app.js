const { createApp, ref, nextTick } = Vue;

createApp({
  setup() {
    // ==========================================
    // CONFIGURACIÓN DE CONEXIÓN AL BACKEND
    // ==========================================
    const API_URL =
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "localhost"
        ? "http://localhost:3000/api"
        : "/api";

    // --- NAVEGACIÓN ---
    const seccionActual = ref("inicio");

    const cambiarSeccion = (seccion) => {
      seccionActual.value = seccion;

      if (seccion === "estadisticas") {
        cargarStatsTest();
        renderizarGrafico();
      }
      if (seccion === "test") {
        cargarStatsTest();
      }
    };

    // ==========================================
    // 1. ESTADO Y LÓGICA DEL SIMULADOR
    // ==========================================
    const puntuacion = ref(0);
    const completados = ref({
      semaforo: false,
      alto: false,
      bus: false,
      peatonal: false,
    });

    const registrarAcierto = (clave) => {
      puntuacion.value += 10;
      completados.value[clave] = true;
      if (puntuacion.value === 40) {
        setTimeout(() => {
          Swal.fire({
            title: "¡Zona Completada!",
            text: "Has demostrado conocer todas las normas. ¡Buen trabajo!",
            icon: "success",
            confirmButtonText: "Genial",
            confirmButtonColor: "#264653",
          });
        }, 800);
      }
    };

    const personaje = ref({ x: 50, y: 85 });
    const teclas = ref({ w: false, a: false, s: false, d: false });

    window.addEventListener(
      "keydown",
      (e) => {
        if (Swal.isVisible()) {
          const key = e.key.toLowerCase();
          if (key === "e") {
            Swal.clickConfirm();
            e.preventDefault();
            e.stopPropagation();
          } else if (key === "q") {
            Swal.clickCancel();
            e.preventDefault();
            e.stopPropagation();
          }
          return;
        }
        if (seccionActual.value !== "simulador") return;
        const key = e.key.toLowerCase();
        if (
          [
            "w",
            "a",
            "s",
            "d",
            "arrowup",
            "arrowdown",
            "arrowleft",
            "arrowright",
            " ",
          ].includes(key)
        )
          e.preventDefault();
        if (["w", "a", "s", "d"].includes(key)) teclas.value[key] = true;
        if (key === "arrowup") teclas.value.w = true;
        if (key === "arrowdown") teclas.value.s = true;
        if (key === "arrowleft") teclas.value.a = true;
        if (key === "arrowright") teclas.value.d = true;
      },
      { capture: true },
    );

    window.addEventListener("keyup", (e) => {
      if (seccionActual.value !== "simulador") return;
      const key = e.key.toLowerCase();
      if (["w", "a", "s", "d"].includes(key)) teclas.value[key] = false;
      if (key === "arrowup") teclas.value.w = false;
      if (key === "arrowdown") teclas.value.s = false;
      if (key === "arrowleft") teclas.value.a = false;
      if (key === "arrowright") teclas.value.d = false;
    });

    const moverJoystick = (dir, estado) => {
      if (dir === "up") teclas.value.w = estado;
      if (dir === "down") teclas.value.s = estado;
      if (dir === "left") teclas.value.a = estado;
      if (dir === "right") teclas.value.d = estado;
    };

    setInterval(() => {
      if (seccionActual.value !== "simulador" || Swal.isVisible()) {
        if (Swal.isVisible())
          teclas.value = { w: false, a: false, s: false, d: false };
        return;
      }
      let velocidad = 0.8;
      if (teclas.value.w && personaje.value.y > 5)
        personaje.value.y -= velocidad;
      if (teclas.value.s && personaje.value.y < 95)
        personaje.value.y += velocidad;
      if (teclas.value.a && personaje.value.x > 5)
        personaje.value.x -= velocidad;
      if (teclas.value.d && personaje.value.x < 95)
        personaje.value.x += velocidad;
      verificarColisiones();
    }, 20);

    const verificarColisiones = () => {
      const zonas = [
        { id: "semaforo", x: 25, y: 15, trigger: evaluarSemaforo },
        { id: "alto", x: 75, y: 35, trigger: evaluarAlto },
        { id: "bus", x: 8, y: 45, trigger: evaluarBus },
        { id: "peatonal", x: 42, y: 65, trigger: evaluarPeatonal },
      ];
      for (let zona of zonas) {
        if (!completados.value[zona.id]) {
          let dist = Math.sqrt(
            Math.pow(personaje.value.x - zona.x, 2) +
              Math.pow(personaje.value.y - zona.y, 2),
          );
          if (dist < 8) {
            personaje.value.y += 10;
            zona.trigger();
          }
        }
      }
    };

    const evaluarSemaforo = () => {
      Swal.fire({
        title: "Semáforo en Rojo",
        text: "¿Qué decides hacer?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#264653",
        cancelButtonColor: "#264653",
        confirmButtonText: "Cruzar ahora [E]",
        cancelButtonText: "Esperar[Q]",
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire({
            title: "¡Cuidado!",
            text: "Cruzar en rojo causa accidentes.",
            icon: "error",
            confirmButtonColor: "#264653",
          });
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          Swal.fire({
            title: "¡Excelente decisión!",
            icon: "success",
            confirmButtonColor: "#264653",
          });
          registrarAcierto("semaforo");
        }
      });
    };

    const evaluarAlto = () => {
      Swal.fire({
        title: "Señal de ALTO",
        text: "¿Qué decides hacer?",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#264653",
        cancelButtonColor: "#264653",
        confirmButtonText: "Detenerme por completo [E]",
        cancelButtonText: "Pasar directo [Q]",
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire({
            title: "¡Bien hecho!",
            icon: "success",
            confirmButtonColor: "#264653",
          });
          registrarAcierto("alto");
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          Swal.fire({
            title: "¡Error grave!",
            icon: "error",
            confirmButtonColor: "#264653",
          });
        }
      });
    };

    const evaluarBus = () => {
      Swal.fire({
        title: "Parada de Bus",
        text: "El vehículo sigue estacionado. ¿Por dónde pasas?",
        icon: "info",
        showCancelButton: true,
        confirmButtonColor: "#264653",
        cancelButtonColor: "#264653",
        confirmButtonText: "Por delante del bus [E]",
        cancelButtonText: "Espero que el bus se vaya [Q]",
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire({
            title: "¡Peligro!",
            icon: "error",
            confirmButtonColor: "#264653",
          });
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          Swal.fire({
            title: "¡Correcto!",
            icon: "success",
            confirmButtonColor: "#264653",
          });
          registrarAcierto("bus");
        }
      });
    };

    const evaluarPeatonal = () => {
      Swal.fire({
        title: "Cruzar la Carretera",
        text: "Hay un paso de cebra cerca. ¿Qué haces?",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#264653",
        cancelButtonColor: "#264653",
        confirmButtonText: "Voy al paso peatonal [E]",
        cancelButtonText: "Cruzo rápido aquí [Q]",
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire({
            title: "¡Perfecto!",
            icon: "success",
            confirmButtonColor: "#264653",
          });
          registrarAcierto("peatonal");
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          Swal.fire({
            title: "¡Acción de riesgo!",
            icon: "error",
            confirmButtonColor: "#264653",
          });
        }
      });
    };

    // ==========================================
    // 2. LÓGICA DE GRÁFICOS Y ESTADÍSTICAS GLOBALES
    // ==========================================
    let miGrafico = null;
    let chartTestInstancia = null;
    const totalRespuestasCorrectas = ref(0);
    const totalRespuestasIncorrectas = ref(0);

    const renderizarGrafico = () => {
      setTimeout(() => {
        const ctx = document.getElementById("graficoCausas");
        if (ctx) {
          if (miGrafico) miGrafico.destroy();
          miGrafico = new Chart(ctx, {
            type: "doughnut",
            data: {
              labels: [
                "Estado de Ebriedad",
                "Exceso de Velocidad",
                "Invasión de Carril",
                "Otras Causas",
              ],
              datasets: [
                {
                  data: [40, 35, 15, 10],
                  backgroundColor: ["#e76f51", "#e9c46a", "#264653", "#457b9d"],
                },
              ],
            },
            options: { responsive: true, maintainAspectRatio: false },
          });
        }
      }, 300);
    };

    const renderizarGraficoTest = () => {
      const ctx = document.getElementById("testChart");
      if (!ctx) return;
      if (chartTestInstancia) chartTestInstancia.destroy();

      chartTestInstancia = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: ["Aciertos", "Fallos"],
          datasets: [
            {
              data: [
                totalRespuestasCorrectas.value,
                totalRespuestasIncorrectas.value,
              ],
              backgroundColor: [
                "rgba(46, 204, 113, 0.8)",
                "rgba(231, 76, 60, 0.8)",
              ],
              borderColor: ["rgba(46, 204, 113, 1)", "rgba(231, 76, 60, 1)"],
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom" },
          },
        },
      });
    };

    const cargarStatsTest = async () => {
      try {
        const res = await fetch(`${API_URL}/test-resultados`);
        if (res.ok) {
          const data = await res.json();
          let aciertos = 0,
            fallos = 0;

          if (data && data.length > 0) {
            data.forEach((test) => {
              aciertos += test.respuestasCorrectas;
              // Tu banco de preguntas tiene 9 preguntas, así que restamos de 9
              fallos += 9 - test.respuestasCorrectas;
            });
          }
          totalRespuestasCorrectas.value = aciertos;
          totalRespuestasIncorrectas.value = fallos;

          // Dibujar el gráfico del test si estamos en esa vista
          nextTick(() => {
            renderizarGraficoTest();
          });
        }
      } catch (e) {
        console.error(
          "No se pudieron cargar las estadísticas del test de MongoDB:",
          e,
        );
      }
    };

    // ==========================================
    // 3. ESTADO Y LÓGICA DE TESTIMONIOS
    // ==========================================
    const formTestimonio = ref({
      nombre: "",
      edad: "",
      tipoAccidente: "",
      historia: "",
    });

    const enviarTestimonio = async () => {
      try {
        const respuesta = await fetch(`${API_URL}/testimonios`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formTestimonio.value),
        });

        if (respuesta.ok) {
          Swal.fire({
            title: "¡Gracias!",
            text: "Testimonio guardado exitosamente.",
            icon: "success",
            confirmButtonColor: "#264653",
          });
          formTestimonio.value = {
            nombre: "",
            edad: "",
            tipoAccidente: "",
            historia: "",
          };
        } else {
          Swal.fire(
            "Error",
            "Problema al guardar en la base de datos.",
            "error",
          );
        }
      } catch (error) {
        Swal.fire(
          "Error de Conexión",
          "Asegúrate de que el servidor Node.js esté encendido.",
          "error",
        );
      }
    };

    // ==========================================
    // 4. ESTADO Y LÓGICA DEL DESAFÍO VIAL (TEST)
    // ==========================================
    const nombreUsuario = ref("");
    const testIniciado = ref(false);
    const testTerminado = ref(false);
    const preguntaActual = ref(0);
    const respuestasCorrectasTest = ref(0);
    const puntuacionTest = ref(0);
    const preguntasTest = ref([]);
    const intentoFallido = ref(false);

    const bancoPreguntas = [
      {
        texto:
          "¿Qué indica una línea amarilla continua en el centro de la vía?",
        opciones: [
          "Prohibido rebasar o adelantar.",
          "Se puede rebasar si no vienen autos.",
          "Es una calle de un solo sentido.",
        ],
        respuestaCorrecta: "Prohibido rebasar o adelantar.",
        explicacion:
          "La línea continua significa que no hay visibilidad o espacio seguro.",
      },
      {
        texto:
          "¿Quién tiene la preferencia absoluta de paso en un cruce peatonal señalizado?",
        opciones: [
          "El peatón.",
          "El vehículo más pesado (buses o camiones).",
          "El vehículo que llegue primero al cruce.",
        ],
        respuestaCorrecta: "El peatón.",
        explicacion: "El peatón es el eslabón más vulnerable de las calles.",
      },
      {
        texto:
          "Si dos vehículos se encuentran de frente en una intersección sin semáforo, ¿quién debe ceder el paso?",
        opciones: [
          "El que tiene la intención de girar a la izquierda.",
          "El que va a seguir recto.",
          "El vehículo de menor tamaño.",
        ],
        respuestaCorrecta: "El que tiene la intención de girar a la izquierda.",
        explicacion: "Al girar, cruzas el carril del otro vehículo.",
      },
      {
        texto:
          "¿Bajo qué circunstancia es permitido manejar en sentido contrario en una calle de una sola vía?",
        opciones: [
          "Bajo ninguna circunstancia.",
          "Solo si es una emergencia comprobada.",
          "Si es solo por una cuadra y no se ve tráfico.",
        ],
        respuestaCorrecta: "Bajo ninguna circunstancia.",
        explicacion: "Es una falta gravísima que expone a todos.",
      },
      {
        texto:
          "Para aumentar tu seguridad al transitar de noche, es vital asegurarte de:",
        opciones: [
          "Tener luces funcionales, usar ropa clara y moderar la velocidad.",
          "Usar ropa oscura para no deslumbrar y mantener las luces altas.",
          "Conducir lo más rápido posible para salir de las zonas sin iluminación.",
        ],
        respuestaCorrecta:
          "Tener luces funcionales, usar ropa clara y moderar la velocidad.",
        explicacion: "La falta de luz reduce la visión de todos.",
      },
      {
        texto:
          "¿Cuál es la posición más segura para circular dentro de un carril si vas en un vehículo de dos ruedas?",
        opciones: [
          "En el centro del carril, dominando el espacio.",
          "Sobre la línea divisoria blanca para evitar el tráfico.",
          "Pegado a la orilla derecha para dejar que los autos pasen en el mismo carril.",
        ],
        respuestaCorrecta: "En el centro del carril, dominando el espacio.",
        explicacion:
          "Evita que otros conductores intenten rebasarte peligrosamente.",
      },
      {
        texto:
          "¿Cuál es el requisito indispensable de protección al viajar en motocicleta?",
        opciones: [
          "Que tanto el conductor como el pasajero lleven un casco correctamente abrochado.",
          "Que solo el conductor use casco.",
          "Usar rodilleras gruesas y gafas de sol.",
        ],
        respuestaCorrecta:
          "Que tanto el conductor como el pasajero lleven un casco correctamente abrochado.",
        explicacion: "El casco salva vidas, pero solo si está bien sujeto.",
      },
      {
        texto:
          "¿A qué nos referimos cuando hablamos de los 'puntos ciegos' en un vehículo?",
        opciones: [
          "A las áreas alrededor del vehículo que los espejos retrovisores no logran captar.",
          "Al deslumbramiento momentáneo producido por las luces altas de otro auto.",
          "A las zonas de la carretera donde no hay alumbrado público.",
        ],
        respuestaCorrecta:
          "A las áreas alrededor del vehículo que los espejos retrovisores no logran captar.",
        explicacion: "Todos los vehículos tienen ángulos muertos.",
      },
      {
        texto:
          "Si necesitas atender el celular con urgencia mientras estás conduciendo, la acción más segura es:",
        opciones: [
          "Buscar un lugar seguro para estacionarse completamente y luego revisar el teléfono.",
          "Usar el altavoz o manos libres sin necesidad de reducir la velocidad.",
          "Contestar rápidamente sosteniendo el teléfono con una sola mano.",
        ],
        respuestaCorrecta:
          "Buscar un lugar seguro para estacionarse completamente y luego revisar el teléfono.",
        explicacion: "La distracción mental de una llamada es muy peligrosa.",
      },
    ];

    const mezclarArreglo = (arreglo) => {
      let nuevoArreglo = [...arreglo];
      for (let i = nuevoArreglo.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [nuevoArreglo[i], nuevoArreglo[j]] = [nuevoArreglo[j], nuevoArreglo[i]];
      }
      return nuevoArreglo;
    };

    const iniciarTest = () => {
      let preguntasMezcladas = mezclarArreglo(bancoPreguntas);
      preguntasTest.value = preguntasMezcladas.slice(0, 9).map((p) => {
        return {
          texto: p.texto,
          opciones: mezclarArreglo(p.opciones),
          respuestaCorrecta: p.respuestaCorrecta,
          explicacion: p.explicacion,
        };
      });
      testIniciado.value = true;
      intentoFallido.value = false;
    };

    const responderTest = async (indiceOpcion) => {
      const pregunta = preguntasTest.value[preguntaActual.value];
      const esCorrecta =
        pregunta.opciones[indiceOpcion] === pregunta.respuestaCorrecta;

      if (esCorrecta) {
        if (!intentoFallido.value) respuestasCorrectasTest.value++;

        await Swal.fire({
          title: "¡Correcto!",
          text: pregunta.explicacion,
          icon: "success",
          confirmButtonColor: "#264653",
        });
        intentoFallido.value = false;

        if (preguntaActual.value < preguntasTest.value.length - 1) {
          preguntaActual.value++;
        } else {
          testTerminado.value = true;
          puntuacionTest.value = Math.round(
            (respuestasCorrectasTest.value / preguntasTest.value.length) * 100,
          );
          try {
            // ¡Aquí es donde la magia ocurre y usamos "usuario" para que encaje con MongoDB!
            await fetch(`${API_URL}/test-resultados`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                usuario: nombreUsuario.value,
                puntuacion: puntuacionTest.value,
                respuestasCorrectas: respuestasCorrectasTest.value,
              }),
            });
            cargarStatsTest(); // Actualizar las estadísticas instantáneamente
          } catch (e) {
            console.error("Error guardando el test", e);
          }
        }
      } else {
        intentoFallido.value = true;
        await Swal.fire({
          title: "¡Casi!",
          text: "Inténtalo de nuevo.",
          icon: "warning",
          confirmButtonColor: "#264653",
        });
      }
    };

    const reiniciarTest = () => {
      testIniciado.value = false;
      testTerminado.value = false;
      preguntaActual.value = 0;
      respuestasCorrectasTest.value = 0;
      nombreUsuario.value = "";
      intentoFallido.value = false;
      cargarStatsTest();
    };

    return {
      seccionActual,
      cambiarSeccion,
      puntuacion,
      completados,
      evaluarSemaforo,
      evaluarAlto,
      evaluarBus,
      evaluarPeatonal,
      formTestimonio,
      enviarTestimonio,
      nombreUsuario,
      testIniciado,
      testTerminado,
      preguntaActual,
      preguntasTest,
      puntuacionTest,
      iniciarTest,
      responderTest,
      reiniciarTest,
      personaje,
      moverJoystick,
      totalRespuestasCorrectas,
      totalRespuestasIncorrectas,
    };
  },
}).mount("#app");



