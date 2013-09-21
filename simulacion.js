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
// NumRechazos
// PC Anterior (puede ser la 0, 1, 2 o 3)
// Tiempo en cola A
// Tiempo en cola B
// Tiempo en cola C
// Tiempo en transmisión
// Tiempo en procesamiento
function Mensaje(HoraCreacion, HoraEvento, NumRechazos, PCanterior, TiempoColaA, TiempoColaB, TiempoColaC, TiempoTransmisión, TiempoProcesamiento){
	this.HoraCreacion = HoraCreacion;
	this.HoraEvento = HoraEvento;
	this.NumRechazos = NumRechazos;
	this.PCanterior = PCanterior;
	this.TiempoColaA = TiempoColaA;
	this.TiempoColaB = TiempoColaB;
	this.TiempoColaC = TiempoColaC;
	this.TiempoTransmision = TiempoTransmision;
	this.TiempoProcesamiento = TiempoProcesamiento;
}

// Las estadísticas que deseamos recolectar 
// son:
// Mensajes aceptados / rechazados:
// - Porcentaje de tiempo que pasa ocupado cada procesador
// - Porcentaje de tiempo que pasa ocupado CPU 1 y 3 con mensajes
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
function Estadisticas(numMsg, tiempoCorriendo, tiempoOcupadoA, )














