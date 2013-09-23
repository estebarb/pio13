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
		{A:0, B1: 0, B2: 0, C: 0}	// T. Procesamiento
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
	// Cantidad de mensajes procesados
	this.NumMsg = NumMsg;
	// Reloj del último evento
	this.Reloj = Reloj;
	// Total de tiempo haciendo cómputo (por CPU)
	this.TiempoComputo = TiempoComputo;
	// Total de tiempo en el sistema
	this.TiempoEnSistema = TiempoEnSistema;
	// Cantidad de devoluciones (B y C)
	this.Devoluciones = Devoluciones;
	// Cantidad de tiempo en colas
	this.TiempoColas = TiempoColas;
	// Cantidad de tiempo en transmisión
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





