const _ = require('lodash');
const { flatMap, take, sample, orderBy, takeRight, sumBy, zipObject, sampleSize, size, times } = require('lodash');

const { budget, NUM_LIMIT_BY_TEAM } = require('./settings');
const { players } = require('./data-store');
const {
    formationOptions,
    findMutationBetweenFormations,
    teamByPlayers
} = require('./team-utils');
const { randomFillBuckets, sampleUpToSum } = require('./utils');

function getRandomTeam() {
    // const limitedPlayersByPos = _(players)
    //     .groupBy(player => player.Team)
    //     .mapValues(players => sampleSize(players, NUM_LIMIT_BY_TEAM))
    //     .values()
    //     .flatten()
    //     .groupBy(player => player.Position)
    //     .value();

    const formation = {
        "GK": 1,
        ...getRandomFormation()
    }

    const limited = limitPlayersByCountry(formation, NUM_LIMIT_BY_TEAM);

    const budgetByPos = getRandomBudgetByPos(limitedPlayersByPos, formation, budget);

    const teamPlayers =
        flatMap(["GK", "S", "M", "D"], pos =>
            getRandomPlayersByBudget(limitedPlayersByPos[pos],
                formation[pos],
                budgetByPos[pos]
            )
        );

    return teamByPlayers(teamPlayers);
}

function limitPlayersByCountry(formation, limit) {
    const countries =
        _(players)
            .map(player => player.Team)
            .uniq()
            .value();

    // create a list of limits per country
    const limitByCountry =
        zipObject(
            countries,
            times(countries.length, _ => limit)
        );

    // create a pool of countries
    const countriesPool =
        _(limitByCountry)
            .entries()
            .flatMap(([country, limit]) => times(limit, _ => country))
            .shuffle()
            .value();

    // get number of players by country and position
    numPlayersByCountryAndPosition = _(players)
        .groupBy(player => player.Team)
        .mapValues(players =>
            _(players)
                .groupBy(player => player.Position)
                .mapValues(size)
                .value()
        )
        .value();

    // fill the minimum players according to the foramtion (should always be possible)
    // for each item in the pool
    // take the item out of the pool
    // pick an available position for this country
    // add country to the position bucket
}

// TODO: limit players by countries
function getRandomPlayersByBudget(players, numPlayersToPick, budget) {
    const descSortedPlayers = orderBy(players, player => player.Price, 'desc');
    const descSortedPrices = descSortedPlayers.map(player => player.Price);
    const pointers = sampleUpToSum(descSortedPrices, numPlayersToPick, budget);

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