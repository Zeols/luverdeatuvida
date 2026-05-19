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

    // --- ESTADO DEL PERSONAJE ---
    const personaje = ref({ x: 50, y: 85 }); // Inicia abajo en el centro
    const teclas = ref({ w: false, a: false, s: false, d: false });
// --- CONTROLES DE TECLADO (PC) Y ATAJOS PARA ALERTAS ---
    window.addEventListener('keydown', (e) => {
      // 1. Si hay una ventana de pregunta abierta (SweetAlert), interceptar teclado
      if (Swal.isVisible()) {
        const key = e.key.toLowerCase();
        if (key === 'e') {
          Swal.clickConfirm(); // Hace clic en el botón [E]
          e.preventDefault();  // Evita el comportamiento por defecto
          e.stopPropagation(); // Detiene a SweetAlert para que no bloquee la tecla
        } else if (key === 'q') {
          Swal.clickCancel();  // Hace clic en el botón [Q]
          e.preventDefault();
          e.stopPropagation();
        }
        return; // Salimos para que el personaje no se mueva
      }

      // 2. Movimiento del personaje (solo si estamos en el simulador)
      if (seccionActual.value !== 'simulador') return;
      
      const key = e.key.toLowerCase();
      
      // Evitar que la página haga scroll al usar flechas o las teclas WASD
      const teclasMovimiento = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '];
      if (teclasMovimiento.includes(key)) {
        e.preventDefault(); 
      }

      if (['w','a','s','d'].includes(key)) teclas.value[key] = true;
      if (key === 'arrowup') teclas.value.w = true;
      if (key === 'arrowdown') teclas.value.s = true;
      if (key === 'arrowleft') teclas.value.a = true;
      if (key === 'arrowright') teclas.value.d = true;
    }, { capture: true }); 

    window.addEventListener('keyup', (e) => {
      if (seccionActual.value !== 'simulador') return;
      const key = e.key.toLowerCase();
      if (['w','a','s','d'].includes(key)) teclas.value[key] = false;
      if (key === 'arrowup') teclas.value.w = false;
      if (key === 'arrowdown') teclas.value.s = false;
      if (key === 'arrowleft') teclas.value.a = false;
      if (key === 'arrowright') teclas.value.d = false;
    });

    // --- CONTROLES TÁCTILES (Móvil) ---
    const moverJoystick = (dir, estado) => {
      if(dir === 'up') teclas.value.w = estado;
      if(dir === 'down') teclas.value.s = estado;
      if(dir === 'left') teclas.value.a = estado;
      if(dir === 'right') teclas.value.d = estado;
    };

    // --- MOTOR DEL JUEGO (60 FPS) ---
    setInterval(() => {
      if (seccionActual.value !== 'simulador') return;
      
      // Si hay una alerta de SweetAlert abierta, frenar al personaje
      if (Swal.isVisible()) {
          teclas.value = { w: false, a: false, s: false, d: false }; 
          return;
      }

      let velocidad = 0.8; // Velocidad de movimiento (% de la pantalla por frame)
      
      // Mover según la tecla presionada (respetando los bordes del mapa)
      if (teclas.value.w && personaje.value.y > 5) personaje.value.y -= velocidad;
      if (teclas.value.s && personaje.value.y < 95) personaje.value.y += velocidad;
      if (teclas.value.a && personaje.value.x > 5) personaje.value.x -= velocidad;
      if (teclas.value.d && personaje.value.x < 95) personaje.value.x += velocidad;

      verificarColisiones();
    }, 20);

    // --- DETECTOR DE PROXIMIDAD ---
    const verificarColisiones = () => {
      // Coordenadas aproximadas de donde están los botones en el CSS
      const zonas = [
        { id: 'semaforo', x: 25, y: 15, trigger: evaluarSemaforo },
        { id: 'alto', x: 75, y: 35, trigger: evaluarAlto },
        { id: 'bus', x: 8, y: 45, trigger: evaluarBus },
        { id: 'peatonal', x: 42, y: 65, trigger: evaluarPeatonal }
      ];

      for (let zona of zonas) {
        if (!completados.value[zona.id]) {
           // Fórmula de Distancia Euclidiana (Pitágoras)
           let dist = Math.sqrt(Math.pow(personaje.value.x - zona.x, 2) + Math.pow(personaje.value.y - zona.y, 2));
           
           if (dist < 8) { // Si está muy cerca (radio de colisión)
               personaje.value.y += 10; // Lo empujamos hacia abajo para que no quede atascado en el trigger
               zona.trigger(); // Dispara la pregunta
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
        confirmButtonColor: "#e74c3c",
        cancelButtonColor: "#2ecc71",
        confirmButtonText: "Cruzar ahora [E]",
        cancelButtonText: "Esperar[Q]",
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
        confirmButtonText: "Detenerme por completo [E]",
        cancelButtonText: "Pasar directo [Q]",
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
        confirmButtonText: "Por delante del bus [E]",
        cancelButtonText: "Espero que el bus se vaya [Q]",
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
        confirmButtonText: "Camino hacia el paso peatonal [E]",
        cancelButtonText: "Cruzo por aquí rápido [Q]",
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
        const respuesta = await fetch("/api/testimonios", {
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
    // 3. ESTADO Y LÓGICA DEL TEST (INTERACTIVO Y EDUCATIVO)
    // ==========================================
    const nombreUsuario = ref("");
    const testIniciado = ref(false);
    const testTerminado = ref(false);
    const preguntaActual = ref(0);
    const respuestasCorrectasTest = ref(0);
    const puntuacionTest = ref(0);
    const preguntasTest = ref([]);

    // Banco maestro de preguntas ampliado y con explicaciones
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
        explicacion:
          "La línea continua indica que no hay visibilidad o espacio seguro para adelantar. Cruzarla es causa frecuente de choques frontales.",
      },
      {
        texto:
          "¿Cuál es la velocidad máxima permitida en zonas escolares en Nicaragua?",
        opciones: ["25 km/h", "45 km/h", "60 km/h"],
        respuestaCorrecta: "25 km/h",
        explicacion:
          "A 25 km/h, un vehículo necesita menos metros para frenar totalmente, protegiendo la vida de los niños.",
      },
      {
        texto: "Ante una señal de 'Ceda el Paso', usted debe:",
        opciones: [
          "Acelerar para pasar primero.",
          "Detenerse completamente siempre.",
          "Disminuir la velocidad y ceder el paso a los vehículos en la vía principal.",
        ],
        respuestaCorrecta:
          "Disminuir la velocidad y ceder el paso a los vehículos en la vía principal.",
        explicacion:
          "A diferencia del ALTO, el Ceda el Paso te permite avanzar si no hay tráfico aproximándose.",
      },
      {
        texto:
          "¿Quién tiene la preferencia de paso en un paso peatonal (Paso de cebra)?",
        opciones: [
          "El vehículo más grande o pesado.",
          "El peatón.",
          "El que llegue primero a la intersección.",
        ],
        respuestaCorrecta: "El peatón.",
        explicacion:
          "El peatón es el eslabón más vulnerable de la vía y siempre tiene la prioridad absoluta en las zonas demarcadas.",
      },
      {
        texto: "El uso del cinturón de seguridad es obligatorio para:",
        opciones: [
          "Solo para el conductor.",
          "El conductor y el copiloto (asiento delantero).",
          "Todos los ocupantes del vehículo.",
        ],
        respuestaCorrecta: "Todos los ocupantes del vehículo.",
        explicacion:
          "En caso de colisión, los pasajeros traseros sin cinturón se convierten en proyectiles mortales para los pasajeros delanteros.",
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
      let preguntasMezcladas = mezclarArreglo(bancoPreguntas);
      // Seleccionamos solo 5 preguntas por test (útil si luego agregas más al banco)
      preguntasTest.value = preguntasMezcladas.slice(0, 5).map((p) => {
        return {
          texto: p.texto,
          opciones: mezclarArreglo(p.opciones),
          respuestaCorrecta: p.respuestaCorrecta,
          explicacion: p.explicacion,
        };
      });
      testIniciado.value = true;
    };

    // Modificamos responderTest para dar retroalimentación educativa
    const responderTest = async (indiceOpcion) => {
      const pregunta = preguntasTest.value[preguntaActual.value];
      const respuestaElegida = pregunta.opciones[indiceOpcion];
      const esCorrecta = respuestaElegida === pregunta.respuestaCorrecta;

      if (esCorrecta) {
        respuestasCorrectasTest.value++;
        await Swal.fire({
          title: "¡Correcto!",
          text: pregunta.explicacion,
          icon: "success",
          confirmButtonColor: "var(--verde-semaforo)", // Usa color de tu paleta
          confirmButtonText: "Siguiente Pregunta",
        });
      } else {
        await Swal.fire({
          title: "Incorrecto",
          html: `<p>La respuesta correcta era: <b>${pregunta.respuestaCorrecta}</b></p>
                 <p class="text-muted mt-2"><i>${pregunta.explicacion}</i></p>`,
          icon: "error",
          confirmButtonColor: "var(--rojo-alto)",
          confirmButtonText: "Entendido",
        });
      }

      // Lógica de avance
      if (preguntaActual.value < preguntasTest.value.length - 1) {
        preguntaActual.value++;
      } else {
        testTerminado.value = true;
        puntuacionTest.value = Math.round(
          (respuestasCorrectasTest.value / preguntasTest.value.length) * 100,
        );

        try {
          await fetch("/api/test-resultados", {
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
      personaje,
      moverJoystick
    };
  },
}).mount("#app");
