const _ = require('lodash');
const { flatMap, take, sample, orderBy, takeRight, sumBy, zipObject, sampleSize, intersection, times, cloneDeep, countBy, mapValues, identity, groupBy } = require('lodash');

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

    const playersLimitedByCountry = getAvailablePlayersLimitedByCountry(formation, NUM_LIMIT_BY_TEAM, players);
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

function getAvailablePlayersLimitedByCountry(formation, limit, availablePlayers) {
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

    return limitAvailablePlayersByCountry(
        limitByCountry,
        availablePlayers,
        formation
    );
}

function limitAvailablePlayersByCountry(limitByCountry, availablePlayers, formation) {
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

    // Init the players pick settings
    let numPlayersToPickByPosAndCountry = ["GK", "S", "M", "D"]
        .reduce((result, pos) => 
            ({ ...result, [pos]: {} })
            , {}
        );

    // for each item in the pool
    for (country of countriesPool) {
        const countryAvailablePositions =
            _(numAvailablePlayersByCountryAndPos[country])
                .pickBy(numPlayers => numPlayers > 0)
                .keys()
                .value();

        const mustFillPositions = _(formation)
            .keys()
            .filter(pos => {
                const filledSpots =
                    _(numPlayersToPickByPosAndCountry[pos])
                        .values()
                        .flatten()
                        .sum();

                return filledSpots < formation[pos];
            })
            .value();

        const availableMustFillPositions = intersection(countryAvailablePositions, mustFillPositions);

        const pos = availableMustFillPositions.length > 0
            ? sample(availableMustFillPositions)
            : sample(countryAvailablePositions);
            
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
    limitAvailablePlayersByCountry,
};