// Simulación de Investigación de Operaciones
// Esteban Rodríguez Betancourt
// B15512

function SimulacionCtrl($scope){
	$scope.Simulaciones = [];
	$scope.SA = {};
	
	$scope.Reiniciar = function(){
		// Inicializa los valores de la simulación
		$scope.Simulaciones = [];
		$scope.SA = {};
		$scope.terminar = true;
	};
	
	$scope.Pausar = function(){
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
			eveB = FactoryEventos(0, null).CrearMensajeB();
			eveC = FactoryEventos(0, null).CrearMensajeC();
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
			setTimeout($scope.SimularPaso(repeticiones, maxminutos),
				$scope.PausaMilis);
		}
	};
	
	$scope.SimularTodo = function(){
		$scope.terminar = false;
		$scope.SimularPaso($scope.CantidadRepeticiones, $scope.MinutosSimulacion);
	};
}
