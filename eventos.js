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
// (TODO) Se crea un mensaje para C/3
// Recibir mensaje
// (TODO) Se recibe un mensaje en A/1
// (TODO) Se recibe un mensaje en B/2
// (TODO) Se recibe un mensaje en C/3
// Se atendió un mensaje
// (TODO) Se atendió un mensaje en A/1
// (TODO) Se atendió un mensaje en B/2 CPU 1
// (TODO) Se atendió un mensaje en B/2 CPU 2
// (TODO) Se atendió un mensaje en C/3
// Metaeventos (actualizan estadísticas):
// (TODO) Mensaje RECHAZADO
// (TODO) Mensaje ENVIADO

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
function HandlerCrearMensajeB(estado, data){
	// Se crea un mensaje en el instante actual.
	var msg = CrearMensaje(estado);
	// Se debe crear un evento para que se reciba
	// el mensaje:
	var evento = new FactoryEventos(
					estado.Reloj,
					{mensaje: msg}).RecibirMensajeB();
    // (Como el transporte en este caso es instantáneo
    // usamos el mismo reloj)
    
    // Ahora creamos el nuevo evento (B recibe mensaje nuevo):
    estado = PushEvent(evento, estado);
    
    // Por otro lado debemos volver a calendarizar
    // el evento de creación de mensajes.
    // B recibe un mensaje según una distribución normal
    // con media 15s y varianza 1s²
    var repeticion = new FactoryEventos(
    					estado.Reloj + DistribucionNormal(15, 1)/60,
    					null).CrearMensajeB();
    estado = PushEvent(repeticion, estado);
    
    // Y devolvemos el nuevo estado de la simulación
    return estado;
}

// Crea un mensaje que será recibido
// por la computadora C.
function HandlerCrearMensajeC(estado, data){
	// Se crea un mensaje en el instante actual.
	var msg = CrearMensaje(estado);
	// Se debe crear un evento para que se reciba
	// el mensaje:
	var evento = new FactoryEventos(
					estado.Reloj,
					{mensaje: msg}).RecibirMensajeC();
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
function HandlerRecibirMensajeC(estado, data){
	var msg = data.mensaje;
	// Se actualizan las estadísticas de transmisión
	msg.TiempoTransmision.C += DeltaTiempo(estado, msg)
	// Se guarda la hora de encolamiento:
	msg.HoraEvento = estado.Reloj;
	
	// Si no está ocupado vamos a atender el mensaje
	if (! estado.Estados.C){
		// Ahora está ocupado:
		estado.Estados.C = true;
		// Tiempo atendiéndose:
		var ta = DistribucionExponencial(60/4)
		// Se actualizan las estadísticas:
		msg.TiempoProcesamiento.C += ta;
		// Se configura el evento "mensaje atendido por C":
		var evento = new FactoryEventos(
			estado.Reloj + ta,
			{mensaje: msg}
			).AtendidoMensajeC();
		// Y se programa el evento:
		estado = PushEvent(evento, estado);
	} else {
		// Sino solamente lo encolamos:
		estado.Colas.C.push(msg);
	}
	
	return estado;
}

//////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////

// DeltaTiempo(estado, mensaje)
// Devuelve la cantidad de minutos que pasaron entre
// el evento anterior en el que participó el mensaje
// y el reloj actual de la simulación.
function DeltaTiempo(estado, mensaje){
	return estado.Reloj - mensaje.HoraEvento;
}

// Aquí van métodos auxiliares que sirven
// para crear eventos.
// Cada evento tiene asociado un tiempo de ocurrencia,
// un Lambda, nombre, descripción y datos asociados.
function FactoryEventos(tiempo, datos){	
	// Creación de mensajes
	this.CrearMensajeB = function()	{
		return new Evento(
			tiempo,
			"Crear mensaje para B",
			"Se ha creado un mensaje nuevo para que sea recibido por B",
			HandlerCrearMensajeB,
			datos);
	};
	
	this.CrearMensajeC = function()	{
		return new Evento(
			tiempo,
			"Crear mensaje para C",
			"Se ha creado un mensaje nuevo para que sea recibido por C",
			HandlerCrearMensajeC,
			datos);
	};
	
	// Recibir mensajes
	this.RecibirMensajeA = function()	{
		return new Evento(
			tiempo,
			"A recibe un mensaje",
			"Se ha creado un mensaje nuevo para que sea recibido por A",
			HandlerRecibirMensajeA,
			datos);
	};
	
	this.RecibirMensajeB = function()	{
		return new Evento(
			tiempo,
			"B recibe un mensaje",
			"Se ha creado un mensaje nuevo para que sea recibido por B",
			HandlerRecibirMensajeB,
			datos);
	};
	
	this.RecibirMensajeC = function()	{
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
	this.AtendidoMensajeA = function()	{
		return new Evento(
			tiempo,
			"A atendió un mensaje",
			"A atendio un mensaje",
			HandlerAtendidoMensajeA,
			datos);
	};
	
	this.AtendidoMensajeB = function()	{
		return new Evento(
			tiempo,
			"B atendió un mensaje",
			"B atendió un mensaje",
			HandlerAtendidoMensajeB,
			datos);
	};
	
	this.AtendidoMensajeC = function()	{
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
	
	this.MetaEnviado = function()	{
		return new Evento(
			0,
			"Mensaje enviado",
			"Se envió el mensaje exitosamente",
			HandlerMetaEnviado,
			datos);
	};
	
	this.MetaRechazado = function()	{
		return new Evento(
			0,
			"Mensaje rechazado",
			"El abortó el envío de un mensaje",
			HandlerMetaRechazado,
			datos);
	};
}
