const _ = require('lodash');
const { mapValues, over, fill, identity, take } = require('lodash');

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
];

function getRandomTeam(playersByPositionAndPrice) {
    const formation = getRandomFormation();
    const budgetByPos = getRandomBudgetByPos(formation);

    let team = {};

    [team["S"], team["M"], team["D"]] =
        ["S", "M", "D"].map(pos =>
            getRandomPlayersByBudget(playersByPositionAndPrice[pos],
                formation[pos],
                budgetByPos[pos]
            )
        );

    return team;
}

function getRandomPlayersByBudget(playersByPrice, numPlayersToPick, budget) {
    const prices = Object.keys(playersByPrice);
    const [minPrice, maxPrice] = over([Math.min, Math.max])(...prices);

    const randomPrices = getRandomInterpolation(budget, numPlayersToPick, minPrice, maxPrice);

    const pickedPlayers = _(randomPrices)
        .countBy(identity)
        .entries()
        .flatMap(([price, numPlayers]) => take(playersByPrice[price], numPlayers))
        .value();

    return pickedPlayers;
}

function getRandomInterpolation(targetSum, numBuckets, minValue, maxValue) {
    let sourceAmount = targetSum - (numBuckets * minValue);
    const arr = fill(Array(numBuckets), minValue);

    while (sourceAmount > 0) {
        const idx = randomInRange(0, arr.length - 1);
        const numInstances = arr[idx];

        if (numInstances < maxValue) {
            arr[idx]++;
            sourceAmount--;
        }
    }

    return arr;
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
    return arr[idx];
}

function randomInRange(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
}

module.exports = {
    getRandomTeam
};