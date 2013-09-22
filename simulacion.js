// Simulación de Investigación de Operaciones
// Esteban Rodríguez Betancourt
// B15512

// TODAS las mediciones de tiempo serán realizadas en
// minutos.


// Una simulación tiene eventos. Los eventos serán representados
// por un objeto, que contendrán un tiempo de ocurrencia y una 
// función que devolverá el estado siguiente de la simulación.
function Evento(tiempo, lambda){
	// tiempo es la hora de ocurrencia de un evento,
	// medida en minutos.
	this.tiempo = tiempo;
	// lambda es una función que recibe un estado del sistema
	// y retorna el siguiente estado del sistema.
	// Tiene la siguiente forma:
	// function(estado){
	//    return EstadoSiguiente(estado);
	// }
	this.lambda = lambda;
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













