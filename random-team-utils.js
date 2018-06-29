const _ = require('lodash');
const { mapValues, over, flatMap, identity, take, sample, orderBy, takeRight, sumBy } = require('lodash');

const { budget, numPlayers } = require('./settings');
const { playersByPositionAndPrice, playersByPos } = require('./data-store');
const {
    formationOptions,
    findMutationBetweenFormations,
    teamByPlayers
} = require('./team-utils');
const { getRandomInterpolation, randomfillBuckets } = require('./utils');

function getRandomTeam() {
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
    const budgetRangePerPos = _(playersByPos)
        .mapValues(players => orderBy(players, player => player.Price, 'asc'))
        .entries()
        .map(([pos, players]) => {
            const numPlayers = formation[pos];
            return {
                key: pos,
                ...getPlayersTotalCostRange(players, numPlayers),
            };
        })
        .value();

    budgetByPos = randomfillBuckets(budget, budgetRangePerPos);
    return budgetByPos;
}

function getPlayersTotalCostRange(players, numPlayers) {
    const minPlayers = take(players, numPlayers);
    const maxPlayers = takeRight(players, numPlayers);

    return {
        min: sumBy(minPlayers, player => player.Price),
        max: sumBy(maxPlayers, player => player.Price)
    };
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