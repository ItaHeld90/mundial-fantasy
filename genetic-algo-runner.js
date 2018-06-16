const _ = require('lodash');
const { times, keyBy, pick, sampleSize, sumBy } = require('lodash');
const uuid = require('uuid/v4');

const { getRandomTeam } = require('./random-team-utils');
const { getTeamPlayers, getTeamFormation, getTeamAvailablePositions } = require('./team-utils');
const { topPlayersByPositionAndPrice } = require('./index');

const NUM_GENERATION_TEAMS = 50;

function run(playersByPositionAndPrice) {
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
        .take(5)
        .map(([id]) => id)
        .value();
    
    topTeams = pick(teams, topTeamIds);

    mutateTeam(Object.values(topTeams)[0]);
}

function mutateTeam(team) {
    const teamPlayers = getTeamPlayers(team);
    const [teamPlayer1, teamPlayer2] = sampleSize(teamPlayers, 2);
    
    const teamFormation = getTeamFormation(team);
    const playersPriceSum = sumBy([teamPlayer1, teamPlayer2], player => player.Price);
    const [posTeamPlayer1, posTeamPlayer2] = [teamPlayer1, teamPlayer2]
        .map(({ Position }) => Position);

    const availablePositions = getTeamAvailablePositions(team);

    console.log(teamFormation);
    console.log(availablePositions);
}

function getTeamTotalXp(team) {
    return _(team)
        .values()
        .flatten()
        .map(({ xp }) => xp)
        .sum();
}

module.exports = {
    run
};