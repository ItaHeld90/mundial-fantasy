const budget = 100;
const numPlayers = 10;

const rangeStrikers = {
    min: 1,
    max: 3
};

const rangeMiddleFielders = {
    min: 3,
    max: 5
};

const rangeDefenders = {
    min: 3,
    max: 5
};

function getRandomTeam(playersByPriceAndPosition) { 
    const formation = getRandomFormation();
}

function getRandomFormation() {
    const numStrikers = randomInRange(rangeStrikers);
    const numMiddleFielders = randomInRange(rangeMiddleFielders);
    const numDefenders = numPlayers - (numStrikers + numMiddleFielders);

    return {
        numStrikers,
        numMiddleFielders,
        numDefenders
    };
}

function randomByPosition(range) {}

function randomInRange({min, max}) {
    return min + Math.floor(Math.random() * (max - min + 1));
}