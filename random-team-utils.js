const _ = require('lodash');
const { flatMap, take, range, sample, orderBy, takeRight, sumBy } = require('lodash');

const { budget } = require('./settings');
const { playersByPos } = require('./data-store');
const {
    formationOptions,
    findMutationBetweenFormations,
    teamByPlayers
} = require('./team-utils');
const { randomFillBuckets, sampleUpToSum2 } = require('./utils');

function getRandomTeam() {
    const formation = {
        "GK": 1,
        ...getRandomFormation()
    }
    const budgetByPos = getRandomBudgetByPos(playersByPos, formation, budget);

    const teamPlayers =
        flatMap(["GK", "S", "M", "D"], pos =>
            getRandomPlayersByBudget(playersByPos[pos],
                formation[pos],
                budgetByPos[pos]
            )
        );

    return teamByPlayers(teamPlayers);
}

// TODO: limit players by countries
function getRandomPlayersByBudget(players, numPlayersToPick, budget) {
    const descSortedPlayers = orderBy(players, player => player.Price, 'desc');
    const descSortedPrices = descSortedPlayers.map(player => player.Price);
    const pointers = sampleUpToSum2(descSortedPrices, numPlayersToPick, budget);

    return pointers.map(pointer => descSortedPlayers[pointer]);
}

function getRandomBudgetByPos(availablePlayersByPos, formation, totalBudget) {
    const budgetRangePerPos = _(availablePlayersByPos)
        .mapValues(players => orderBy(players, player => player.Price, 'asc'))
        .entries()
        .filter(([pos]) => formation[pos] > 0)
        .map(([pos, players]) => {
            const numPlayers = formation[pos];
            return {
                key: pos,
                ...getPlayersTotalCostRange(players, numPlayers),
            };
        })
        .value();

    const budgetByPos = randomFillBuckets(totalBudget, budgetRangePerPos);
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
    getRandomFormationMutation,
    getRandomPlayersByBudget,
    getRandomBudgetByPos,
};