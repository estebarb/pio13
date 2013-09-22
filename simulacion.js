// Simulación de Investigación de Operaciones
// Esteban Rodríguez Betancourt
// B15512

// TODAS las mediciones de tiempo serán realizadas en
// minutos.


// Una simulación tiene eventos. Los eventos serán representados
// por un objeto, que contendrán un tiempo de ocurrencia y una 
// función que devolverá el estado siguiente de la simulación.
function Evento(tiempo, nombre, descripcion, lambda){
	// tiempo es la hora de ocurrencia de un evento,
	// medida en minutos.
	this.Tiempo = tiempo;
	// lambda es una función que recibe un estado del sistema
	// y retorna el siguiente estado del sistema.
	// Tiene la siguiente forma:
	// function(estado){
	//    return EstadoSiguiente(estado);
	// }
	this.Lambda = lambda;
	
	// Y esto sirve para describir el evento:
	this.Nombre = nombre;
	this.Descripcion = descripcion;
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
	this.HoraCreacion = HoraCreacion;
	this.HoraEvento = HoraEvento;
	this.Devoluciones = Devoluciones;
	this.PCanterior = PCanterior;
	this.TiempoColas = TiempoColas;
	this.TiempoTransmision = TiempoTransmision;
	this.TiempoProcesamiento = TiempoProcesamiento;
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

// PushEvent(evento, lista)
// Inserta un evento en la lista de eventos
// Recibe:
// - evento: el nuevo evento que se ingresará a la lista
// - lista: una lista formada por objetos "Evento"
// Retorna:
//   Una lista de eventos con el nuevo evento agregado
// Observaciones:
//   La lista está ordenada por orden de aparición del
//   evento. Se utiliza "insert sort".
function PushEvent(evento, lista){	
	var tmp, anterior = evento;
	for(var i = 0; i < lista.length; i++){
		if(lista[i].Tiempo > anterior.Tiempo){
			tmp = lista[i];
			lista[i] = anterior;
			anterior = tmp;
		}
	}
	lista.push(anterior);
	
	return lista;
}

// PeekEvent(lista)
// Retorna el evento más cercano a suceder de la
// lista.
// Parámetros:
// - lista: una lista de eventos (construida con PushEvent).
// Retorna:
//   El evento más próximo
function PeekEvent(lista){
	if (lista.length > 0){
		return lista[0];
	} else {
		return null;
	}
}

// PopEvent(lista)
// Elimina el evento más cercano a suceder de la
// lista.
// Parámetros:
// - lista: una lista de eventos
// Retorna:
//   Una lista sin el primer evento.
function PopEvent(lista){
	// Como la lista es construida usando
	// PushEvent estamos seguros que está
	// ordenada por tiempo de ejecución
	// del evento.
	// Por lo tanto, basta con eliminar 
	// el primer elemento.
	lista.shift();
	return lista;
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
	var evento;
	
	// Toma el evento más reciente
	evento = PeekEvent(estado.Eventos);
	// Y lo borra de la lista de eventos:
	estado.Eventos = PopEvent(estado.Eventos);
	
	// Actualiza el reloj:
	estado.Reloj = evento.Tiempo;
	
	// Y escribe cual evento se está
	// ejecutando ahora, para poder
	// hacer binding en la GUI.
	estado.Ejecutando = evento;
	
	return evento.Lambda(estado);
}

//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////

// Definición de eventos
// Los eventos son representados como funciones que devuelven
// el estado futuro del sistema dado un estado actual.
// La definición de los eventos como funciones puras tiene
// varios efectos secundarios deseados (sic. jajajajaja):
// - Es posible modificar el estado de la simulación
//   de forma atómica/transaccional.
// - 








