// Simulación de Investigación de Operaciones
// Esteban Rodríguez Betancourt
// B15512

function SimulacionCtrl($scope){
	$scope.Simulaciones = [];
	$scope.SA = {};
	$scope.Promedios = {};
	$scope.Confianza = {};
	
	$scope.MinutosSimulacion = 10;
	$scope.CantidadRepeticiones = 1;
	$scope.PausaMilis = 500;
	
	$scope.Reiniciar = function(){
		// Inicializa los valores de la simulación
		$scope.Simulaciones = [];
		$scope.SA = {};
		$scope.Promedios = {};
		$scope.Confianza = {};
		$scope.terminar = true;
	};
	
	/*
	$scope.Detener = function(){
		$scope.terminar = true;
	};
	*/
	
	/*
	$scope.SimularPaso = function(repeticiones, maxminutos){
		if(repeticiones == 0){
			return;
		}
		if ($scope.Simulaciones.length == 0 || $scope.SA.Finished){
			// Se crea un estado nuevo
			var e = new Estado(
				0, //Reloj
				{A: [], B: [], C:[]}, //Colas
				[], //Eventos
				{A:false, B1: false, B2: false, C:false}, //Estados
				{
					Enviados: CrearEstadisticas(), 
					Rechazados: CrearEstadisticas(),
					Otros: CrearEstadisticas()
				});
			// Se insertan los primeros dos eventos
			var eveB, eveC;
			eveB = new FactoryEventos(0, null).CrearMensajeB();
			eveC = new FactoryEventos(0, null).CrearMensajeC();
			e = PushEvent(eveB, e);
			e = PushEvent(eveC, e);
			
			// Hace binding entre el estado y la GUI
			$scope.Simulaciones.push(e);
			$scope.SA = e;
		} else {
			var e = $scope.SA;
			
			// Ejecuta un paso de la simulación
			e = SimulationStep(e);
			
			// Hay que revisar si ya la simulación acabó:
			if(PeekEvent(e).Tiempo > maxminutos){
				repeticiones--;
				e.Finished = true;
			}
			
			// Actualiza los bindings
			$scope.Simulaciones.pop();
			$scope.Simulaciones.push(e);
			$scope.SA = e;
		}
		
		// Si el usuario no ha presionado pausar entonces sigue...
		if(! $scope.terminar){
			setTimeout(function(){
				$scope.SimularPaso(repeticiones, maxminutos);
				console.log("corre");
				},
				$scope.PausaMilis);
		}
	};
	
	$scope.SimularTodo = function(){
		//$scope.terminar = false;
		//$scope.SimularPaso($scope.CantidadRepeticiones, $scope.MinutosSimulacion);
		for(var r = 0; r < $scope.CantidadRepeticiones; r++){
			var e = new Estado(
				0, //Reloj
				{A: [], B: [], C:[]}, //Colas
				[], //Eventos
				{A:false, B1: false, B2: false, C:false}, //Estados
				{
					Enviados: CrearEstadisticas(), 
					Rechazados: CrearEstadisticas(),
					Otros: CrearEstadisticas()
				});
			// Se insertan los primeros dos eventos
			var eveB, eveC;
			eveB = new FactoryEventos(0, null).CrearMensajeB();
			eveC = new FactoryEventos(0, null).CrearMensajeC();
			e = PushEvent(eveB, e);
			e = PushEvent(eveC, e);
			
			// Hace binding entre el estado y la GUI
			$scope.Simulaciones.push(e);
			$scope.SA = e;
			
			while(PeekEvent(e).Tiempo <= $scope.MinutosSimulacion){
				e = SimulationStep(e);
				// Actualiza Modelo
				$scope.Simulaciones.pop();
				$scope.Simulaciones.push(e);
				$scope.SA = e;
				$scope.$apply();
			}
			
			e.Finished = true;			
		};
	};
	*/
	
	$scope.SimularBootstrap = function(pausa, repeticiones, tiempo){
		// ¿Ya se acabaron las repeticiones?
		if (repeticiones <= 0){
			$scope.ActualizarDatosAcumulados();
			return;
		}
		var e = new Estado(
			0, //Reloj
			{A: [], B: [], C:[]}, //Colas
			[], //Eventos
			{A:false, B1: false, B2: false, C:false}, //Estados
			{
				Enviados: CrearEstadisticas(), 
				Rechazados: CrearEstadisticas(),
					Otros: CrearEstadisticas()
			});
		// Se insertan los primeros dos eventos
		var eveB, eveC;
		eveB = new FactoryEventos(0, null).CrearMensajeB();
		eveC = new FactoryEventos(0, null).CrearMensajeC();
		e = PushEvent(eveB, e);
		e = PushEvent(eveC, e);
		
		// Hace binding entre el estado y la GUI
		$scope.Simulaciones.push(e);
		$scope.SA = e;
		$scope.ActualizarDatosAcumulados();
		$scope.$apply();
		
		// Llama al siguiente paso:
		window.setTimeout(
			function(){
				$scope.SimularResto(pausa, repeticiones, tiempo)
			},
			pausa);
	};
	
	$scope.SimularResto = function(pausa, repeticiones, tiempo){
		e = $scope.SA;
		// ¿Ya se acabó la simulación actual?
		if (e.Finished){
		
			// Actualiza finalmente las estadísticas:
			e = ActualizarEstadisticas(e, tiempo);
			$scope.Simulaciones.pop();
			$scope.Simulaciones.push(e);
			$scope.SA = e;
			$scope.ActualizarDatosAcumulados();
			$scope.$apply();
			
			window.setTimeout(
				function(){
					$scope.SimularBootstrap(pausa, repeticiones-1, tiempo)
				},
				pausa);
		} else {
			// Ejecutamos un paso	
			e = SimulationStep(e);
		
			// Cambiamos el estado según ya se 
			// haya terminado la simulación.
			// (Los eventos superan el tiempo
			// límite)
			e.Finished = PeekEvent(e).Tiempo > tiempo;
		
			// Actualiza Modelo
			$scope.Simulaciones.pop();
			$scope.Simulaciones.push(e);
			$scope.SA = e;
			
			// Si el modo rápido está activado entonces
			// NO actualizamos la GUI instantáneamente...
			if(!$scope.ModoRapido){
				$scope.ActualizarDatosAcumulados();
				$scope.$apply();
			}
		
			// Y hacemos una llamada "recursiva"
			window.setTimeout(
				function(){
					$scope.SimularResto(pausa, repeticiones, tiempo)
				},
				pausa);
		}
	};
	
	$scope.Simular2 = function(){
		// Borra el estado del sistema...
		$scope.Simulaciones = [];
		$scope.SA = null;
		$scope.Promedios = {};
		$scope.Confianza = {};
		
		if (!isNumber($scope.PausaMilis)){
			alert("La pausa debe ser un número entero no negativo.");
			return;
		}
		if (!isNumber($scope.CantidadRepeticiones)){
			alert("La cantidad de repeticiones debe ser un entero no negativo.");
			return;
		}
		if (!isNumber($scope.MinutosSimulacion)){
			alert("La cantidad de minutos a simular debe ser un entero no negativo.");
			return;
		}
		
		// Y comienza la simulación:
		$scope.SimularBootstrap(
				$scope.PausaMilis,
				$scope.CantidadRepeticiones,
				$scope.MinutosSimulacion
				);
	};
	
	// Actualiza los promedios del batch
	// actual de simulaciones.
	$scope.ActualizarDatosAcumulados = function(){
		// Suma e al acumulador s
		var sum = function(e, s){
			return e + s;
		}
	
		var p = {}, s, c = {};
		s = $scope.Simulaciones;
		
		// Se calculan los promedios:
		var valores = ["Reloj",
		"Enviados", "Rechazados", "NumTotal",
		"pOA", "pOB1", "pOB2", "pOC",
		"pORA", "pORC",
		"pMsgRechazado",
		"DevolucionesB", "DevolucionesC",
		"TSistema", "TiempoColas", "TiempoTransmision",
		"PorcentajeProcesamiento"];
		
		valores.forEach(
			function(elemento){
				p[elemento] = s.map(function(val){
						return val.e[elemento]
					}).reduce(sum) / Math.max(1, s.length);
			}
		);
				
		
		/////////////////////////////////////////////////////////
		// Y se asigna al binding correspondiente:
		$scope.Promedios = p;
		$scope.Confianza = c;
	};
}

// Determina si un número es un número entero o no
// basado en http://stackoverflow.com/questions/18082/validate-numbers-in-javascript-isnumeric
function isNumber(n) {
  return !isNaN(parseInt(n)) && isFinite(n) && parseInt(n) == parseFloat(n);
}
