const _ = require('lodash');
const { flatMap, take, range, sample, orderBy, takeRight, sumBy } = require('lodash');

const { budget } = require('./settings');
const { playersByPos } = require('./data-store');
const {
    formationOptions,
    findMutationBetweenFormations,
    teamByPlayers
} = require('./team-utils');
const { randomfillBuckets, sampleUpToSum2 } = require('./utils');

function getRandomTeam() {
    const formation = {
        "GK": 1,
        ...getRandomFormation()
    }
    const budgetByPos = getRandomBudgetByPos(formation);

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

function findSmallestVacantNumber(numbersSet, min, max) {
    for (let i = min; i < max; i++) {
        if (!numbersSet.has(i)) {
            return i;
        }
    }

    return -1;
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