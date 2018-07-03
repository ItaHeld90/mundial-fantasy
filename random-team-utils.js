const _ = require('lodash');
const { flatMap, take, sample, orderBy, takeRight, sumBy, zipObject, sampleSize, size, times, cloneDeep, countBy, mapValues, identity, groupBy } = require('lodash');

const { budget, NUM_LIMIT_BY_TEAM } = require('./settings');
const { players } = require('./data-store');
const {
    formationOptions,
    findMutationBetweenFormations,
    teamByPlayers
} = require('./team-utils');
const { randomFillBuckets, sampleUpToSum } = require('./utils');

function getRandomTeam() {
    const formation = {
        "GK": 1,
        ...getRandomFormation()
    }

    const playersLimitedByCountry = limitPlayersByCountry(formation, NUM_LIMIT_BY_TEAM, players);
    const availablePlayersByPos = groupPlayersByPos(playersLimitedByCountry);

    const budgetByPos = getRandomBudgetByPos(availablePlayersByPos, formation, budget);

    const teamPlayers =
        flatMap(["GK", "S", "M", "D"], pos =>
            getRandomPlayersByBudget(availablePlayersByPos[pos],
                formation[pos],
                budgetByPos[pos]
            )
        );

    return teamByPlayers(teamPlayers);
}

function limitPlayersByCountry(formation, limit, availablePlayers) {
    const countries =
        _(availablePlayers)
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

    const availablePlayersByCountryAndPos =
        groupPlayersByCountryAndPos(availablePlayers);

    // get number of players by country and position
    const numPlayersByCountryAndPos =
        mapValues(availablePlayersByCountryAndPos, playersByPos =>
            mapValues(playersByPos, players => players.length)
        )

    // creating a duplicate that will update as players are getting picked
    const numAvailablePlayersByCountryAndPos =
        cloneDeep(numPlayersByCountryAndPos);

    // fill the minimum players according to the foramtion (should always be possible)
    let numPlayersToPickByPosAndCountry =
        mapValues(formation, (numPlayers, pos) => {
            const countries = times(numPlayers, _ => {
                const country = countriesPool.shift();
                numAvailablePlayersByCountryAndPos[country][pos]--;
                return country;
            });

            return countBy(countries, identity);
        });

    // for each item in the pool
    for (country of countriesPool) {
        // pick an available position for this country
        const pos =
            _(numAvailablePlayersByCountryAndPos[country])
                .pickBy(numPlayers => numPlayers > 0)
                .keys()
                .sample();

        numAvailablePlayersByCountryAndPos[country][pos]--;

        // add country to the position bucket
        const currCount = numPlayersToPickByPosAndCountry[pos][country];
        const newCount =
            currCount != null
                ? currCount + 1
                : 1;

        numPlayersToPickByPosAndCountry[pos][country] = newCount;
    }

    const limitedByCountry = _(numPlayersToPickByPosAndCountry)
        .entries()
        .flatMap(([pos, numPlayersByCountry]) =>
            _(numPlayersByCountry)
                .entries()
                .flatMap(([country, numPlayers]) =>
                    sampleSize(
                        availablePlayersByCountryAndPos[country][pos],
                        numPlayers
                    )
                )
                .value()
        )
        .value();

    return limitedByCountry;
}

function groupPlayersByCountryAndPos(players) {
    const playersByCountry = groupPlayersByCountry(players);
    const playersByCountryAndPos =
        mapValues(playersByCountry, groupPlayersByPos);
    return playersByCountryAndPos;
}

function groupPlayersByPos(players) {
    return groupBy(players, player => player.Position);
}

function groupPlayersByCountry(players) {
    return groupBy(players, player => player.Team);
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