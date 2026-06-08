const { createApp, ref, computed, nextTick } = Vue;

createApp({
  setup() {
    // --- NAVEGACIÓN ---
    const seccionActual = ref("inicio");

    const cambiarSeccion = (seccion) => {
      seccionActual.value = seccion;

      if (seccion === "estadisticas") {
        cargarEstadisticas();
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
            text: "Has demostrado conocer todas las normas de esta calle. ¡Buen trabajo!",
            icon: "success",
            confirmButtonText: "Genial",
            confirmButtonColor: "#264653",
          });
        }, 800);
      }
    };

    // --- ESTADO DEL PERSONAJE ---
    const personaje = ref({ x: 50, y: 85 }); // Inicia abajo en el centro
    const teclas = ref({ w: false, a: false, s: false, d: false });

    // --- CONTROLES DE TECLADO (PC) Y ATAJOS PARA ALERTAS ---
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
        const teclasMovimiento = [
          "w",
          "a",
          "s",
          "d",
          "arrowup",
          "arrowdown",
          "arrowleft",
          "arrowright",
          " ",
        ];

        if (teclasMovimiento.includes(key)) {
          e.preventDefault();
        }

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

    // --- CONTROLES TÁCTILES (Móvil) ---
    const moverJoystick = (dir, estado) => {
      if (dir === "up") teclas.value.w = estado;
      if (dir === "down") teclas.value.s = estado;
      if (dir === "left") teclas.value.a = estado;
      if (dir === "right") teclas.value.d = estado;
    };

    // --- MOTOR DEL JUEGO (60 FPS) ---
    setInterval(() => {
      if (seccionActual.value !== "simulador") return;

      if (Swal.isVisible()) {
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

    // --- DETECTOR DE PROXIMIDAD ---
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
        text: "Llegas a la intersección y el semáforo está en rojo. ¿Qué decides hacer?",
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
            text: "Cruzar en rojo puede causar accidentes.",
            icon: "error",
            confirmButtonColor: "#264653",
          });
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          Swal.fire({
            title: "¡Excelente decisión!",
            text: "Debes esperar luz verde para cruzar de forma segura.",
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
        text: "Llegas a una intersección y ves una señal de ALTO. ¿Qué decides hacer?",
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
            text: "Siempre debes detenerte ante una señal de ALTO para revisar la vía.",
            icon: "success",
            confirmButtonColor: "#264653",
          });
          registrarAcierto("alto");
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          Swal.fire({
            title: "¡Error grave!",
            text: "Ignorar un ALTO causa colisiones severas en intersecciones.",
            icon: "error",
            confirmButtonColor: "#264653",
          });
        }
      });
    };

    const evaluarBus = () => {
      Swal.fire({
        title: "Parada de Bus",
        text: "Te bajaste del bus y necesitas cruzar. El vehículo sigue estacionado. ¿Por dónde pasas?",
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
            text: "Cruzar al frente bloquea tu visibilidad y la de los autos que rebasan.",
            icon: "error",
            confirmButtonColor: "#264653",
          });
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          Swal.fire({
            title: "¡Correcto!",
            text: "Espera a que el bus marche para tener una vista clara en ambos sentidos.",
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
        text: "Necesitas cruzar al otro lado. Hay un paso de cebra a unos 20 metros. ¿Qué haces?",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#264653",
        cancelButtonColor: "#264653",
        confirmButtonText: "Camino hacia el paso peatonal [E]",
        cancelButtonText: "Cruzo por aquí rápido [Q]",
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire({
            title: "¡Perfecto!",
            text: "Los pasos peatonales garantizan tu derecho preferente de paso.",
            icon: "success",
            confirmButtonColor: "#264653",
          });
          registrarAcierto("peatonal");
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          Swal.fire({
            title: "¡Acción de riesgo!",
            text: "Cruzar de manera imprevista te expone a velocidades altas.",
            icon: "error",
            confirmButtonColor: "#264653",
          });
        }
      });
    };

    // ==========================================
    // 2. ESTADO Y LÓGICA DE TESTIMONIOS
    // ==========================================
    const formTestimonio = ref({
      nombre: "",
      edad: "",
      tipoAccidente: "",
      historia: "",
    });

    const enviarTestimonio = async () => {
      try {
        const respuesta = await fetch("http://localhost:3000/api/testimonios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formTestimonio.value),
        });

        if (respuesta.ok) {
          Swal.fire({
            title: "¡Gracias por compartir!",
            text: "Tu historia ha sido guardada y ayudará a crear conciencia en otros conductores.",
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
            "Hubo un problema al guardar tu historia en la base de datos.",
            "error",
          );
        }
      } catch (error) {
        console.error("Error de conexión:", error);
        Swal.fire(
          "Error de Conexión",
          "No se pudo conectar con el servidor backend.",
          "error",
        );
      }
    };

    // ==========================================
    // 3. ESTADO Y LÓGICA DEL DESAFÍO VIAL (TEST)
    // ==========================================
    const nombreUsuario = ref("");
    const testIniciado = ref(false);
    const testTerminado = ref(false);
    const preguntaActual = ref(0);
    const respuestasCorrectasTest = ref(0);
    const puntuacionTest = ref(0);
    const preguntasTest = ref([]);
    const intentoFallido = ref(false);

    // BANCO MAESTRO DE PREGUNTAS
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
          "La línea continua significa que no hay visibilidad o espacio seguro. Cruzarla es causa frecuente de colisiones frontales.",
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
        explicacion:
          "El peatón es el eslabón más vulnerable de las calles y siempre tiene la prioridad en las zonas demarcadas.",
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
        explicacion:
          "Al girar a la izquierda, cruzas el carril del vehículo que viene en sentido contrario, por lo que es tu deber esperar a que pase.",
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
        explicacion:
          "Conducir contra la vía, sin importar la distancia, es una falta gravísima que expone a todos a un choque frontal sorpresivo.",
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
        explicacion:
          "La falta de luz reduce la visión de todos. La ropa clara y las luces en buen estado son tu mejor escudo para hacerte visible a distancia.",
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
          "Ocupar el centro de tu carril te hace visible y evita que otros conductores intenten rebasarte peligrosamente compartiendo el mismo espacio.",
      },
      {
        texto:
          "¿Cuál es el requisito indispensable de protección al viajar en motocicleta?",
        opciones: [
          "Que tanto el conductor como el pasajero lleven un casco correctamente abrochado.",
          "Que solo el conductor use casco, ya que es quien maneja.",
          "Usar rodilleras gruesas y gafas de sol.",
        ],
        respuestaCorrecta:
          "Que tanto el conductor como el pasajero lleven un casco correctamente abrochado.",
        explicacion:
          "El casco salva vidas, pero solo si está bien sujeto a la barbilla. Un casco suelto saldrá volando antes de que ocurra el impacto.",
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
        explicacion:
          "Todos los vehículos tienen ángulos muertos. Siempre debes girar levemente la cabeza para revisar estas áreas antes de cambiar de carril.",
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
        explicacion:
          "La distracción mental de una llamada (incluso con manos libres) es tan peligrosa como conducir bajo los efectos del alcohol.",
      },
    ];

    // FUNCIÓN PARA MEZCLAR PREGUNTAS
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

      preguntasTest.value = preguntasMezcladas.slice(0, 7).map((p) => {
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
      const respuestaElegida = pregunta.opciones[indiceOpcion];
      const esCorrecta = respuestaElegida === pregunta.respuestaCorrecta;

      if (esCorrecta) {
        if (!intentoFallido.value) {
          respuestasCorrectasTest.value++;
        }

        await Swal.fire({
          title: "¡Correcto!",
          text: pregunta.explicacion,
          icon: "success",
          confirmButtonColor: "#264653",
          confirmButtonText: "Siguiente Pregunta",
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
            await fetch("http://localhost:3000/api/test-resultados", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                usuario: nombreUsuario.value,
                puntuacion: puntuacionTest.value,
                respuestasCorrectas: respuestasCorrectasTest.value,
              }),
            });
            console.log("[INFO] Resultado del desafío guardado correctamente.");
            // Actualizar gráficos después de guardar el nuevo resultado
            cargarEstadisticas();
          } catch (error) {
            console.error("[ERROR] No se pudo guardar el resultado:", error);
          }
        }
      } else {
        intentoFallido.value = true;

        await Swal.fire({
          title: "¡Casi!",
          text: "Esa no es la respuesta correcta. ¡Analiza bien la situación e inténtalo de nuevo!",
          icon: "warning",
          confirmButtonColor: "#264653",
          confirmButtonText: "Reintentar",
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
    };

    // ==========================================
    // 4. LÓGICA DE ESTADÍSTICAS Y GRÁFICOS
    // ==========================================
    const totalRespuestasCorrectas = ref(0);
    const totalRespuestasIncorrectas = ref(0);
    let chartInstancia = null;

    const cargarEstadisticas = async () => {
      try {
        const respuesta = await fetch(
          "http://localhost:3000/api/test-resultados",
        );
        if (respuesta.ok) {
          const datos = await respuesta.json();
          let correctas = 0;
          let incorrectas = 0;

          datos.forEach((resultado) => {
            // Asumiendo que cada test tiene 7 preguntas en total
            correctas += resultado.respuestasCorrectas;
            incorrectas += 7 - resultado.respuestasCorrectas;
          });

          totalRespuestasCorrectas.value = correctas;
          totalRespuestasIncorrectas.value = incorrectas;

          // Renderizamos el gráfico con una pequeña pausa para asegurar que el DOM esté listo
          nextTick(() => {
            renderizarGrafico();
          });
        }
      } catch (error) {
        console.error("Error al cargar estadísticas:", error);
      }
    };

    const renderizarGrafico = () => {
      const ctx = document.getElementById("testChart");
      if (!ctx) return;

      // Si ya existe un gráfico, lo destruimos antes de crear uno nuevo para evitar superposiciones
      if (chartInstancia) {
        chartInstancia.destroy();
      }

      chartInstancia = new Chart(ctx, {
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
                "rgba(46, 204, 113, 0.8)", // Verde para aciertos
                "rgba(231, 76, 60, 0.8)", // Rojo para fallos
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
            legend: {
              position: "bottom",
            },
            title: {
              display: true,
              text: "Desempeño Global en el Desafío Vial",
            },
          },
        },
      });
    };

    // --- RETORNO AL TEMPLATE (EXPORTS) ---
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
