const _ = require('lodash');
const { times, keyBy, pick, sampleSize, sumBy, mapValues, intersectionWith } = require('lodash');
const uuid = require('uuid/v4');

const scorers = require('./data/scorers.json');
const defense = require('./data/defense.json');
const positionScores = require('./data/position-scores.json');

const { getRandomTeam, getRandomFormationMutation } = require('./random-team-utils');
const {
    getTeamPlayers,
    getTeamFormation,
    getTeamLineup,
    isPlayerInTeam,
    subtitutePlayers,
} = require('./team-utils');
const { getRandomInterpolation, sampleUpToSum } = require('./utils');

const NUM_GENERATION_TEAMS = 20;
const NUM_TEAMS_TOP_SELECTION = 5;
const MUTATION_SIZE = 2;
const TOP_PLAYERS_PER_POS_AND_PRICE = 7;

// calculate xp for each player
const playersWithXp = _(scorers)
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

    runGeneticAlgo(teams);
}

function runGeneticAlgo(teams) {
    const totalXps = _(teams)
        .map(team => ({ ...team, totalXp: getTeamTotalXp(team) }))
        .orderBy(({ totalXp }) => totalXp, 'desc')
        .value();

    const topTeamIds = _(totalXps)
        .take(NUM_TEAMS_TOP_SELECTION)
        .map(({ id }) => id)
        .value();

    topTeams = intersectionWith(teams, topTeamIds, (team, id) => team.id === id);
}

function mutateTeam(team) {
    const teamFormation = getTeamFormation(team);
    const { in: inMutation, out: outMutation } = getRandomFormationMutation(teamFormation, MUTATION_SIZE);

    const teamLineUp = getTeamLineup(team);

    const outPlayers =
        _(outMutation)
            .entries()
            .flatMap(([pos, numPlayers]) => sampleSize(teamLineUp[pos], numPlayers))
            .value();

    const outPlayersPriceSum = sumBy(outPlayers, ({ Price }) => Number(Price));

    const availablePlayers =
        mapValues(playersByPositionAndPrice, playersByPrice =>
            mapValues(playersByPrice, players =>
                players.filter(p => !isPlayerInTeam(team, p))
            )
        );

    const inPlayersSampleSettings = _(availablePlayers)
        .mapValues(playersByPrice => Object.keys(playersByPrice))
        .entries()
        .map(([pos, prices]) => ({ key: pos, arr: prices, numSamples: inMutation[pos] }))
        .filter(({ numSamples }) => numSamples > 0)
        .value();

    const inPlayersPrices =
        sampleUpToSum(inPlayersSampleSettings, outPlayersPriceSum);

    // SIDE EFFECT - removing player from available players
    const inPlayers = _(inPlayersPrices)
        .entries()
        .flatMap(([pos, prices]) => 
            prices.map(price =>
                availablePlayers[pos][price].shift()
            )
        )
        .value();

    const mutatedTeam = subtitutePlayers(team, outPlayers, inPlayers);
    return mutatedTeam;
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