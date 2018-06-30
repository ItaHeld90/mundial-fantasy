const _ = require('lodash');
const { times, orderBy, sampleSize, sumBy, mapValues, intersectionWith, flatMap, take } = require('lodash');
const util = require('util');

const {
    budget: totalBudget,
    NUM_GENERATIONS,
    NUM_GENERATION_TEAMS,
    NUM_TEAMS_TOP_SELECTION,
    NUM_OF_MUTATIONS,
    MUTATION_SIZE,
} = require('./settings');

const { playersByPositionAndPrice, playersByPos } = require('./data-store');
const { getRandomTeam, getRandomFormationMutation, getRandomBudgetByPos, getRandomPlayersByBudget } = require('./random-team-utils');
const { getTeamFormation, getTeamLineup, isPlayerInTeam, subtitutePlayers, getTeamWorth } = require('./team-utils');
const { monteCarloRandom } = require('./utils');

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

    // calculate in players prices
    const availablePlayersByPos = _(playersByPos)
        .mapValues(players =>
            players.filter(p => !isPlayerInTeam(team, p))
        )
        .pickBy(players => players.length > 0)
        .value();

    // calculate in players budget
    const teamWorth = getTeamWorth(team) - outPlayersPriceSum;
    const inPlayersBudget = getInPlayersBudget(inMutation, availablePlayersByPos, teamWorth, totalBudget);
    const inPlayersBudgetByPos = 
        getRandomBudgetByPos(availablePlayersByPos, inMutation, inPlayersBudget);
    
    // get random in players according to the players budget
    const inPlayers = _(inPlayersBudgetByPos)
        .entries()
        .flatMap(([pos, posBudget]) =>
            getRandomPlayersByBudget(
                availablePlayersByPos[pos],
                inMutation[pos],
                posBudget
            )
        )
        .value();

    // perform subtitution and return the newly created team
    const mutatedTeam = subtitutePlayers(team, outPlayers, inPlayers);
    return mutatedTeam;
}

function getInPlayersBudget(inMutation, availablePlayersByPos, teamWorth, totalBudget) {
    // get all the players prices per position
    const playersPricesByPos = mapValues(availablePlayersByPos, players =>
        _(players)
            .orderBy(player => player.Price, 'asc')
            .map(player => player.Price)
            .value()
    );

    // the min budget is calculated by the sum of the most cheap
    // combination of available players and the given mutation
    const minBudget = _(inMutation)
        .entries()
        .flatMap(([pos, numMutations]) => take(playersPricesByPos[pos], numMutations))
        .sum();

    // the max budget is the spare budget
    const maxBudget = totalBudget - teamWorth;

    // adding 1 to the spare budget to include the upper bound for the monte carlo
    return Math.floor(
        monteCarloRandom(minBudget, maxBudget, num => Math.pow(num, 2))
    );
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
