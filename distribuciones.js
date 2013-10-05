// Simulación de Investigación de Operaciones
// Esteban Rodríguez Betancourt
// B15512
//
//
// (Recomiendo ver el código usando tabulaciones de
//  cuatro caracteres).



/// Funciones de distribuciones de probabilidad:

// DistribucionConstante(NN)
// Retorna una distribución constante. La razón de su
// existencia es tener código autoexplicativo, pero 
// es la función identidad.
function DistribucionConstante(n){
	return n;
}


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
	// Primero se saca el valor aleatorio en segundos
	var dissegundos = 4 * Math.sqrt(3 * DistribucionUniforme(0,1) + 1);
	// Y luego se convierte a minutos
	return dissegundos / 60;
}


// DistribucionX600()
// Produce un número flotante aleatorio usando que tiene una
// función de distribución de probabilidad de x/600, con 20<x<40.
function DistribucionX600(){
	// Primero en segundos
	var dissegundos = 20 * Math.sqrt(3 * DistribucionUniforme(0,1) + 1);
	// Luego se transforma en minutos
	return dissegundos / 60;
}

// DistribucionNormal()
// Produce un número flotante aleatorio que sigue una distribución
// normal estandar
// Retorna:
//   Un número flotante
function DistribucionNormalEstandar(){
	var acum = 0;
	for(var i = 0; i < 12; i++){
		acum += DistribucionUniforme(0, 1);
	}
	return acum - 6;
}

// DistribucionNormal(u, v)
// Produce un número flotante aleatorio que sigue una distribución
// normal de media u y varianza v.
// Parámetros:
// - u : media de la districión normal
// - v : varianza de la distribución normal
// Retorna:
//   Un número flotante
function DistribucionNormal(u, v){
	return DistribucionNormalEstandar() * v + u;
}
