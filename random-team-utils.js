const { times } = require('lodash');

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

const formationOptions = [
    { "D": 5, "M": 4, "S": 1 },
    { "D": 5, "M": 3, "S": 2 },
    { "D": 4, "M": 5, "S": 1 },
    { "D": 4, "M": 4, "S": 2 },
    { "D": 4, "M": 3, "S": 3 },
    { "D": 3, "M": 5, "S": 2 },
    { "D": 3, "M": 4, "S": 3 },
    { "D": 3, "M": 3, "S": 4 },
];

function getRandomTeam(playersByPriceAndPosition) {
    const formation = getRandomFormation();
}

function getRandomFormation() {
    return randomInArray(formationOptions);
}

function randomInArray(arr) {
    const idx = randomInRange(0, arr.length - 1);
    return arr[idx];
}

function randomInRange({ min, max }) {
    return min + Math.floor(Math.random() * (max - min + 1));
}