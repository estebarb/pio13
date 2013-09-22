// Simulación de Investigación de Operaciones
// Esteban Rodríguez Betancourt
// B15512
//
//
// (Recomiendo ver el código usando tabulaciones de
//  cuatro caracteres).

// TODAS las mediciones de tiempo serán realizadas en
// minutos.


// Una simulación tiene eventos. Los eventos serán representados
// por un objeto, que contendrán un tiempo de ocurrencia y una 
// función que devolverá el estado siguiente de la simulación.
function Evento(tiempo, nombre, descripcion, lambda, data){
	// tiempo es la hora de ocurrencia de un evento,
	// medida en minutos.
	this.Tiempo = tiempo;
	// lambda es una función que recibe un estado del sistema
	// y retorna el siguiente estado del sistema.
	// Tiene la siguiente forma:
	// function(estado, data){
	//    return EstadoSiguiente(estado, data);
	// }
	this.Lambda = lambda;
	
	// Y esto sirve para describir el evento:
	this.Nombre = nombre;
	this.Descripcion = descripcion;
	
	// Y esto se utiliza en caso que el evento requiera datos
	// adicionales. Por ejemplo, para transferir mensajes.
	this.Data = data;
}


// En esta simulación, además, hay mensajes.
// Cada mensaje está formado por un objeto que
// contiene los siguientes elementos:
// HoraCreacion
// HoraEvento
// Devoluciones {B:0, C:0}
// PC Anterior (puede ser la 0, 1, 2 o 3)
// Tiempo en colas {A:0, B:0, C:0}
// Tiempo en transmisión {A:0, B:0, C:0}
// Tiempo en procesamiento {A:0, B:0, C:0}
function Mensaje(HoraCreacion, HoraEvento, Devoluciones, PCanterior, TiempoColas, TiempoTransmisión, TiempoProcesamiento){
	// Hora de creación del mensaje actual
	this.HoraCreacion = HoraCreacion;
	
	// Hora del evento actual/anterior
	this.HoraEvento = HoraEvento;
	
	// Cantidad de veces que ha sido devuelto a PC B, C
	this.Devoluciones = Devoluciones;
	
	// PC en la que estaba en el evento anterior.
	this.PCanterior = PCanterior;
	
	// Tiempo en minutos que ha estado en cola en una PC
	this.TiempoColas = TiempoColas;
	
	// Tiempo que ha estado en transmisión.
	this.TiempoTransmision = TiempoTransmision;
	
	// Tiempo en minutos que ha estado procesándose.
	this.TiempoProcesamiento = TiempoProcesamiento;
}

// CrearMensaje
// Crea un mensaje en el instante actual y lo devuelve.
// Parámetros:
// - estado: Estado actual del sistema
// Retorna:
// - Un nuevo mensaje creado en el reloj actual del estado.
function CrearMensaje(estado){
	return new Mensaje(
		estado.Reloj,		// Hora creación
		estado.Reloj,		// Hora evento
		{B: 0, C: 0},		// Devoluciones
		0,					// PC anterior
		{A:0, B: 0, C: 0},	// T. Colas
		{A:0, B: 0, C: 0},	// T. Transmisión
		{A:0, B: 0, C: 0}	// T. Procesamiento
		);
}

// Las estadísticas que deseamos recolectar 
// son:
// Mensajes aceptados / rechazados:
// - Porcentaje de tiempo que pasa ocupado cada procesador
// - Porcentaje de tiempo que pasa ocupado PC 1 y 3 con mensajes
//   que se rechazan.
// - Porcentaje de mensajes rechazados
// - Tiempo promedio en el sistema por cada mensaje
// - Número promedio de veces que un mensaje fue devuelto por la
//   computadora 1 (a la 2 o 3)
// - Tiempo promedio en colas
// - Tiempo promedio en transmisión
// - Porcentaje del tiempo total de cada mensaje usado
//   en procesamiento (no transmisión ni colas).
// Para poder llevar un control de las estadísticas se usará
// un objeto como el siguiente, separando las estadísticas
// para los mensajes aceptados o rechazados.
function Estadisticas(NumMsg, Reloj, TiempoComputo, TiempoEnSistema, Devoluciones, TiempoColas, TiempoTransmision){
	this.NumMsg = NumMsg;
	this.Reloj = Reloj;
	this.TiempoComputo = TiempoComputo;
	this.TiempoEnSistema = TiempoEnSistema;
	this.Devoluciones = Devoluciones;
	this.TiempoColas = TiempoColas;
	this.TiempoTransmision = TiempoTransmision;
}

// La simulación consiste en la aplicación de
// una función de transformación a un Estado del
// sistema. El estado del sistema es representado
// por el siguiente objeto:
function Estado(Reloj, Colas, Eventos, Estados, Estadisticas){
	// Este es el evento que se está ejecutando actualmente.
	// Se guarda acá para hacer el binding con la GUI, por
	// lo demás no es necesario.
	this.Ejecutando = null;
	
	// Esta simulación aún no ha terminado.
	this.Finished = false;
	
	// El estado guarda el reloj del 
	// estado actual de la simulación:
	this.Reloj = Reloj;
	
	// Se guardan las colas de mensajes que ya 
	// están esperando para ser atendidos en
	// una cola para cada computadora.
	// Tiene la forma {A: [], B: [], C:[]}
	this.Colas = Colas;
	
	// Los eventos del sistema se mantienen
	// en una lista de "Evento"s posibles.
	// Es como tener una variable por cada
	// evento con el tiempo de ocurrencia,
	// con la diferencia que en una lista
	// se puede iterar por todos los eventos
	// fácilmente.
	this.Eventos = Eventos;
	
	// Luego se guardan los estados de cada
	// CPU. Esto tiene la forma:
	// Estados = {A:false, B1: false, B2: true, C:false};
	// true = ocupado, false = libre
	this.Estados = Estados;
	
	// Finalmente se guardan las estadísticas del sistema.
	// Es necesario mantener estadísticas separadas para
	// los mensajes aceptados y rechazados.
	// Las estadísticas se recogen cuando los mensajes son
	// enviados al cliente o son rechazados por completo.
	// Tiene la forma:
	// Estadisticas = {Enviados: new Estadisticas(...), 
	//                 Rechazados: new Estadisticas(...)}
	this.Estadisticas = Estadisticas;
}


//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////

// Manejo de los eventos
// Las siguientes funciones insertan un evento en una lista
// de eventos o bien obtienen (y borran) el evento más cercano.

// PushEvent(evento, estado)
// Inserta un evento en la lista de eventos
// Recibe:
// - evento: el nuevo evento que se ingresará a la lista
// - estado: Un estado del sistema
// Retorna:
//   Un nuevo estado con el nuevo evento agregado.
// Observaciones:
//   La lista de eventos del estado está ordenada por 
// orden de aparición del evento. Se utiliza "insert sort".
function PushEvent(evento, estado){	
	var lista = estado.Eventos;
	var tmp, anterior = evento;
	for(var i = 0; i < lista.length; i++){
		if(lista[i].Tiempo > anterior.Tiempo){
			tmp = lista[i];
			lista[i] = anterior;
			anterior = tmp;
		}
	}
	lista.push(anterior);
	estado.Eventos = lista
	return estado;
}

// PeekEvent(estado)
// Retorna el evento más cercano a suceder de la
// lista de eventos de un estado.
// Parámetros:
// - estado: Un estado con eventos
// Retorna:
//   El evento más próximo
function PeekEvent(estado){
	var lista = estado.Eventos;
	if (lista.length > 0){
		return lista[0];
	} else {
		return null;
	}
}

// PopEvent(estado)
// Elimina el evento más cercano a suceder de la
// lista de eventos.
// Parámetros:
// - estado: un estado con una lista de eventos
// Retorna:
//   Un nuevo estado sin el primer evento.
function PopEvent(estado){
	var lista = estado.Eventos;
	// Como la lista es construida usando
	// PushEvent estamos seguros que está
	// ordenada por tiempo de ejecución
	// del evento.
	// Por lo tanto, basta con eliminar 
	// el primer elemento.
	lista.shift();
	estado.Eventos = lista;
	return estado;
}


//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////

// Funciones del simulador

// SimulationStep(estado)
// Ejecuta un paso de la simulación y devuelve el nuevo
// estado.
// Recibe:
// - estado: un estado de una simulación
// Retorna:
//   El siguiente estado de la simulación
function SimulationStep(estado){	
	// Toma el evento más reciente
	var evento = PeekEvent(estado);
	// Y lo borra de la lista de eventos:
	estado = PopEvent(estado);
	
	// Actualiza el reloj:
	estado.Reloj = evento.Tiempo;
	
	// Y escribe cual evento se está
	// ejecutando ahora, para poder
	// hacer binding en la GUI.
	estado.Ejecutando = evento;
	
	// Ejecuta el evento actual y retorna
	// el nuevo estado del sistema.
	return evento.Lambda(estado, evento.Data);
}

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
// (TODO) Se crea un mensaje para B/2
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

// Crea un mensaje que será recibido
// por la computadora B.
function HandlerCrearMensajeB(estado, data){
	// Cuando se crea un mensaje para B
	// se debe crear un mensaje
	var msg = CrearMensaje(estado);
}

// Aquí van métodos auxiliares que sirven
// para crear eventos.
// Cada evento tiene asociado un tiempo de ocurrencia,
// un Lambda, nombre, descripción y datos asociados.
function FactoryEventos(tiempo, datos){
	// new Evento(tiempo, nombre, descripcion, lambda, data);
	
	
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


//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////

/// Funciones de distribuciones de probabilidad:


// DistribuciónMoneda(NN)
// Retorna true o false según un número aleatorio sea mayor
// o menor que NN, con 0<=NN<1.
// Se utiliza para hacer "rifas" tipo "el 80% de los mensajes
// son devueltos". En ese caso uno usa algo así:
//    if( DistribucionMoneda(0.80) ){...}else{...};
// Parámetros:
// - NN : Un número entre [0,1[
// Retorna:
//   true  el NN% de las veces.
//   false el (1-NN)% de las veces.
function DistribucionMoneda(NN){
	return DistribucionUniforme(0,1) < NN;
	// ¿Porqué '<' y no '<='?
	// NN = 0 querría decir un 0% de probabilidades
	// de acertar. Pero la probabilidad de que
	// Math.random() == 0, aunque pequeñísima, no es
	// cero.
}

// DistribucionUniforme(a, b)
// Produce un número floatante aleatorio usando una distribución
// uniforme entre [a, b[.
// Parámetros:
// - a : cota inferior (inclusive)
// - b : superior (excluyente)
// Retorna:
//   un número floatante producido con una distribución uniforme.
// Observaciones:
//   se utiliza el generador de números aleatorios de javascript.
function DistribucionUniforme(a, b){
	return a + (b - a) * Math.random();
}

// DistribucionExponencial(lambda)
// Produce un número flotante aleatorio usando una distribución
// exponencial de lambda cosas por minuto.
// Parámetros:
// - lambda : Cantidad "cosas" por minuto
// Retorna:
//   Un número flotante producido con una distribución exponencial.
function DistribucionExponencial(lambda){
	return Math.log(1 - DistribucionUniforme(0,1)) / (-lambda);
}

// DistribucionX24()
// Produce un número flotante aleatorio usando que tiene una
// función de distribución de probabilidad de x/24, con 4<x<8.
function DistribucionX24(){
	return 4 * Math.sqrt(3 * DistribucionUniforme(0,1) + 1);
}


// DistribucionX600()
// Produce un número flotante aleatorio usando que tiene una
// función de distribución de probabilidad de x/600, con 20<x<40.
function DistribucionX600(){
	return 20 * Math.sqrt(3 * DistribucionUniforme(0,1) + 1);
}


