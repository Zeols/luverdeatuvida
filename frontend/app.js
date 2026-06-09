const { createApp, ref, nextTick } = Vue;

createApp({
  setup() {
    const API_URL =
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "localhost"
        ? "http://localhost:3000/api"
        : "/api";

    const seccionActual = ref("inicio");
    const modoJuego = ref("peaton"); // 'peaton' o 'carro'
    const juegoIniciado = ref(false);

    const cambiarSeccion = (seccion) => {
      seccionActual.value = seccion;
      juegoIniciado.value = false;
      if (seccion === "estadisticas") {
        cargarStatsTest();
        renderizarGraficoCausas();
      }
      if (seccion === "test") {
        cargarStatsTest();
      }
      if (seccion === "testimonios") {
        cargarTestimonios();
      }
    };

    // ==========================================
    // 1. ESTADO Y LÓGICA DEL SIMULADOR
    // ==========================================
    const progreso = ref(0);
    const completados = ref({
      peaton_cebra: false,
      peaton_bus: false,
      peaton_puente: false,
      peaton_semaforo: false,
      carro_semaforo: false,
      carro_alto: false,
      carro_escolar: false,
      carro_ceda: false,
    });

    const iniciarNivel = (modo) => {
      modoJuego.value = modo;
      juegoIniciado.value = true;
      if (modo === "carro") {
        personaje.value = { x: 15, y: 85 }; // posición segura, lejos de zonas
      } else {
        personaje.value = { x: 50, y: 85 };
      }
      progreso.value = 0;

      // Reiniciar todas las señales
      Object.keys(completados.value).forEach(
        (k) => (completados.value[k] = false),
      );

      // INSTRUCCIONES INICIALES (MODAL)
      Swal.fire({
        title:
          modo === "peaton"
            ? "Nivel 1: Modo Peatón"
            : "Nivel 2: Modo Conductor",
        text:
          modo === "peaton"
            ? "Explora la ciudad y acércate (o haz clic) en las 4 señales peatonales. ¡Demuestra que sabes cruzar seguro para obtener tu Certificado!"
            : "Enciende tu vehículo y respeta la ley. Acércate (o haz clic) en las 4 señales vehiculares. ¡Aprueba el examen para tu Licencia!",
        icon: "info",
        confirmButtonText: "¡Entendido, a jugar!",
        confirmButtonColor: "#264653",
      });
    };

    const registrarAcierto = (clave) => {
      progreso.value += 1;
      completados.value[clave] = true;

      if (progreso.value === 4) {
        setTimeout(() => {
          Swal.fire({
            title:
              modoJuego.value === "carro"
                ? "¡Licencia Aprobada!"
                : "¡Peatón Ejemplar!",
            text: "Has superado todas las situaciones demostrando gran conocimiento vial. ¡Felicidades!",
            icon: "success",
            confirmButtonColor: "#264653",
            confirmButtonText: "Continuar",
          }).then(() => {
            // Reiniciar el simulador automáticamente al cerrar el modal
            reiniciarSimuladorCompleto();
          });
        }, 800);
      }
    };

    const reiniciarSimuladorCompleto = () => {
      juegoIniciado.value = false;
      progreso.value = 0;
      Object.keys(completados.value).forEach(
        (k) => (completados.value[k] = false),
      );
      if (modo === "carro") {
        personaje.value = { x: 15, y: 85 }; // posición segura, lejos de zonas
      } else {
        personaje.value = { x: 50, y: 85 };
      }
      teclas.value = { w: false, a: false, s: false, d: false };
    };

    const personaje = ref({ x: 50, y: 85 });
    const teclas = ref({ w: false, a: false, s: false, d: false });

    // Controles de teclado
    window.addEventListener(
      "keydown",
      (e) => {
        if (Swal.isVisible()) return;
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

    // Bucle de movimiento
    setInterval(() => {
      if (seccionActual.value !== "simulador" || Swal.isVisible()) {
        if (Swal.isVisible())
          teclas.value = { w: false, a: false, s: false, d: false };
        return;
      }

      let velocidad = modoJuego.value === "carro" ? 1.5 : 0.8;

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
      const zonasPeaton = [
        { id: "peaton_cebra", x: 42, y: 65 },
        { id: "peaton_bus", x: 8, y: 45 },
        { id: "peaton_puente", x: 70, y: 25 },
        { id: "peaton_semaforo", x: 30, y: 10 },
      ];
      const zonasConductor = [
        { id: "carro_semaforo", x: 25, y: 15 },
        { id: "carro_alto", x: 75, y: 35 },
        { id: "carro_escolar", x: 20, y: 55 },
        { id: "carro_ceda", x: 60, y: 75 },
      ];

      const zonasActivas =
        modoJuego.value === "peaton" ? zonasPeaton : zonasConductor;

      for (let zona of zonasActivas) {
        if (!completados.value[zona.id]) {
          let dist = Math.sqrt(
            Math.pow(personaje.value.x - zona.x, 2) +
              Math.pow(personaje.value.y - zona.y, 2),
          );
          if (dist < 12) {
            personaje.value.y += modoJuego.value === "carro" ? 12 : 8;
            evaluarEscena(zona.id);
          }
        }
      }
    };

    const evaluarEscena = (id) => {
      teclas.value = { w: false, a: false, s: false, d: false };

      let data = {};
      switch (id) {
        case "peaton_cebra":
          data = {
            title: "Paso de Cebra",
            text: "Estás frente al paso de cebra, pero viene un auto algo rápido a lo lejos.",
            confirmBtn: "Cruzar corriendo",
            cancelBtn: "Esperar en la acera",
            confirmCorrect: false,
            icon: "question",
          };
          break;
        case "peaton_bus":
          data = {
            title: "Parada de Bus",
            text: "Te acabas de bajar del bus. ¿Por dónde cruzas la calle?",
            confirmBtn: "Espero que el bus avance",
            cancelBtn: "Cruzo por delante del bus",
            confirmCorrect: true,
            icon: "info",
          };
          break;
        case "peaton_puente":
          data = {
            title: "Puente Peatonal",
            text: "Hay mucho tráfico. A 20 metros tienes un puente peatonal.",
            confirmBtn: "Esquivo los autos rápido",
            cancelBtn: "Camino y uso el puente",
            confirmCorrect: false,
            icon: "warning",
          };
          break;
        case "peaton_semaforo":
          data = {
            title: "Semáforo Peatonal",
            text: "El semáforo de los carros está en verde, el tuyo en rojo, pero la calle se ve vacía.",
            confirmBtn: "Espero mi luz verde",
            cancelBtn: "Cruzo aprovechando",
            confirmCorrect: true,
            icon: "warning",
          };
          break;
        case "carro_semaforo":
          data = {
            title: "Luz Amarilla",
            text: "Te acercas a la intersección y el semáforo cambia a luz amarilla.",
            confirmBtn: "Acelero para pasar",
            cancelBtn: "Freno suavemente",
            confirmCorrect: false,
            icon: "warning",
          };
          break;
        case "carro_alto":
          data = {
            title: "Señal de ALTO",
            text: "Llegas a la esquina y la calle de cruce parece vacía.",
            confirmBtn: "Me detengo totalmente 3 seg.",
            cancelBtn: "Paso lento sin frenar",
            confirmCorrect: true,
            icon: "warning",
          };
          break;
        case "carro_escolar":
          data = {
            title: "Zona Escolar",
            text: "Ingresas a una calle con escuela en horario de clases.",
            confirmBtn: "Mantengo mis 40 km/h",
            cancelBtn: "Reduzco a 20 km/h",
            confirmCorrect: false,
            icon: "info",
          };
          break;
        case "carro_ceda":
          data = {
            title: "Ceda el Paso",
            text: "Te acercas a una rotonda y un carro ya viene girando en ella.",
            confirmBtn: "Le cedo el paso",
            cancelBtn: "Acelero para meterme",
            confirmCorrect: true,
            icon: "warning",
          };
          break;
      }

      Swal.fire({
        title: data.title,
        text: data.text,
        icon: data.icon,
        showCancelButton: true,
        confirmButtonColor: "#264653",
        cancelButtonColor: "#e76f51",
        confirmButtonText: data.confirmBtn,
        cancelButtonText: data.cancelBtn,
        reverseButtons: true,
      }).then((result) => {
        if (result.isConfirmed) {
          if (data.confirmCorrect) {
            Swal.fire(
              "¡Bien hecho!",
              "Decisión correcta y responsable.",
              "success",
            );
            registrarAcierto(id);
          } else {
            Swal.fire("¡Peligro!", "Esa acción puede ser fatal.", "error");
          }
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          if (!data.confirmCorrect) {
            Swal.fire(
              "¡Excelente!",
              "Decisión correcta y responsable.",
              "success",
            );
            registrarAcierto(id);
          } else {
            Swal.fire("¡Error Grave!", "Esa acción puede ser fatal.", "error");
          }
        }
      });
    };

    // ==========================================
    // 2. ESTADÍSTICAS Y GRÁFICOS
    // ==========================================
    let miGraficoCausas = null;
    let chartDinamicoInstancia = null;
    const statsTest = ref({
      totalJugadores: 0,
      correctas: 0,
      incorrectas: 0,
      aprobados: 0,
      reprobados: 0,
    });
    const tipoGraficoDinamico = ref("aciertos");

    const renderizarGraficoCausas = () => {
      setTimeout(() => {
        const ctx = document.getElementById("graficoCausas");
        if (ctx) {
          if (miGraficoCausas) miGraficoCausas.destroy();
          miGraficoCausas = new Chart(ctx, {
            type: "doughnut",
            data: {
              labels: [
                "Estado de Ebriedad",
                "Exceso de Velocidad",
                "Invasión de Carril",
                "Otras",
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

    const cargarStatsTest = async () => {
      try {
        const res = await fetch(`${API_URL}/test-resultados`);
        if (res.ok) {
          const data = await res.json();
          statsTest.value.totalJugadores = data.length;
          let aciertos = 0,
            fallos = 0,
            aprobados = 0,
            reprobados = 0;
          data.forEach((test) => {
            aciertos += test.respuestasCorrectas;
            fallos += 9 - test.respuestasCorrectas;
            if (test.puntuacion >= 70) aprobados++;
            else reprobados++;
          });
          statsTest.value.correctas = aciertos;
          statsTest.value.incorrectas = fallos;
          statsTest.value.aprobados = aprobados;
          statsTest.value.reprobados = reprobados;
          if (
            seccionActual.value === "estadisticas" ||
            seccionActual.value === "test"
          ) {
            nextTick(() => {
              actualizarGraficoDinamico();
            });
          }
        }
      } catch (e) {
        console.error("Error cargando DB:", e);
      }
    };

    const actualizarGraficoDinamico = () => {
      const ctx = document.getElementById("graficoDinamico");
      if (!ctx) return;
      if (chartDinamicoInstancia) chartDinamicoInstancia.destroy();
      let etiquetas = [];
      let valores = [];
      let colores = [];
      if (tipoGraficoDinamico.value === "aciertos") {
        etiquetas = ["Respuestas Correctas", "Respuestas Incorrectas"];
        valores = [statsTest.value.correctas, statsTest.value.incorrectas];
        colores = ["#2ecc71", "#e74c3c"];
      } else {
        etiquetas = ["Aprobados (70 o más)", "Reprobados (Menos de 70)"];
        valores = [statsTest.value.aprobados, statsTest.value.reprobados];
        colores = ["#3498db", "#f39c12"];
      }
      chartDinamicoInstancia = new Chart(ctx, {
        type: "pie",
        data: {
          labels: etiquetas,
          datasets: [{ data: valores, backgroundColor: colores }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: "bottom" } },
        },
      });
    };

    // ==========================================
    // 3. TESTIMONIOS Y TEST VIAL
    // ==========================================
    const formTestimonio = ref({
      nombre: "",
      edad: "",
      tipoAccidente: "",
      historia: "",
    });
    const listaTestimonios = ref([]);
    const cargarTestimonios = async () => {
      try {
        const respuesta = await fetch(`${API_URL}/testimonios`);
        if (respuesta.ok) {
          listaTestimonios.value = await respuesta.json();
        }
      } catch (error) {
        console.error("Error", error);
      }
    };
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
            text: "Guardado exitosamente.",
            icon: "success",
            confirmButtonColor: "#264653",
          });
          formTestimonio.value = {
            nombre: "",
            edad: "",
            tipoAccidente: "",
            historia: "",
          };
          cargarTestimonios();
        }
      } catch (error) {
        Swal.fire("Error", "Sin conexión al servidor.", "error");
      }
    };

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
          const esAprobado = puntuacionTest.value >= 70;
          Swal.fire({
            title: esAprobado ? "¡Felicidades!" : "Necesitas practicar más",
            text: `Tu puntaje fue ${puntuacionTest.value}/100. ${esAprobado ? "¡Has aprobado el desafío!" : "No alcanzaste el mínimo de 70 para aprobar."}`,
            icon: esAprobado ? "success" : "error",
            confirmButtonColor: "#264653",
          });
          try {
            await fetch(`${API_URL}/test-resultados`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                usuario: String(nombreUsuario.value),
                nombre: String(nombreUsuario.value),
                puntuacion: Number(puntuacionTest.value),
                respuestasCorrectas: Number(respuestasCorrectasTest.value),
              }),
            });
            cargarStatsTest();
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

    // ==========================================
    // 4. MODAL DE SEÑALES CON GALERÍA DE IMÁGENES
    // ==========================================

    const mostrarModalSenal = (tipo) => {
      let titulo = "";
      let imagenesHtml = "";

      // Definir arrays de imágenes y textos descriptivos (cambia las rutas y textos después)
      if (tipo === "reglamentarias") {
        titulo = "Señales Reglamentarias";
        const señales = [
          {
            img: "assets/img/senal-alto.png",
            texto: "Señal de ALTO: Obligación de detenerse completamente.",
          },
          {
            img: "assets/img/senal-ceda.png",
            texto:
              "CEDA EL PASO: Debes ceder el paso a los vehículos que circulan.",
          },
          {
            img: "assets/img/senal-prohibido.png",
            texto: "PROHIBIDO ESTACIONAR: No se puede estacionar en esta zona.",
          },
          {
            img: "assets/img/senal-velocidad.png",
            texto: "VELOCIDAD MÁXIMA: Límite de velocidad permitido.",
          },
        ];
        imagenesHtml = señales
          .map(
            (s) => `
          <div style="display: inline-block; width: 200px; margin: 10px; text-align: center;">
            <img src="${s.img}" alt="${s.texto}" style="width: 100%; border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
            <p style="margin-top: 8px; font-size: 0.9rem;">${s.texto}</p>
          </div>
        `,
          )
          .join("");
      } else if (tipo === "preventivas") {
        titulo = "Señales Preventivas";
        const señales = [
          {
            img: "assets/img/senal-curva.png",
            texto: "Curva peligrosa a la izquierda.",
          },
          {
            img: "assets/img/senal-escolar.png",
            texto: "Zona escolar: Reduce velocidad.",
          },
          {
            img: "assets/img/senal-animales.png",
            texto: "Cruce de animales sueltos.",
          },
          { img: "assets/img/senal-obras.png", texto: "Obras en la vía." },
        ];
        imagenesHtml = señales
          .map(
            (s) => `
          <div style="display: inline-block; width: 200px; margin: 10px; text-align: center;">
            <img src="${s.img}" alt="${s.texto}" style="width: 100%; border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
            <p style="margin-top: 8px; font-size: 0.9rem;">${s.texto}</p>
          </div>
        `,
          )
          .join("");
      } else if (tipo === "informativas") {
        titulo = "Señales Informativas";
        const señales = [
          { img: "assets/img/senal-hospital.png", texto: "Hospital cercano." },
          {
            img: "assets/img/senal-gasolinera.png",
            texto: "Gasolinera a 500 m.",
          },
          {
            img: "assets/img/senal-comida.png",
            texto: "Restaurante / Área de servicio.",
          },
          { img: "assets/img/senal-turistica.png", texto: "Sitio turístico." },
        ];
        imagenesHtml = señales
          .map(
            (s) => `
          <div style="display: inline-block; width: 200px; margin: 10px; text-align: center;">
            <img src="${s.img}" alt="${s.texto}" style="width: 100%; border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
            <p style="margin-top: 8px; font-size: 0.9rem;">${s.texto}</p>
          </div>
        `,
          )
          .join("");
      }

      Swal.fire({
        title: titulo,
        html: `
          <div style="max-height: 500px; overflow-y: auto; text-align: center;">
            ${imagenesHtml}
            <p style="margin-top: 20px; font-style: italic; color: gray;">* Puedes reemplazar estas imágenes y textos por los reales de tu proyecto.</p>
          </div>
        `,
        icon: "info",
        confirmButtonText: "Cerrar",
        confirmButtonColor: "#264653",
        width: "800px",
        showCloseButton: true,
      });
    };

    return {
      seccionActual,
      cambiarSeccion,
      modoJuego,
      juegoIniciado,
      iniciarNivel,
      progreso,
      completados,
      evaluarEscena,
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
      statsTest,
      tipoGraficoDinamico,
      actualizarGraficoDinamico,
      listaTestimonios,
      mostrarModalSenal,
    };
  },
}).mount("#app");
