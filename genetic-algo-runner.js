const _ = require('lodash');
const { times, keyBy, pick, sampleSize, sumBy, mapValues } = require('lodash');
const uuid = require('uuid/v4');

const scorers = require('./data/scorers.json');
const defense = require('./data/defense.json');
const positionScores = require('./data/position-scores.json');

const { getRandomTeam, getRandomFormationMutation } = require('./random-team-utils');
const {
    getTeamPlayers,
    getTeamFormation,
    getTeamLineup,
    isPlayerInTeam
} = require('./team-utils');
const { getRandomInterpolation } = require('./utils');

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
    const teams = keyBy(
        times(NUM_GENERATION_TEAMS, () => getRandomTeam(playersByPositionAndPrice)),
        _ => uuid()
    );

    runGeneticAlgo(teams);
}

function runGeneticAlgo(teams) {
    const totalXps = _(teams)
        .mapValues(getTeamTotalXp)
        .entries()
        .orderBy(([, totalXp]) => totalXp, 'desc')
        .value();

    const topTeamIds = _(totalXps)
        .take(NUM_TEAMS_TOP_SELECTION)
        .map(([id]) => id)
        .value();

    topTeams = pick(teams, topTeamIds);

    mutateTeam(Object.values(topTeams)[0]);
}

function mutateTeam(team) {
    const teamFormation = getTeamFormation(team);
    const { in: inMutation, out: outMutation } = getRandomFormationMutation(teamFormation, MUTATION_SIZE);

    const teamLineUp = getTeamLineup(team);

    const outPlayers =
        _(inMutation)
            .entries()
            .flatMap(([pos, numPlayers]) => sampleSize(teamLineUp[pos], numPlayers))
            .value();

    const outPlayersPriceSum = sumBy(outPlayers, ({ Price }) => Number(Price));
    // TODO: use consts for min and max player price
    const inPlayersPrices =
        getRandomInterpolation(outPlayersPriceSum, outPlayers.length, 4, 15);

    const availablePlayers =
        mapValues(playersByPositionAndPrice, playersByPrice =>
            mapValues(playersByPrice, players => 
                players.filter(p => !isPlayerInTeam(team, p))
            )
        );

    // const inPlayers =
    //     _(outMutation)
    //         .entries()
    //         .flatMap(([pos, numPlayers]) => )

    const teamPlayers = getTeamPlayers(team);
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