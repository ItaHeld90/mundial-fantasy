const _ = require('lodash');
const { times, keyBy, pick, sampleSize, sumBy } = require('lodash');
const uuid = require('uuid/v4');

const { getRandomTeam, getRandomFormationMutation } = require('./random-team-utils');
const { getTeamPlayers, getTeamFormation, getTeamLineup } = require('./team-utils');
const { topPlayersByPositionAndPrice } = require('./index');

const NUM_GENERATION_TEAMS = 50;
const MUTATION_SIZE = 2;

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
    const teamFormation = getTeamFormation(team);
    const { in: inMutation, out: outMutation } = getRandomFormationMutation(teamFormation, MUTATION_SIZE);

    const teamLineUp = getTeamLineup(team);

    const outPlayers =
        _(teamLineUp)
            .entries()
            .flatMap(([pos, players]) => sampleSize(players, outMutation[pos]))
            .value();

    const teamPlayers = getTeamPlayers(team);
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