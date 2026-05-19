const { createApp, ref, computed } = Vue;

createApp({
  setup() {
    // --- NAVEGACIÓN ---
    const seccionActual = ref("inicio");

    const cambiarSeccion = (seccion) => {
      seccionActual.value = seccion;
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
            confirmButtonColor: "#3498db",
          });
        }, 800);
      }
    };

    const evaluarSemaforo = () => {
      Swal.fire({
        title: "Semáforo en Rojo",
        text: "Llegas a la intersección y el semáforo está en rojo. ¿Qué decides hacer?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#e74c3c",
        cancelButtonColor: "#2ecc71",
        confirmButtonText: "Cruzar ahora",
        cancelButtonText: "Esperar",
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire(
            "¡Cuidado!",
            "Cruzar en rojo puede causar accidentes.",
            "error",
          );
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          Swal.fire(
            "¡Excelente decisión!",
            "Debes esperar luz verde para cruzar de forma segura.",
            "success",
          );
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
        confirmButtonColor: "#2ecc71",
        cancelButtonColor: "#e74c3c",
        confirmButtonText: "Detenerme por completo",
        cancelButtonText: "Pasar directo",
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire(
            "¡Bien hecho!",
            "Siempre debes detenerte ante una señal de ALTO para revisar la vía.",
            "success",
          );
          registrarAcierto("alto");
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          Swal.fire(
            "¡Error grave!",
            "Ignorar un ALTO causa colisiones severas en intersecciones.",
            "error",
          );
        }
      });
    };

    const evaluarBus = () => {
      Swal.fire({
        title: "Parada de Bus",
        text: "Te bajaste del bus y necesitas cruzar. El vehículo sigue estacionado. ¿Por dónde pasas?",
        icon: "info",
        showCancelButton: true,
        confirmButtonColor: "#e74c3c",
        cancelButtonColor: "#2ecc71",
        confirmButtonText: "Por delante del bus",
        cancelButtonText: "Espero que el bus se vaya",
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire(
            "¡Peligro!",
            "Cruzar al frente bloquea tu visibilidad y la de los autos que rebasan.",
            "error",
          );
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          Swal.fire(
            "¡Correcto!",
            "Espera a que el bus marche para tener una vista clara en ambos sentidos.",
            "success",
          );
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
        confirmButtonColor: "#2ecc71",
        cancelButtonColor: "#e74c3c",
        confirmButtonText: "Camino hacia el paso peatonal",
        cancelButtonText: "Cruzo por aquí rápido",
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire(
            "¡Perfecto!",
            "Los pasos peatonales garantizan tu derecho preferente de paso.",
            "success",
          );
          registrarAcierto("peatonal");
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          Swal.fire(
            "¡Acción de riesgo!",
            "Cruzar de manera imprevista te expone a velocidades altas.",
            "error",
          );
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
        const respuesta = await fetch('/api/testimonios', {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formTestimonio.value),
        });

        if (respuesta.ok) {
          Swal.fire({
            title: "¡Gracias por compartir!",
            text: "Tu historia ha sido guardada y ayudará a crear conciencia en otros conductores.",
            icon: "success",
            confirmButtonColor: "#2ecc71",
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
    // 3. ESTADO Y LÓGICA DEL TEST (ANTI-PLAGIO)
    // ==========================================
    const nombreUsuario = ref("");
    const testIniciado = ref(false);
    const testTerminado = ref(false);
    const preguntaActual = ref(0);
    const respuestasCorrectasTest = ref(0);
    const puntuacionTest = ref(0);
    const preguntasTest = ref([]);

    // Banco maestro de preguntas
    const bancoPreguntas = [
      {
        texto:
          "¿Qué indica una línea amarilla continua en el centro de la vía?",
        opciones: [
          "Se puede rebasar con precaución.",
          "Prohibido rebasar.",
          "Es una vía de un solo sentido.",
        ],
        respuestaCorrecta: "Prohibido rebasar.",
      },
      {
        texto:
          "¿Cuál es la velocidad máxima permitida en zonas escolares en Nicaragua?",
        opciones: ["25 km/h", "45 km/h", "60 km/h"],
        respuestaCorrecta: "25 km/h",
      },
      {
        texto: "Ante una señal de 'Ceda el Paso', usted debe:",
        opciones: [
          "Acelerar para pasar primero.",
          "Detenerse completamente siempre.",
          "Disminuir la velocidad y ceder el paso a los vehículos que circulan por la vía a la que se incorpora.",
        ],
        respuestaCorrecta:
          "Disminuir la velocidad y ceder el paso a los vehículos que circulan por la vía a la que se incorpora.",
      },
    ];

    // Función de mezcla (Fisher-Yates)
    const mezclarArreglo = (arreglo) => {
      let nuevoArreglo = [...arreglo];
      for (let i = nuevoArreglo.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [nuevoArreglo[i], nuevoArreglo[j]] = [nuevoArreglo[j], nuevoArreglo[i]];
      }
      return nuevoArreglo;
    };

    const iniciarTest = () => {
      // Mezclamos preguntas y opciones
      let preguntasMezcladas = mezclarArreglo(bancoPreguntas);
      preguntasTest.value = preguntasMezcladas.map((p) => {
        return {
          texto: p.texto,
          opciones: mezclarArreglo(p.opciones),
          respuestaCorrecta: p.respuestaCorrecta,
        };
      });
      testIniciado.value = true;
    };

    const responderTest = async (indiceOpcion) => {
      const pregunta = preguntasTest.value[preguntaActual.value];
      const respuestaElegida = pregunta.opciones[indiceOpcion];

      if (respuestaElegida === pregunta.respuestaCorrecta) {
        respuestasCorrectasTest.value++;
      }

      if (preguntaActual.value < preguntasTest.value.length - 1) {
        preguntaActual.value++;
      } else {
        testTerminado.value = true;
        puntuacionTest.value = Math.round(
          (respuestasCorrectasTest.value / preguntasTest.value.length) * 100,
        );

        try {
          await fetch('/api/test-resultados', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              usuario: nombreUsuario.value,
              puntuacion: puntuacionTest.value,
              respuestasCorrectas: respuestasCorrectasTest.value,
            }),
          });
          console.log("[INFO] Resultado enviado al backend correctamente.");
        } catch (error) {
          console.error("[ERROR] Guardando en BD:", error);
        }
      }
    };

    const reiniciarTest = () => {
      testIniciado.value = false;
      testTerminado.value = false;
      preguntaActual.value = 0;
      respuestasCorrectasTest.value = 0;
      nombreUsuario.value = "";
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
    };
  },
}).mount("#app");
