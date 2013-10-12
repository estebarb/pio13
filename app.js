// Simulación de Investigación de Operaciones
// Esteban Rodríguez Betancourt
// B15512

function SimulacionCtrl($scope){
	$scope.Simulaciones = [];
	$scope.SA = {};
	$scope.Promedios = {};
	$scope.Confianza = {};
	
	$scope.MinutosSimulacion = 10;
	$scope.CantidadRepeticiones = 10;
	$scope.PausaMilis = 0;
	$scope.PorcentajeConfianza = 95;
	$scope.AcumuladaStudent = StudentDisponibles;
	
	$scope.Reiniciar = function(){
		// Inicializa los valores de la simulación
		$scope.Simulaciones = [];
		$scope.SA = {};
		$scope.Promedios = {};
		$scope.Confianza = {};
		$scope.terminar = true;
	};
	
	// Realiza el bootstrap de una ejecución de la simulación
	$scope.DoBootstrap = function(repeticiones, tiempo){
		// ¿Ya se acabaron las repeticiones?
		if (repeticiones <= 0){
			$scope.ActualizarDatosAcumulados();
			$scope.$apply();
			return false;
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
		
		return true;
	};
	
	$scope.SimularBootstrap = function(pausa, repeticiones, tiempo){
		if(!$scope.DoBootstrap(repeticiones, tiempo)){
			return;
		}
		$scope.ActualizarDatosAcumulados();
		$scope.$apply();
		// Llama al siguiente paso:
		window.setTimeout(
			function(){
				$scope.SimularResto(pausa, repeticiones, tiempo)
			},
			pausa);
	};
	
	$scope.DoSimulationStep = function(repeticiones, tiempo){
		e = $scope.SA;
		// ¿Ya se acabó la simulación actual?
		if (e.Finished){
		
			// Actualiza finalmente las estadísticas:
			e = ActualizarEstadisticas(e, tiempo);
			$scope.Simulaciones.pop();
			$scope.Simulaciones.push(e);
			$scope.SA = e;
			
			return false;
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
			
			return true;
		}
	};
	
	$scope.SimularResto = function(pausa, repeticiones, tiempo){
		var sigue = $scope.DoSimulationStep(repeticiones, tiempo);
		// Si el modo rápido está activado entonces
		// NO actualizamos la GUI instantáneamente...
		if(!$scope.ModoRapido){
			$scope.ActualizarDatosAcumulados();
			$scope.$apply();
		}
		if(sigue){
			// En este caso se debe repetir SimularResto
			window.setTimeout(
				function(){
					$scope.SimularResto(pausa, repeticiones, tiempo);
				},
				pausa);
		} else {
			// En este otro se debe llamar a SimularBootstrap
			window.setTimeout(
				function(){
					$scope.SimularBootstrap(pausa, repeticiones-1, tiempo);
				},
				pausa);
		}
	};
	
	$scope.FirstExecution = function(){
		// Borra el estado del sistema...
		$scope.Simulaciones = [];
		$scope.SA = null;
		$scope.Promedios = {};
		$scope.Confianza = {};
		
		if (!isNumber($scope.PausaMilis)){
			alert("La pausa debe ser un número entero no negativo.");
			return false;
		}
		if (!isNumber($scope.CantidadRepeticiones)){
			alert("La cantidad de repeticiones debe ser un entero no negativo.");
			return false;
		}
		if (!isNumber($scope.MinutosSimulacion)){
			alert("La cantidad de minutos a simular debe ser un entero no negativo.");
			return false;
		}
		if (!isFloat($scope.PorcentajeConfianza) &&
		 $scope.PorcentajeConfianza > 0 &&
		 $scope.PorcentajeConfianza < 100){
			alert("El porcentaje de confianza debe ser un número flotante entre 0 y 100");
			return false;
		}
		return true
	};
	
	$scope.Simular2 = function(){
		if(!$scope.FirstExecution()){
			return;
		}
		
		// Y comienza la simulación:
		$scope.SimularBootstrap(
				$scope.PausaMilis,
				$scope.CantidadRepeticiones,
				$scope.MinutosSimulacion
				);
	};
	
	$scope.FastExecution = function(){
		if(!$scope.FirstExecution()){
			return;
		}
		
		// Y comienza la simulación:
		$scope.FastExec(
				$scope.CantidadRepeticiones,
				$scope.MinutosSimulacion
				);
	};
	
	$scope.FastExec = function(repeticiones, minutos){
		if(repeticiones>0){
			// Hace el bootstraping:
			$scope.DoBootstrap(repeticiones, minutos);
		
			// Hace una simulación completa
			while($scope.DoSimulationStep(repeticiones, minutos)){}
	
			// Actualiza las estadísticas
			$scope.ActualizarDatosAcumulados();
			$scope.$apply();
		
			// Hace la llamada recursiva:
			window.setTimeout(function(){
						$scope.FastExec(repeticiones-1, minutos);
					},
					0);
		} else {
			$scope.ActualizarDatosAcumulados();
			$scope.$apply();
		}
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
		
		// Los valores que deseamos calcular
		var valores = ["Reloj",
		"Enviados", "Rechazados", "NumTotal",
		"pOA", "pOB1", "pOB2", "pOC",
		"pORA", "pORC",
		"pMsgRechazado"];

		["TiempoEnSistema", "Devoluciones", "TiempoColas", "TiempoTransmision", "TiempoComputoG", "ProcesamientoPorMensaje"].forEach(function(tipo){
		    ["Enviados", "Rechazados", "Todos"].forEach(function(cat){
		        valores.push(tipo + cat);
		    });
		});
		
		// Para evitar divisiones entre 0
		var total = Math.max(1, s.length);
		
		// Se calcula el alfa y el t de student para
		// el porcentaje de confianza deseado
		var alfa = $scope.PorcentajeConfianza;
		if(!isFloat(alfa)){
			$scope.PorcentajeConfianza = 95;
			alfa = 95;
		}

		var t = TStudentDistribution(alfa, total - 1);
		
		
		// Se calculan los promedios e intervalos de confianza:
		valores.forEach(
			function(elemento){				
				// Calcula el promedio
				var media = s.map(function(val){
						return val.e[elemento]
					}).reduce(sum) / total;
					
				// Calcula la varianza
				var S2 = s.map(function(val){
					return (val.e[elemento] - media)*(val.e[elemento] - media);
				}).reduce(sum) / Math.max(1, total-1);
				
				// Se calcula el margen de error:
				var mE = t * Math.sqrt(S2/total);
					
				p[elemento] = media;
				c[elemento] = {Max: media + mE, Min: media - mE};
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
// Pero además valida que el número introducido sea un entero.
function isNumber(n) {
	return !isNaN(parseInt(n)) && isFinite(n) && parseInt(n) == parseFloat(n);
}

function isFloat(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}
