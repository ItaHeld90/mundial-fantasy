const _ = require('lodash');
const { times, keyBy, pick } = require('lodash');
const uuid = require('uuid/v4');
const { getRandomTeam } = require('./random-team-utils');

function run(topPlayersByPositionAndPrice) {
    const teams = keyBy(
        times(50, () => getRandomTeam(topPlayersByPositionAndPrice)),
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