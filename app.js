// Simulación de Investigación de Operaciones
// Esteban Rodríguez Betancourt
// B15512

function SimulacionCtrl($scope){
	$scope.Simulaciones = [];
	$scope.SA = {};
	
	$scope.MinutosSimulacion = 10;
	$scope.CantidadRepeticiones = 1;
	$scope.PausaMilis = 500;
	
	$scope.Reiniciar = function(){
		// Inicializa los valores de la simulación
		$scope.Simulaciones = [];
		$scope.SA = {};
		$scope.terminar = true;
	};
	
	$scope.Detener = function(){
		$scope.terminar = true;
	};
	
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
					Rechazados: CrearEstadisticas()
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
					Rechazados: CrearEstadisticas()
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
	
	$scope.SimularBootstrap = function(pausa, repeticiones, tiempo){
		// ¿Ya se acabaron las repeticiones?
		if (repeticiones <= 0){
			return;
		}
		var e = new Estado(
			0, //Reloj
			{A: [], B: [], C:[]}, //Colas
			[], //Eventos
			{A:false, B1: false, B2: false, C:false}, //Estados
			{
				Enviados: CrearEstadisticas(), 
				Rechazados: CrearEstadisticas()
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
		$scope.$apply();
		
		// Llama al siguiente paso:
		window.setTimeout(
			function(){
				$scope.SimularResto(pausa, repeticiones, tiempo)
			},
			pausa);
	}
	
	$scope.SimularResto = function(pausa, repeticiones, tiempo){
		e = $scope.SA;
		// ¿Ya se acabó la simulación actual?
		if (e.Finished){
			window.setTimeout(
				function(){
					$scope.SimularResto(pausa, repeticiones-1, tiempo)
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
			$scope.$apply();		
		
			// Y hacemos una llamada "recursiva"
			window.setTimeout(
				function(){
					$scope.SimularResto(pausa, repeticiones, tiempo)
				},
				pausa);
		}
	}
	
	$scope.Simular2 = function(){
		// Borra el estado del sistema...
		$scope.Simulaciones = [];
		$scope.SA = null;
		// Y comienza la simulación:
		$scope.SimularBootstrap(
				$scope.PausaMilis,
				$scope.CantidadRepeticiones,
				$scope.MinutosSimulacion
				);
	}
}
