// Simulación de Investigación de Operaciones
// Esteban Rodríguez Betancourt
// B15512
//
//
// (Recomiendo ver el código usando tabulaciones de
//  cuatro caracteres).
//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////

// Definición de eventos
// Los eventos son representados como funciones que devuelven
// el estado futuro del sistema dado un estado actual.
// La definición de los eventos como funciones puras tiene
// varios efectos secundarios deseados (sic. jajajajaja):
// - Es posible modificar un estado sin afectar, por ejemplo,
//   la GUI.
// - Las modificaciones del estado se pueden dar de forma
//   atómica. ¡Es una simulación discreta!
// - No es necesario que el código de la simulación tenga
//   conocimiento alguno sobre los eventos. ¡Solo los corre!
// Nótese que estas funciones NO deben actualizar el reloj
// del sistema, pues esto es responsabilidad del simulador.

// A saber, los eventos del sistema son:
// Creación de mensajes
// (DONE) Se crea un mensaje para B/2
// (DONE) Se crea un mensaje para C/3
// Recibir mensaje
// (DONE) Se recibe un mensaje en A/1
// (DONE) Se recibe un mensaje en B/2
// (DONE) Se recibe un mensaje en C/3
// Se atendió un mensaje
// (DONE) Se atendió un mensaje en A/1
// (DONE) Se atendió un mensaje en B/2 CPU 1
// (DONE) Se atendió un mensaje en B/2 CPU 2
// (DONE) Se atendió un mensaje en C/3
// Metaeventos (actualizan estadísticas):
// (DONE) Mensaje RECHAZADO
// (DONE) Mensaje ENVIADO

//////////////////////////////////////////////////////////////////
// El flujo de eventos es algo así:
//   Se crea un mensaje
//          |
//          V
//    Recibir mensaje
//    Si está ocupado  ----->  Encolar mensaje
//         Sino
//           |
//           V
//   Se atendió mensaje ---> Y crear un recibir mensaje
//       Si se rechaza ------> Rechazar mensaje
//    Si hay MSG en cola       (actualiza estadísticas)
//         |                           |- o bien -> Descartar
//         V                           V
//      Desencolar                Recibir mensaje
//   y recibir mensaje
//////////////////////////////////////////////////////////////////

// Crea un mensaje que será recibido
// por la computadora B.
function HandlerCrearMensajeB(estado, data) {
    // Se crea un mensaje en el instante actual.
    var msg = CrearMensaje(estado);
    // Se debe crear un evento para que se reciba
    // el mensaje:
    var evento = new FactoryEventos(
					estado.Reloj,
					{ mensaje: msg }).RecibirMensajeB();
    // (Como el transporte en este caso es instantáneo
    // usamos el mismo reloj)

    // Ahora creamos el nuevo evento (B recibe mensaje nuevo):
    estado = PushEvent(evento, estado);

    // Por otro lado debemos volver a calendarizar
    // el evento de creación de mensajes.
    // B recibe un mensaje según una distribución normal
    // con media 15s y varianza 1s²
    var repeticion = new FactoryEventos(
    					estado.Reloj + DistribucionNormal(15, 1) / 60,
    					null).CrearMensajeB();
    estado = PushEvent(repeticion, estado);

    // Y devolvemos el nuevo estado de la simulación
    return estado;
}

// Crea un mensaje que será recibido
// por la computadora C.
function HandlerCrearMensajeC(estado, data) {
    // Se crea un mensaje en el instante actual.
    var msg = CrearMensaje(estado);
    // Se debe crear un evento para que se reciba
    // el mensaje:
    var evento = new FactoryEventos(
					estado.Reloj,
					{ mensaje: msg }).RecibirMensajeC();
    // (Como el transporte en este caso es instantáneo
    // usamos el mismo reloj)

    // Ahora creamos el nuevo evento (C recibe mensaje nuevo):
    estado = PushEvent(evento, estado);

    // Por otro lado debemos volver a calendarizar
    // el evento de creación de mensajes.
    // C recibe un mensaje según una distribución
    // x/24, con x entre 4 y 8 segundos.
    // DistribucionX24() lo convierte a minutos.
    var repeticion = new FactoryEventos(
    					estado.Reloj + DistribucionX24(),
    					null).CrearMensajeC();
    estado = PushEvent(repeticion, estado);

    // Y devolvemos el nuevo estado de la simulación
    return estado;
}

//////////////////////////////////////////////////////////////////


// Recibe un mensaje en la computadora C
function HandlerRecibirMensajeC(estado, data) {
    var msg = data.mensaje;
    // Se actualizan las estadísticas de transmisión
    msg.TiempoTransmision += DeltaTiempo(estado, msg);
    // Se guarda la hora de encolamiento:
    msg.HoraEvento = estado.Reloj;

    // Si no está ocupado vamos a atender el mensaje
    if (!estado.Estados.C) {
        // Ahora está ocupado:
        estado.Estados.C = true;
        estado.HoraOcupacion.C = estado.Reloj;

        // Tiempo atendiéndose:
		// Un mensaje cada 4 segundos, tiempo exponencial
        var ta = DistribucionExponencial(60 / 4);
        // Se configura el evento "mensaje atendido por C":
        var evento = new FactoryEventos(
			estado.Reloj + ta,
			{ mensaje: msg }
			).AtendidoMensajeC();
        // Y se programa el evento:
        estado = PushEvent(evento, estado);
    } else {
        // Sino solamente lo encolamos:
        estado.Colas.C.push(msg);
    }

    return estado;
}

// Recibe un mensaje en la computadora B
function HandlerRecibirMensajeB(estado, data) {
    var msg = data.mensaje;
    // Se actualizan las estadísticas de transmisión
    msg.TiempoTransmision += DeltaTiempo(estado, msg);
    // Se guarda la hora de encolamiento:
    msg.HoraEvento = estado.Reloj;

    // Si hay algún CPU desocupado atenderemos el mensaje
    if (!estado.Estados.B1) {
        // B1 ahora está ocupado
        estado.Estados.B1 = true;
        estado.HoraOcupacion.B1 = estado.Reloj;

        // Tiempo atendiéndose:
        var ta = DistribucionUniforme(12 / 60, 25 / 60);
        // Se configura el evento "mensaje atendido por B":
        var evento = new FactoryEventos(
			estado.Reloj + ta,
			{ mensaje: msg }
			).AtendidoMensajeB1();
        // Y se programa el evento:
        estado = PushEvent(evento, estado);
    } else if (!estado.Estados.B2) {
        // B2 ahora está ocupado
        estado.Estados.B2 = true;
        estado.HoraOcupacion.B2 = estado.Reloj;

        // Tiempo atendiéndose:
        var ta = DistribucionUniforme(12 / 60, 25 / 60);
        // Se configura el evento "mensaje atendido por B":
        var evento = new FactoryEventos(
			estado.Reloj + ta,
			{ mensaje: msg }
			).AtendidoMensajeB2();
        // Y se programa el evento:
        estado = PushEvent(evento, estado);
    } else {
        // Sino solamente lo encolamos:
        estado.Colas.B.push(msg);
    }

    return estado;
}

// Recibe un mensaje en la computadora A
function HandlerRecibirMensajeA(estado, data) {
    var msg = data.mensaje;
    // Se actualizan las estadísticas de transmisión
    msg.TiempoTransmision += DeltaTiempo(estado, msg);
    // Se guarda la hora de encolamiento:
    msg.HoraEvento = estado.Reloj;

    // Si no está ocupado vamos a atender el mensaje
    if (!estado.Estados.A) {
        // Ahora está ocupado:
        estado.Estados.A = true;
        estado.HoraOcupacion.A = estado.Reloj;

        // Tiempo atendiéndose:
		// Se esperan 10 mensajes por minuto
        var ta = DistribucionExponencial(10);
        // Se configura el evento "mensaje atendido por A":
        var evento = new FactoryEventos(
			estado.Reloj + ta,
			{ mensaje: msg }
			).AtendidoMensajeA();
        // Y se programa el evento:
        estado = PushEvent(evento, estado);
    } else {
        // Sino solamente lo encolamos:
        estado.Colas.A.push(msg);
    }

    return estado;
}

//////////////////////////////////////////////////////////////////

// Atiende un mensaje en PC C
function HandlerAtendidoMensajeC(estado, data) {
    var msg = data.mensaje;
    // Se actualizan las estadísticas:
    var delta = DeltaTiempo(estado, msg);
    msg.TiempoProcesamiento.C += delta;
    estado.Estadisticas.Otros.TiempoComputo.C += delta;
    // Se guarda la hora actual:
    msg.HoraEvento = estado.Reloj;
    // Y la PC actual:
    msg.PCanterior = 3;

    // En C el 80% de los mensajes son rechazados por completo:
    var rechazado = DistribucionMoneda(0.80);
    if (rechazado) {
        // En este caso se crea un meta evento
        // MetaRechazado para que recolecte
        // las estadísticas.
        var evento = new FactoryEventos(
			estado.Reloj,
			{ mensaje: msg }
			).MetaRechazado();
        estado = PushEvent(evento, estado);
    } else {
        // Sino enviamos el mensaje a PC A,
        // quien lo recibirá en el futuro...
        var evento = new FactoryEventos(
			estado.Reloj + DistribucionConstante(20 / 60),// DistribucionX600(),
			{ mensaje: msg }
			).RecibirMensajeA();
        estado = PushEvent(evento, estado);
    }
    // Y estamos libres... por ahora
    estado.Estados.C = false;

    // Ahora que se atendió un mensaje el PC
    // está libre para atender a un eventual
    // mensaje en la cola:
    if (estado.Colas.C.length > 0) {
        estado.Estados.C = true;
        estado.HoraOcupacion.C = estado.Reloj;

        // (cons msg estado.Colas.C) = estado.Colas.C
        msg = estado.Colas.C.shift();

        // Y actualizamos las estadísticas:
        msg.TiempoColas += DeltaTiempo(estado, msg);
        msg.HoraEvento = estado.Reloj;

        var ta = DistribucionExponencial(60 / 4);
        // Se configura el evento "mensaje atendido por C":
        var evento = new FactoryEventos(
			estado.Reloj + ta,
			{ mensaje: msg }
			).AtendidoMensajeC();
        // Y se programa el evento:
        estado = PushEvent(evento, estado);
    }

    return estado;
}

// Atiende un mensaje en PC B1
function HandlerAtendidoMensajeB1(estado, data) {
    var msg = data.mensaje;
    // Se actualizan las estadísticas:
    var delta = DeltaTiempo(estado, msg);
    msg.TiempoProcesamiento.B1 += delta;
    estado.Estadisticas.Otros.TiempoComputo.B1 += delta;
    // Se guarda la hora actual:
    msg.HoraEvento = estado.Reloj;
    // Y la PC actual:
    msg.PCanterior = 2;

    // Enviamos el mensaje a PC A,
    // quien lo recibirá en el futuro...
    var evento = new FactoryEventos(
		estado.Reloj + DistribucionConstante(20 / 60),//DistribucionX600(),
		{ mensaje: msg }
		).RecibirMensajeA();
    estado = PushEvent(evento, estado);
    // Y estamos libres... por ahora
    estado.Estados.B1 = false;

    // Ahora que se atendió un mensaje el PC
    // está libre para atender a un eventual
    // mensaje en la cola:
    if (estado.Colas.B.length > 0) {
        estado.Estados.B1 = true;
        estado.HoraOcupacion.B1 = estado.Reloj;

        // (cons msg estado.Colas.B) = estado.Colas.B
        msg = estado.Colas.B.shift();

        // Y actualizamos las estadísticas:
        msg.TiempoColas += DeltaTiempo(estado, msg);
        msg.HoraEvento = estado.Reloj;

        var ta = DistribucionUniforme(12 / 60, 25 / 60);
        // Se configura el evento "mensaje atendido por B":
        var evento = new FactoryEventos(
			estado.Reloj + ta,
			{ mensaje: msg }
			).AtendidoMensajeB1();
        // Y se programa el evento:
        estado = PushEvent(evento, estado);
    }

    return estado;
}

// Atiende un mensaje en PC B2
function HandlerAtendidoMensajeB2(estado, data) {
    var msg = data.mensaje;
    // Se actualizan las estadísticas:
    var delta = DeltaTiempo(estado, msg);
    msg.TiempoProcesamiento.B2 += delta;
    estado.Estadisticas.Otros.TiempoComputo.B2 += delta;
    // Se guarda la hora actual:
    msg.HoraEvento = estado.Reloj;
    // Y la PC actual:
    msg.PCanterior = 2;

    // Enviamos el mensaje a PC A,
    // quien lo recibirá en el futuro...
    var evento = new FactoryEventos(
		estado.Reloj + DistribucionConstante(20 / 60),//DistribucionX600(),
		{ mensaje: msg }
		).RecibirMensajeA();
    estado = PushEvent(evento, estado);
    // Y estamos libres... por ahora
    estado.Estados.B2 = false;

    // Ahora que se atendió un mensaje el PC
    // está libre para atender a un eventual
    // mensaje en la cola:
    if (estado.Colas.B.length > 0) {
        estado.Estados.B2 = true;
        estado.HoraOcupacion.B2 = estado.Reloj;

        // (cons msg estado.Colas.B) = estado.Colas.B
        msg = estado.Colas.B.shift();

        // Y actualizamos las estadísticas:
        msg.TiempoColas += DeltaTiempo(estado, msg);
        msg.HoraEvento = estado.Reloj;

        var ta = DistribucionUniforme(12 / 60, 25 / 60);
        // Se configura el evento "mensaje atendido por B":
        var evento = new FactoryEventos(
			estado.Reloj + ta,
			{ mensaje: msg }
			).AtendidoMensajeB2();
        // Y se programa el evento:
        estado = PushEvent(evento, estado);
    }

    return estado;
}

// Atiende un mensaje en PC A
function HandlerAtendidoMensajeA(estado, data) {
    var msg = data.mensaje;
    // Se actualizan las estadísticas:
    var delta = DeltaTiempo(estado, msg);
    msg.TiempoProcesamiento.A += delta;
    estado.Estadisticas.Otros.TiempoComputo.A += delta;
    // Se guarda la hora actual:
    msg.HoraEvento = estado.Reloj;

    var anterior = msg.PCanterior;
    msg.PCanterior = 1;

    // En A usualmente rechaza el 20% de los mensajes de B
    // y el 50% de los mensajes de C.
    var rechazado = 0;
    if (2 == anterior) {
        rechazado = DistribucionMoneda(0.20);
    } else {
        rechazado = DistribucionMoneda(0.50);
    }

    // Hay tres opciones:
    var evento;
    if (!rechazado) {
        // El mensaje será enviado al cliente
        evento = new FactoryEventos(
			estado.Reloj,
			{ mensaje: msg }
			).MetaEnviado();
    } else if (2 == anterior) {
        // El mensaje será devuelto a B
        msg.Devoluciones++;
        evento = new FactoryEventos(
			estado.Reloj + DistribucionConstante(3 / 60), //DistribucionUniforme(3/60, 5/60),
			{ mensaje: msg }
			).RecibirMensajeB();
    } else {
        // El mensaje será devuelto a C
        msg.Devoluciones++;
        evento = new FactoryEventos(
			estado.Reloj + DistribucionConstante(3 / 60), //DistribucionUniforme(3/60, 5/60),
			{ mensaje: msg }
			).RecibirMensajeC();
    }
    estado = PushEvent(evento, estado);

    // Y estamos libres... por ahora
    estado.Estados.A = false;

    // Ahora que se atendió un mensaje el PC
    // está libre para atender a un eventual
    // mensaje en la cola:
    if (estado.Colas.A.length > 0) {
        estado.Estados.A = true;
        estado.HoraOcupacion.A = estado.Reloj;

        // (cons msg estado.Colas.A) = estado.Colas.A
        msg = estado.Colas.A.shift();

        // Y actualizamos las estadísticas:
        msg.TiempoColas += DeltaTiempo(estado, msg);
        msg.HoraEvento = estado.Reloj;

        var ta = DistribucionExponencial(10);
        // Se configura el evento "mensaje atendido por A":
        var evento = new FactoryEventos(
			estado.Reloj + ta,
			{ mensaje: msg }
			).AtendidoMensajeA();
        // Y se programa el evento:
        estado = PushEvent(evento, estado);
    }

    return estado;
}

//////////////////////////////////////////////////////////////////

// Los siguientes metaeventos actualizan las estadísticas
// luego de que un mensaje es enviado al cliente
// o bien rechazado por completo.

function HandlerMetaEnviado(estado, data) {
    var estadisticas = estado.Estadisticas.Enviados;
    var msg = data.mensaje;
    estadisticas = EstadisticasMensaje(estadisticas, msg);
    estado.Estadisticas.Enviados = estadisticas;
    return ActualizarEstadisticas(estado, estado.Reloj);
}

function HandlerMetaRechazado(estado, data) {
    var estadisticas = estado.Estadisticas.Rechazados;
    var msg = data.mensaje;
    estadisticas = EstadisticasMensaje(estadisticas, msg);
    estado.Estadisticas.Rechazados = estadisticas;
    return ActualizarEstadisticas(estado, estado.Reloj);
}

// EstadisticasMensaje(estadistica, mensaje)
// Actualiza las estadisticas dadas según el mensaje.
function EstadisticasMensaje(e, m) {
    // Cantidad de mensajes
    e.NumMsg++;
    // Tiempo en la simulación
    e.Reloj = Math.max(e.Reloj, m.HoraEvento);

    // Total de tiempo haciendo cómputo (por CPU)
    e.TiempoComputo.A += m.TiempoProcesamiento.A;
    e.TiempoComputo.B1 += m.TiempoProcesamiento.B1;
    e.TiempoComputo.B2 += m.TiempoProcesamiento.B2;
    e.TiempoComputo.C += m.TiempoProcesamiento.C;
	e.TiempoComputoG += ["A", "B1", "B2", "C"].map(function(c){
			return m.TiempoProcesamiento[c];
		}).reduce(function(a,b){
			return a+b;
		});

    // Total de tiempo en el sistema
    e.TiempoEnSistema += m.HoraEvento - m.HoraCreacion;

    // Cantidad de devoluciones (B y C)
    e.Devoluciones += m.Devoluciones;
    //e.Devoluciones.C += m.Devoluciones.C;

    // Cantidad de tiempo en colas (A, B y C)
    e.TiempoColas += m.TiempoColas;
    //e.TiempoColas.B	+= m.TiempoColas.B;
    //e.TiempoColas.C	+= m.TiempoColas.C;

    // Cantidad de tiempo en transmisión
    e.TiempoTransmision += m.TiempoTransmision;

    // Porcentaje de procesamiento por mensaje:
    e.ProcesamientoPorMensaje += (m.TiempoProcesamiento.A +
							m.TiempoProcesamiento.B1 +
							m.TiempoProcesamiento.B2 +
							m.TiempoProcesamiento.C) /
							(m.HoraEvento - m.HoraCreacion);
    return e;
}

// ActualizarEstadisticas(estado)
// Actualiza las estadisticas acumuladas del sistema,
// para que sean facilmente consumibles por Angular.js
function ActualizarEstadisticas(e, pseudoreloj) {
    // Se copia el reloj
    e.e.Reloj = e.Reloj;

    // Cantidad de mensajes
    e.e.Enviados = e.Estadisticas.Enviados.NumMsg;
    e.e.Rechazados = e.Estadisticas.Rechazados.NumMsg;
    e.e.NumTotal = e.e.Enviados + e.e.Rechazados;

    // Además hay que calcular cuanto tiempo han estado
    // ocupados nuestros servidores con mensajes
    // que aún no se han terminado de procesar.
    var restoA = 0, restoB1 = 0, restoB2 = 0, restoC = 0;
    if (e.Estados.A) {
        restoA = pseudoreloj - e.HoraOcupacion.A;
    }
    if (e.Estados.B1) {
        restoB1 = pseudoreloj - e.HoraOcupacion.B1;
    }
    if (e.Estados.B2) {
        restoB2 = pseudoreloj - e.HoraOcupacion.B2;
    }
    if (e.Estados.C) {
        restoC = pseudoreloj - e.HoraOcupacion.C;
    }

    // Las estadísticas para mensajes ya procesados, pero
    // que no han salido del sistema se guardan en 
    // Estadisticas.Otros

    // Porcentaje de ocupación

    e.e.pOA = (e.Estadisticas.Otros.TiempoComputo.A + restoA)
            / pseudoreloj;
    e.e.pOB1 = (e.Estadisticas.Otros.TiempoComputo.B1 + restoB1)
			 / pseudoreloj;
    e.e.pOB2 = (e.Estadisticas.Otros.TiempoComputo.B2 + restoB2)
			 / pseudoreloj;
    e.e.pOC = (e.Estadisticas.Otros.TiempoComputo.C + restoC)
			 / pseudoreloj;

    // Porcentaje de ocupación en mensajes rechazados
    e.e.pORA = e.Estadisticas.Rechazados.TiempoComputo.A
			 / e.Reloj;
    e.e.pORB1 = e.Estadisticas.Rechazados.TiempoComputo.B1
			 / e.Reloj;
    e.e.pORB2 = e.Estadisticas.Rechazados.TiempoComputo.B2
			 / e.Reloj;
    e.e.pORC = e.Estadisticas.Rechazados.TiempoComputo.C
			 / e.Reloj;

    // Porcentaje de mensajes rechazados
    e.e.pMsgRechazado = e.e.Rechazados / e.e.NumTotal;

    //////////////////////////////////////////////////////////////////////
    // Las siguienes estadísticas hay que obtenerlas por separado para:
    // - Mensajes rechazados
    // - Mensajes enviados
    // - Todos los mensajes
    var EstadisticasPorTipo = ["TiempoEnSistema", "Devoluciones", "TiempoColas", "TiempoTransmision", "TiempoComputoG", "ProcesamientoPorMensaje"];

    EstadisticasPorTipo.forEach(function (cat) {
        e.e[cat + "Enviados"] = e.Estadisticas.Enviados[cat] / e.e.Enviados;
        e.e[cat + "Rechazados"] = e.Estadisticas.Rechazados[cat] / e.e.Rechazados;
        e.e[cat + "Todos"] = (e.Estadisticas.Enviados[cat] + e.Estadisticas.Rechazados[cat]) / e.e.NumTotal;
    });
	
	/*
	e.e.TiempoComputoEnviados = ["A", "B1", "B2", "C"].map(function(l){
			return e.Estadisticas.Enviados.TiempoComputo[l];
		}).reduce(function(a,b){
			return a+b;
		}) / e.e.Enviados;
		
	e.e.TiempoComputoRechazados = ["A", "B1", "B2", "C"].map(function(l){
		return e.Estadisticas.Rechazados.TiempoComputo[l];
		}).reduce(function(a,b){
			return a+b;
		}) / e.e.Rechazados;
	
	e.e.TiempoComputoTodos = ["A", "B1", "B2", "C"].map(function(l){
			return e.Estadisticas.Enviados.TiempoComputo[l] + 
				e.Estadisticas.Rechazados.TiempoComputo[l];
		}).reduce(function(a,b){
			return a+b;
		}) / e.e.NumTotal;
	*/
	
    /*
	// Tiempo promedio en el sistema por mensaje
	e.e.TiempoEnSistema = (e.Estadisticas.Enviados.TiempoEnSistema +
					e.Estadisticas.Rechazados.TiempoEnSistema)
					/ e.e.NumTotal;

	// Promedio de devoluciones
	e.e.Devoluciones = (e.Estadisticas.Enviados.Devoluciones.B +
					e.Estadisticas.Rechazados.Devoluciones.B)
					/ e.e.NumTotal;
					
	// Tiempo promedio en colas
	e.e.TiempoColas = (e.Estadisticas.Enviados.TiempoColas +
					e.Estadisticas.Rechazados.TiempoColas)
					/ e.e.NumTotal;
					
	// Tiempo promedio en transmisión
	e.e.TiempoTransmision = (e.Estadisticas.Enviados.TiempoTransmision +
					e.Estadisticas.Rechazados.TiempoTransmision)
					/ e.e.NumTotal;
	
	// Porcentaje de tiempo en procesamiento
	// por mensaje
	e.e.ProcesamientoPorMensaje = (e.Estadisticas.Enviados.ProcesamientoPorMensaje +
					e.Estadisticas.Rechazados.ProcesamientoPorMensaje) /
					e.e.NumTotal;
	*/
    return e;
}


//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////

// DeltaTiempo(estado, mensaje)
// Devuelve la cantidad de minutos que pasaron entre
// el evento anterior en el que participó el mensaje
// y el reloj actual de la simulación.
function DeltaTiempo(estado, mensaje) {
    return estado.Reloj - mensaje.HoraEvento;
}

// Aquí van métodos auxiliares que sirven
// para crear eventos.
// Cada evento tiene asociado un tiempo de ocurrencia,
// un Lambda, nombre, descripción y datos asociados.
function FactoryEventos(tiempo, datos) {
    // Creación de mensajes
    this.CrearMensajeB = function () {
        return new Evento(
			tiempo,
			"Crear mensaje para B",
			"Se ha creado un mensaje nuevo para que sea recibido por B",
			HandlerCrearMensajeB,
			datos);
    };

    this.CrearMensajeC = function () {
        return new Evento(
			tiempo,
			"Crear mensaje para C",
			"Se ha creado un mensaje nuevo para que sea recibido por C",
			HandlerCrearMensajeC,
			datos);
    };

    // Recibir mensajes
    this.RecibirMensajeA = function () {
        return new Evento(
			tiempo,
			"A recibe un mensaje",
			"Se ha creado un mensaje nuevo para que sea recibido por A",
			HandlerRecibirMensajeA,
			datos);
    };

    this.RecibirMensajeB = function () {
        return new Evento(
			tiempo,
			"B recibe un mensaje",
			"Se ha creado un mensaje nuevo para que sea recibido por B",
			HandlerRecibirMensajeB,
			datos);
    };

    this.RecibirMensajeC = function () {
        return new Evento(
			tiempo,
			"C recibe un mensaje",
			"Se ha creado un mensaje nuevo para que sea recibido por C",
			HandlerRecibirMensajeC,
			datos);
    };

    // Se atendió un mensaje
    // Estos eventos son creados cuando se recibe
    // un mensaje (si no hay mensajes en cola) o
    // bien cuando se termina de atender otro mensaje.
    // Deben enviar el mensaje a la PC correspondiente
    // y atender el mensaje siguiente (si existe en cola).
    this.AtendidoMensajeA = function () {
        return new Evento(
			tiempo,
			"A atendió un mensaje",
			"A atendio un mensaje",
			HandlerAtendidoMensajeA,
			datos);
    };

    this.AtendidoMensajeB1 = function () {
        return new Evento(
			tiempo,
			"B1 atendió un mensaje",
			"B atendió un mensaje",
			HandlerAtendidoMensajeB1,
			datos);
    };

    this.AtendidoMensajeB2 = function () {
        return new Evento(
			tiempo,
			"B2 atendió un mensaje",
			"B atendió un mensaje",
			HandlerAtendidoMensajeB2,
			datos);
    };

    this.AtendidoMensajeC = function () {
        return new Evento(
			tiempo,
			"C atendió un mensaje",
			"C atendió un mensaje",
			HandlerAtendidoMensajeC,
			datos);
    };

    // Metaeventos:
    // Estos eventos se utilizan para llevar un control
    // de las estadísticas cuando los mensajes salen del
    // sistema

    this.MetaEnviado = function () {
        return new Evento(
			tiempo,
			"Mensaje enviado",
			"Se envió el mensaje exitosamente",
			HandlerMetaEnviado,
			datos);
    };

    this.MetaRechazado = function () {
        return new Evento(
			tiempo,
			"Mensaje rechazado",
			"El abortó el envío de un mensaje",
			HandlerMetaRechazado,
			datos);
    };
}
