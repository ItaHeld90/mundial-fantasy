const _ = require('lodash');
const { times, head } = require('lodash');
const { getRandomTeam } = require('./random-team-utils');

function run(topPlayersByPositionAndPrice) {
    const teams = times(50, () => getRandomTeam(topPlayersByPositionAndPrice));

    const totalXps = _(teams)
        .map(team => ({
            ...team,
            totalXp: getTeamTotalXp(team)
        }))
        .orderBy(({ totalXp }) => totalXp, 'desc')
        .value();

    console.log(totalXps);
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