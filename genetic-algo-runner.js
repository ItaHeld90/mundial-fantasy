const _ = require('lodash');
const { times, sum, sampleSize, sumBy, mapValues, intersectionWith, flatMap, take } = require('lodash');
const util = require('util');

const {
    budget: totalBudget,
    NUM_GENERATIONS,
    NUM_GENERATION_TEAMS,
    NUM_TEAMS_TOP_SELECTION,
    NUM_OF_MUTATIONS,
    MUTATION_SIZE,
} = require('./settings');

const { playersByPositionAndPrice } = require('./data-store');
const { getRandomTeam, getRandomFormationMutation } = require('./random-team-utils');
const { getTeamFormation, getTeamLineup, isPlayerInTeam, subtitutePlayers, getTeamWorth } = require('./team-utils');
const { sampleUpToSum, monteCarloRandom } = require('./utils');

function run() {
    const teams = times(NUM_GENERATION_TEAMS, () => getRandomTeam(playersByPositionAndPrice));

    const topTeams = runGeneticAlgo(teams, 1);

    // Print results
    const results = _(topTeams)
        .take(10)
        .map(team => ({
            names: _(getTeamLineup(team))
                .mapValues(players => players.map(player => player.Name))
                .value(),

            totalXp: team.totalXp,
            totalPrice: getTeamWorth(team),
        }))
        .value();

    results.forEach(team => console.log(util.inspect(team, false, null)));
}

function runGeneticAlgo(teams, generationCount) {
    const totalXps = _(teams)
        .map(team => ({ ...team, totalXp: getTeamTotalXp(team) }))
        .orderBy(({ totalXp }) => totalXp, 'desc')
        .value();

    // if the genetic cycle is done - return the teams ordered by total xp
    if (generationCount > NUM_GENERATIONS) {
        return totalXps;
    }

    // get the top teams
    const topTeamIds = _(totalXps)
        .take(NUM_TEAMS_TOP_SELECTION)
        .map(({ id }) => id)
        .value();

    topTeams = intersectionWith(teams, topTeamIds, (team, id) => team.id === id);

    // perform mutations
    const topTeamsMutations = flatMap(topTeams, team => times(NUM_OF_MUTATIONS, _ => mutateTeam(team)));

    // continue to the next generation with the newly created teams
    const nextTeams = [...topTeams, ...topTeamsMutations];
    return runGeneticAlgo(nextTeams, ++generationCount);
}

function mutateTeam(team) {
    const teamFormation = getTeamFormation(team);
    const { in: inMutation, out: outMutation } = getRandomFormationMutation(teamFormation, MUTATION_SIZE);

    const teamLineUp = getTeamLineup(team);

    // get random players to take out of the team
    const outPlayers = _(outMutation)
        .entries()
        .flatMap(([pos, numPlayers]) => sampleSize(teamLineUp[pos], numPlayers))
        .value();

    const outPlayersPriceSum = sumBy(outPlayers, ({ Price }) => Number(Price));

    // calculate in players budget
    const teamWorth = getTeamWorth(team) - outPlayersPriceSum;
    const numInPlayers = sum(Object.values(inMutation));
    const inPlayersBudget = getInPlayersBudget(numInPlayers, teamWorth, totalBudget);

    // calculate in players prices
    const availablePlayers = mapValues(playersByPositionAndPrice, playersByPrice =>
        _(playersByPrice)
            .mapValues(players => players.filter(p => !isPlayerInTeam(team, p)))
            .pickBy(players => players.length > 0)
            .value()
    );

    const inPlayersSampleSettings = _(availablePlayers)
        // getting all the players prices in a numeric form
        .mapValues(playersByPrice => Object.keys(playersByPrice).map(price => Number(price)))
        .entries()
        .map(([pos, prices]) => ({ key: pos, arr: prices, numSamples: inMutation[pos] }))
        .filter(({ numSamples }) => numSamples > 0)
        .value();

    const inPlayersPrices = sampleUpToSum(inPlayersSampleSettings, inPlayersBudget);

    let inPlayers = [];

    const inPlayersPosPricePairs = _(inPlayersPrices)
        .entries()
        .flatMap(([pos, prices]) =>
            prices.map(price => [pos, price])
        )
        .value();

    // for every position and price pair find an available player to enter the team
    for (let [pos, price] of inPlayersPosPricePairs) {
        const player = availablePlayers[pos][price].shift();

        // if no player fits the description - try the entire mutation again
        if (!player) {
            return mutateTeam(team);
        }

        inPlayers.push(player);
    }

    // perform subtitution and return the newly created team
    const mutatedTeam = subtitutePlayers(team, outPlayers, inPlayers);
    return mutatedTeam;
}

function getInPlayersBudget(numInPlayers, teamWorth, totalBudget) {
    const inPlayersMinBudget = numInPlayers * 6; // TODO: calculate real min budget
    const spareBudget = totalBudget - teamWorth;

    // adding 1 to the spare budget to include the upper bound for the monte carlo
    return monteCarloRandom(inPlayersMinBudget, spareBudget, num => Math.pow(num, 2));
}

function getTeamTotalXp(team) {
    return _(team)
        .values()
        .flatten()
        .map(({ xp }) => xp)
        .sum();
}

module.exports = {
    run,
};
