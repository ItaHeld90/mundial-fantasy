const { times, mapValues } = require('lodash');

const budget = 100;
const numPlayers = 10;
const avgPlayerBudget = budget / numPlayers;

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
    const budgetByPos = getRandomBudgetByPos(formation);

    console.log('formation:', formation, 'budgetByPos:', budgetByPos);
}

function getRandomBudgetByPos(formation) {
    // currently calculating random budget per position by
    // number of players times the average player's budget
    return mapValues(formation, numPlayers => numPlayers * Math.floor(avgPlayerBudget));
}

function getRandomFormation() {
    return randomInArray(formationOptions);
}

function randomInArray(arr) {
    const idx = randomInRange(0, arr.length - 1);
    console.log(idx);
    return arr[idx];
}

function randomInRange(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
}

module.exports = {
    getRandomTeam
};