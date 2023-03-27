/**
 * @fileoverview The main js file containing the genetic algorithm
 * 
 * @author Greg Sveinbjornson
 * 
 */

NUM_SYMBOLS = 6;
NUM_FIELDS = 4;

SYMBOLS = ["A", "B", "C", "D", "E", "F"];

MUTATION_PROBABILITY	= 0.2;
PERMUTATION_PROBABILITY	= 0.1; 
INVERSION_PROBABILITY	= 0.05;

MAXGEN = 250;
POPULATION_SIZE = 150;
SET_SIZE = 110;
FIT_A = 1;
FIT_B = 2;

var allCodes = [];
variations(SYMBOLS, NUM_FIELDS, [], allCodes);

/**
 * Checks if a random number is less than or equal to probability
 * 
 * @param {*} probability 
 * @returns true if random number is less than or equal to probability
 */
function shouldDo(probability) {
	return (Math.random() <= probability) ? true : false;
}

/**
 * Gets the random value for crossover point
 * 
 * @param {*} length 
 * @returns a random number between 1 and length-2
 */
function getCrossoverPoint(length) {
	return Math.floor(Math.random() * (length - 2) + 1);
}

/**
 * Checks how often shouldDo returns true
 * 
 * @param {*} probability 
 * @param {*} toRepeat 
 * @returns ratio of true to false of shouldDo returns
 */
function check(probability, toRepeat) {
	var total = toRepeat;
	var count = 0;
	while(total--) {
		if(shouldDo(probability)) count++;
	}
	return (count / toRepeat).toFixed(2);
}

/**
 * Constructor for a combination
 * 
 * @param {*} code 
 */
function Combination(code) {
	this.code = _.isString(code) ? code.split('') : code;
	this.fitness = 0;
	this.eligible = false;
}

/**
 * Takes another Combination instance as input 
 * and performs a crossover operation between the 
 * two codes at a randomly chosen crossover point.
 * 
 * @param {*} other 
 * @returns array of two new combinations created by crossover
 */
Combination.prototype.crossover = function(other) {
	var crossoverPoint = getCrossoverPoint(this.code.length);
	var firstChild = this.code.slice(0, crossoverPoint).concat(other.code.slice(crossoverPoint));
	var secondChild = other.code.slice(0, crossoverPoint).concat(this.code.slice(crossoverPoint));
	return [new Combination(firstChild), new Combination(secondChild)];
};

/**
 * Mutates a random symbol in the code 
 * by replacing it with another randomly 
 * chosen symbol from the symbol set
 */
Combination.prototype.mutate = function() {
	var position = Math.floor(Math.random() * NUM_FIELDS);
	var newValue = _.sample(_.without(SYMBOLS, this.code[position]));
	this.code[position] = newValue;
};

/**
 * Swaps two random symbols in the code
 */
Combination.prototype.permutate = function() {
	var positions = _.range(NUM_FIELDS);
	var toPermute = _.sample(positions, 2);
	this.code[toPermute[1]] = [
		this.code[toPermute[0]],
		this.code[toPermute[0]] = this.code[toPermute[1]]
	][0];
}

/**
 * Reverses the order of the symbols in the code
 */
Combination.prototype.inverse = function () {
	this.code.reverse();
}

/**
 * Swaps the positions of two randomly chosen symbols in the code
 */
Combination.prototype.getCodeString = function() {
	return this.code.join('');
};

/**
 * Calculates the fitness of the code based on the:
 * 1. Number of correct symbols and positions (represented by variable xDifference), 
 * 2. Number of correct symbols but incorrect positions (represented by variable yDifference), 
 * 3. The index of the guess in the previous guesses array (represented by variable slickValue).
 * 
 * If the code is an exact match for the solution, sets the eligible property to true.
 * 
 * @param {*} prevGuesses 
 */
Combination.prototype.calculateFitness = function(prevGuesses) {
	var xDifference = 0;
	var yDifference = 0;
	var slickValue = 0;
	for(var i in prevGuesses) {
		var testResponse = testCode(this.code, prevGuesses[i].code);
		xDifference	+= Math.abs(testResponse[0] - prevGuesses[i].x);
		yDifference	+= Math.abs(testResponse[1] - prevGuesses[i].y);
		slickValue	+= parseInt(i);
	}
	if(xDifference === 0 && yDifference === 0) {
		this.eligible = true;
	}
	this.fitness = FIT_A * xDifference + yDifference + FIT_B * NUM_FIELDS * slickValue;
};

/**
 * Generates all possible combinations of the symbols up to 
 * the given depth and stores them in the results array
 * 
 * @param {*} symbols 
 * @param {*} depth 
 * @param {*} variation 
 * @param {*} results 
 */
function variations(symbols, depth, variation, results) {
	if(depth > 0) {
		for(var i = 0; i<symbols.length; i++) {
			var newBranch = variation.slice();
			newBranch.push(symbols[i]);
			variations(symbols, depth-1, newBranch, results)
		}
	} else {
		results.push(variation.join(''));
	}
}

/**
 * Constructor for the Mastermind game instance
 */
function Mastermind() {
	this.solution = [];
	this.newGame();
}

/**
 * Generates a new random code for the solution
 */
Mastermind.prototype.newGame = function() {
	for(var i=0; i<NUM_FIELDS; i++) {
		this.solution[i] = SYMBOLS[Math.floor(Math.random() * NUM_SYMBOLS)];
	}
};

/**
 * Takes a combination input and returns the number of correct colours and positions
 * compared to the solution of that round
 * 
 * @param {*} combination 
 * @returns number of correct symbols and positions, number of correct symbols but incorrect positions
 */
Mastermind.prototype.testCombination = function(combination) {
	return testCode(combination, this.solution);
}

/**
 * Takes a combination and solution input compares them
 * 
 * @param {*} combination 
 * @param {*} solution 
 * @returns number of correct symbols and positions, number of correct symbols but incorrect positions
 */
var testCode = function(combination, solution) {
	var a = 0;
	var b = 0;
	var marked = [0, 0, 0, 0];
	for(var i = 0; i<NUM_FIELDS; i++) {
		if(combination[i] == solution[i]) {
			a++;
			marked[i] = 1;
		}
	}
	for(var i = 0; i<NUM_FIELDS; i++) {
		if(combination[i] != solution[i]) {
			for(var j = 0; j<NUM_FIELDS; j++) {
				if(i != j && 0 == marked[j] && combination[i] == solution[j]) {
					b++;
					marked[j] = 1;
					break;
				}
			}
		}
	}	
	return [a, b];
}

/**
 * Constructor for the population of combinations
 * 
 * @param {*} size 
 */
function Population(size) {
	this.members = [];
	this.size = size;
	this.init();
}

/**
 * Generates a random sample of the possible combinations
 */
Population.prototype.init = function() {
	this.members = [];
	var randomSample = _.sample(allCodes, this.size);
	for(var i in randomSample) this.members.push(new Combination(randomSample[i]));
};

/**
 * Sorts the population by acsending order of fitness
 */
Population.prototype.sort = function() {
    this.members.sort(function(a, b) {
        return a.fitness - b.fitness;
    });
}

/**
 * Performs a single generation of the genetic algorithm
 * by calculating the fitness of each combination, sorting
 * the population, and then performing crossover,mutation and
 * inversion on them.
 * 
 * @param {*} prevGuesses 
 * @param {*} eiSet 
 * @param {*} maxGen 
 * @param {*} callback 
 * @returns a new combination
 */
Population.prototype.generation = function(prevGuesses, eiSet, maxGen, callback) {
	if(maxGen <= 0 || eiSet.length == SET_SIZE) {
		if(!(prevGuesses.length > 1 && eiSet.length < 1)) {
			callback();
			return;
		}
	}
	for(var i in this.members) {
		this.members[i].calculateFitness(prevGuesses);
		if(this.members[i].eligible) {
			var codeString = this.members[i].getCodeString();
			if(eiSet.indexOf(codeString) === -1) {
				eiSet.push(this.members[i].getCodeString());
			}
		}
	}
	this.sort();
	var lastIndex = this.members.length - 1;
	var nextGeneration = this.members[lastIndex].crossover(this.members[lastIndex - 1]);
	for(var i in nextGeneration) {
		if(shouldDo(MUTATION_PROBABILITY)) nextGeneration[i].mutate();
		if(shouldDo(PERMUTATION_PROBABILITY)) nextGeneration[i].permutate();
		if(shouldDo(INVERSION_PROBABILITY)) nextGeneration[i].inverse();
	}	
	this.members.splice(0, 2, nextGeneration[0], nextGeneration[1]);
	var uniqueCodes = _.chain(this.members).map(function(obj) { return obj.code.join('') }).uniq().value()
	var newMembers = _.sample(_.difference(allCodes, uniqueCodes), this.size - uniqueCodes.length);
	uniqueCodes = _.union(uniqueCodes, newMembers);
	this.members = uniqueCodes.map(function(e) {
		return new Combination(e);
	});
	var scope = this;
	var nextGen = maxGen - 1;
	setTimeout(function() {
		scope.generation(prevGuesses, eiSet, nextGen, callback);
	}, 5);
};

/**
 * Chooses the next guess based on the fitness of the population
 * 
 * @param {*} eligible 
 * @returns a code to guess
 */
function chooseNextGuess(eligible) {
	var max = 0;
	var nextGuess = eligible[0];
	for(var i in eligible) {
		var sum = 0;
		var searchSpace = _.without(eligible, eligible[i]);
		for(var j in searchSpace) {
			var testResponse = testCode(eligible[i].split(''), searchSpace[j].split(''));
			var remainingCodes = _.without(searchSpace, searchSpace[j]);
			for(var k in remainingCodes) {
				var subResponse = testCode(remainingCodes[k].split(''), searchSpace[j].split(''));
				if(testResponse.join('') != subResponse.join('')) {
					sum++;
				}
			}
		}
		if(sum > max) {
			max = sum;
			nextGuess = eligible[i];
		}
	}
	return nextGuess.split('');
}

/**
 * Displays the pegs for the previous guess
 * 
 * @param {*} code 
 * @returns true if the game is over and false otherwise
 */
function showPegs(code) {
    var testResponse = game.testCombination(code);
    var testTableSelector = $(".test-table-" + previousGuesses.length);
   	var td = 0;
   	for(; td < testResponse[0]; td++) {
   		testTableSelector
   			.find("#tcol-"+td)
   			.addClass("red-peg");
   	}
   	for(; td < testResponse[0] + testResponse[1]; td++) {
   		testTableSelector
   			.find("#tcol-"+td)
   			.addClass("yellow-peg");
   	}	
   	if(
   		(testResponse[0] == NUM_FIELDS) || 
   		(previousGuesses.length == 6) || 
   		(gameMode == GAME_MODE_1 && previousGuesses.length == 5)
   	) {
   		$("[class*='go-btn']").addClass('disabled');
		displayGameSolution();
		return true;
   	}
   	return false;
}

/**
 * Displays the guess of the AI
 * 
 * @param {*} code 
 */
function diplayGuess(code) {
	var rowSelector = $(".guess-row-" + previousGuesses.length);
    var i = 0;
    var fn = function(callback) {
		rowSelector
			.find(".sym-col:nth-child(" + (i + 1) + ")")
			.addClass('sym-bg')
			.hide()
			.addClass('sym-' + code[i])
			.fadeIn(280);
        if( ++i < code.length ){
            setTimeout(function() {
            	fn(callback)
            }, 280);
        } else {
        	callback();
        }
    };
    fn(function() {
	    if(gameMode == GAME_MODE_3) {
	    	showPegs(code);
		}
    });
}

var game, aiGuess, population, eligibleSet;
var gameMode, previousGuesses, playerCode;

GAME_MODE_1 = 1;
GAME_MODE_2 = 2;
GAME_MODE_3 = 3;

startNewGame();

/**
 * Starts a new game, depending on the selected game mode
 */
function startNewGame() {
	initGameVariables();
	cleanUpPlayground();
	if(gameMode != GAME_MODE_1) {
		diplayGuess(aiGuess);
	
		if (gameMode == GAME_MODE_2) {
			alert("Pick a secret code and remember it. The AI has to guess your code.",
			 		"Make sure to give the correct response to the AI's guess.");
		}
	} else {
		$(".go-btn-5").show();
	}
}

/**
 * Initializes the game variables
 */
function initGameVariables() {
	game = new Mastermind();
	aiGuess = _.sample(allCodes);
	population = new Population(POPULATION_SIZE);
	eligibleSet = [];
	gameMode = parseInt($("#mode-select").val());
	playerCode = [0,0,0,0];
	previousGuesses = [];
	console.log(game.solution);
}

/**
 * Gets the number from a class attribute
 * 
 * @param {*} classAttr 
 * @param {*} prefix 
 * @returns number from the class attribute
 */
function getNumberFromClass(classAttr, prefix) {
	var startIndex = classAttr.indexOf(prefix);
	if(startIndex != -1) {
		return parseInt(classAttr.charAt(startIndex + prefix.length));
	}
	return NaN;
}

/**
 * Clears the UI
 */
function cleanUpPlayground() {
	$("[class*='go-btn']")
		.addClass('disabled')
		.show();
	$(".go-btn-0")
		.removeClass('disabled');
	$(".sym-col").each(function() {
		if(!$(this).is("[class*='secret-block']")) {
			var prefix = "block-";
			var blockNumber = getNumberFromClass($(this).attr('class'), prefix);
			$(this).attr("class", "sym-col " + prefix + blockNumber);
		}
	});
	$(".test-col")
		.removeClass('red-peg')
		.removeClass('yellow-peg');
	$(".thinking-col img").hide();
	clearSolutionBoxes();
}

$(".new-game").click(function() {
	startNewGame();
});

/**
 * Checkes if the AI has won the game, and if not, it plays the next guess
 * 
 * @param {*} blackNum 
 * @param {*} whiteNum  
 */
function playNextGuess(blackNum, whiteNum) {
	console.log(blackNum, whiteNum);
	previousGuesses.push({code: aiGuess, x : blackNum, y : whiteNum});
	if(blackNum == NUM_FIELDS) { 
		alert("Win!"); 
		return; 
	}
 	eligibleSet = [];

 	population.generation(previousGuesses, eligibleSet, MAXGEN, function() {
		if(eligibleSet.length > 0) {
			aiGuess = chooseNextGuess(eligibleSet);
			diplayGuess(aiGuess);
			$("#thinking-" + (previousGuesses.length-1)).hide();
			$(".go-btn-" + previousGuesses.length).removeClass("disabled");
		} else {
			alert("Lose!");
		}
		$("#thinking").hide();
 	});
}

$(".test-col").click(function() {
	if(gameMode == GAME_MODE_2) {
		if($(this).hasClass("red-peg")) {

			$(this).removeClass("red-peg");

		} else if($(this).hasClass("yellow-peg")) {

			$(this).removeClass("yellow-peg");
			$(this).addClass("red-peg");

		} else {

			$(this).addClass("yellow-peg");

		}
	}
});

/**
 * Checks how correct the AI's guess was
 * 
 * @returns the number of red and yellow pegs
 */
function countTestResponse() {
	var red = 0, yellow = 0;
	var responseSelector = $(".test-table-" + previousGuesses.length + " td");
	responseSelector.each(function() {
		var that = $(this);
		if(that.hasClass("red-peg")) {
			red++;
		} else if(that.hasClass("yellow-peg")) {
			yellow++;
		}
	});
	return {a:red, b:yellow};
}

/**
 * Displays the correct code
 */
function displayGameSolution() {
	for(var i in game.solution) {
		var fieldSelect = $(".secret-block-" + i);
		
		if (game.solution[i] == playerCode[i] || gameMode == GAME_MODE_3) {
			fieldSelect
				.removeClass('secret-sym')
				.removeClass('secret-block-lose')
				.addClass('secret-block-win')
				.addClass('sym-' + game.solution[i]);
		} else {
			fieldSelect
				.removeClass('secret-sym')
				.removeClass('secret-block-win')
				.addClass('secret-block-lose')
				.addClass('sym-' + game.solution[i]);
		}
	}
}

/**
 * Clears the solution boxes
 */
function clearSolutionBoxes() {
	$("[class*='secret-block']").each(function() {
		var newClass = $(this).attr('class').split(' ').slice(0,2).join(' ') + " secret-sym";
		$(this).attr('class', newClass);
	});
}

$("[class*='go-btn']").click(function() {
	if(gameMode != GAME_MODE_1) {
		var response = countTestResponse();
		$(this).hide();
		$("#thinking-" + previousGuesses.length).show();
		playNextGuess(response.a, response.b);
	} else {
		if(playerCode.indexOf(0) == -1) {
			var over = showPegs(playerCode);
			$(this).hide();
			previousGuesses.push(playerCode);
			playerCode = [0,0,0,0];
			if(!over) {
				$(".go-btn-" + previousGuesses.length).removeClass('disabled');
			}
		}
	}
});

$("[class^='option-col']").click(function() {
	if(gameMode == GAME_MODE_1) {
		var symbolClass = $(this).attr('class').split(' ')[1];
		var firstPosition = playerCode.indexOf(0);
		if(firstPosition != -1) {
			$(".guess-row-" + previousGuesses.length)
				.find(".sym-col:nth-child(" + (firstPosition+1) + ")")
				.addClass('sym-bg')
				.hide()
				.addClass(symbolClass)
				.fadeIn(200);
				var symbolValue = symbolClass.substr(4, 1);
				playerCode[firstPosition] = symbolValue;
		}
	}
});

$(".sym-col").click(function() {
	if(gameMode == GAME_MODE_1) {
		var blockNumber = getNumberFromClass($(this).attr("class"), "block-");
		playerCode[blockNumber] = 0;
		$(this).attr("class", "sym-col block-" + blockNumber);
	}
});