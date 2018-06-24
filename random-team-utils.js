const _ = require('lodash');
const { mapValues, over, flatMap, identity, take, sample } = require('lodash');

const { budget, numPlayers } = require('./settings'); 
const {
    formationOptions,
    findMutationBetweenFormations,
    teamByPlayers
} = require('./team-utils');
const { getRandomInterpolation } = require('./utils');

const avgPlayerBudget = budget / numPlayers;

function getRandomTeam(playersByPositionAndPrice) {
    const formation = {
        "GK": 1,
        ...getRandomFormation()
    }
    const budgetByPos = getRandomBudgetByPos(formation);

    const teamPlayers =
        flatMap(["GK", "S", "M", "D"], pos =>
            getRandomPlayersByBudget(playersByPositionAndPrice[pos],
                formation[pos],
                budgetByPos[pos]
            )
        );

    return teamByPlayers(teamPlayers);
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

function getRandomBudgetByPos(formation) {
    // currently calculating random budget per position by
    // number of players times the average player's budget
    return mapValues(formation, numPlayers => numPlayers * Math.floor(avgPlayerBudget));
}

function getRandomFormation() {
    return sample(formationOptions);
}

function getRandomFormationMutation(formation, mutationSize) {
    const newFormation = getRandomFormation();
    return findMutationBetweenFormations(formation, newFormation, mutationSize);
}

module.exports = {
    getRandomTeam,
    getRandomFormation,
    getRandomFormationMutation
};