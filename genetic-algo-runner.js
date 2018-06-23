const _ = require('lodash');
const { times, sum, sampleSize, sumBy, mapValues, intersectionWith, flatMap } = require('lodash');

const period = 1;
const dataRootPath = './data/';
const rootPath = `${dataRootPath}/period ${period}/`;

const scorers = require(`${rootPath}/scorers.json`);
const defense = require(`${rootPath}/defense.json`);
const positionScores = require(`${dataRootPath}/position-scores.json`);

const { getRandomTeam, getRandomFormationMutation } = require('./random-team-utils');
const {
    getTeamFormation,
    getTeamLineup,
    isPlayerInTeam,
    subtitutePlayers,
    getTeamWorth,
} = require('./team-utils');
const { sampleUpToSum, monteCarloRandom } = require('./utils');

const NUM_GENERATIONS = 1000;
const NUM_GENERATION_TEAMS = 12;
const NUM_TEAMS_TOP_SELECTION = 3;
const NUM_OF_MUTATIONS = Math.floor(NUM_GENERATION_TEAMS / NUM_TEAMS_TOP_SELECTION) - 1;
const MUTATION_SIZE = 2;

const TOP_PLAYERS_PER_POS_AND_PRICE = 7;

// normalizing the players prices
const normalizedScorers =
    scorers.map(player => ({
        ...player,
        Price: Math.round(Number(player.Price))
    }));

// calculate xp for each player
const playersWithXp = _(normalizedScorers)
    .filter(player => player.Position && player.Price && player.Price !== "NA")
    .map(player => ({
        ...player,
        xp: calcPlayerXP(player)
    }))
    .value();

const playersByPositionAndPrice = _(playersWithXp)
    .groupBy(({ Position }) => Position)
    .mapValues(topPlayersByPrice)
    .value();

function run() {
    const teams =
        times(NUM_GENERATION_TEAMS, () => getRandomTeam(playersByPositionAndPrice));

    const topTeams = runGeneticAlgo(teams, 1);
    console.log(topTeams[0]);
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
    const topTeamsMutations =
        flatMap(topTeams, team => times(NUM_OF_MUTATIONS, _ => mutateTeam(team)));

    // continue to the next generation with the newly created teams
    const nextTeams = [...topTeams, ...topTeamsMutations];
    return runGeneticAlgo(nextTeams, ++generationCount);
}

function mutateTeam(team) {
    const teamFormation = getTeamFormation(team);
    const { in: inMutation, out: outMutation } = getRandomFormationMutation(teamFormation, MUTATION_SIZE);

    const teamLineUp = getTeamLineup(team);

    // get random players to take out of the team
    const outPlayers =
        _(outMutation)
            .entries()
            .flatMap(([pos, numPlayers]) => sampleSize(teamLineUp[pos], numPlayers))
            .value();

    const outPlayersPriceSum = sumBy(outPlayers, ({ Price }) => Number(Price));

    // calculate in players budget
    const teamWorth = getTeamWorth(team) - outPlayersPriceSum;
    const numInPlayers = sum(Object.values(inMutation));
    const inPlayersBudget = getInPlayersBudget(numInPlayers, teamWorth, 100); // TODO: send real budget

    // calculate in players prices
    const availablePlayers =
        mapValues(playersByPositionAndPrice, playersByPrice =>
            _(playersByPrice)
                .mapValues(players =>
                    players.filter(p => !isPlayerInTeam(team, p))
                )
                .pickBy(players => players.length > 0)
                .value()
        );

    const inPlayersSampleSettings = _(availablePlayers)
        // getting all the players prices in a numeric form
        .mapValues(playersByPrice =>
            Object.keys(playersByPrice)
                .map(price => Number(price))
        )
        .entries()
        .map(([pos, prices]) => ({ key: pos, arr: prices, numSamples: inMutation[pos] }))
        .filter(({ numSamples }) => numSamples > 0)
        .value();

    const inPlayersPrices = sampleUpToSum(inPlayersSampleSettings, inPlayersBudget);

    // get the players to join the team
    const inPlayers = _(inPlayersPrices)
        .entries()
        .flatMap(([pos, prices]) =>
            prices.map(price =>
                // SIDE EFFECT - removing player from available players
                availablePlayers[pos][price].shift()
            )
        )
        .value();

    // perform subtitution and return the newly created team
    const mutatedTeam = subtitutePlayers(team, outPlayers, inPlayers);
    return mutatedTeam;
}

function getInPlayersBudget(numInPlayers, teamWorth, totalBudget) {
    const inPlayersMinBudget = numInPlayers * 6; // TODO: calculate real min budget
    const spareBudget = totalBudget - teamWorth;
    return monteCarloRandom(inPlayersMinBudget, spareBudget, num => Math.pow(num, 2));
}

function getTeamTotalXp(team) {
    return _(team)
        .values()
        .flatten()
        .map(({ xp }) => xp)
        .sum();
}

function topPlayersByPrice(players) {
    return _(players)
        .groupBy(({ Price }) => Price)
        .pickBy(players => players.length > 0)
        .mapValues(players => takeTopPlayers(players, TOP_PLAYERS_PER_POS_AND_PRICE))
        .value();
}

function takeTopPlayers(players, numTop) {
    return _(players)
        .orderBy(({ xp }) => xp, 'desc')
        .take(numTop)
        .value();
}

function calcPlayerXP(player) {
    const { Price: price, Position: position, Team: team, Anytime: goalOdds } = player;
    const getPlayerScoreByAchievement = getPlayerScore(position);

    const goalScore = getPlayerScoreByAchievement('Goal');

    const cleanSheetOdds = defense.find(country => country.Name === team)['Clean sheet'];
    const cleanSheetScore = getPlayerScoreByAchievement('Clean');

    const assistOdds = goalOdds;
    const assistScore = getPlayerScoreByAchievement('Assist');

    return (
        (goalScore * 1.2 / goalOdds) +
        (assistScore * 1.2 / assistOdds) +
        (cleanSheetScore / cleanSheetOdds)
    );
}

function getPlayerScore(playerPosition) {
    return playerAchievement =>
        positionScores
            .find(({ position, achievement }) => (
                position === playerPosition &&
                achievement === playerAchievement
            ))
            .score
}

module.exports = {
    run
};