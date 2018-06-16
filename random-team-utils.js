const _ = require('lodash');
const { mapValues, over, fill, identity, take, sample } = require('lodash');

const { topPlayersByPositionAndPrice } = require('./index');
const { formationOptions } = require('./team-utils');

const budget = 100;
const numPlayers = 10;
const avgPlayerBudget = budget / numPlayers;

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

// TODO: limit players by countries
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
    return sample(formationOptions);
}

function randomInRange(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
}

module.exports = {
    getRandomTeam
};