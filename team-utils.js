const _ = require('lodash');

const formationOptions = [
    { "D": 5, "M": 4, "S": 1 },
    { "D": 5, "M": 3, "S": 2 },
    { "D": 4, "M": 5, "S": 1 },
    { "D": 4, "M": 4, "S": 2 },
    { "D": 4, "M": 3, "S": 3 },
    { "D": 3, "M": 5, "S": 2 },
    { "D": 3, "M": 4, "S": 3 },
];

function getTeamPlayers(team) {
    return _(team)
        .pick(["S", "M", "D"])
        .values()
        .flatten()
        .value();
}

function getTeamFormation(team) {
    return _(team)
        .pick(["S", "M", "D"])
        .mapValues(players => players.length)
        .value();
}

function getTeamAvailablePositions(team) {
    const teamFormation = getTeamFormation(team);

    return _(teamFormation)
        .pickBy((numPlayers, pos) => numPlayers < getMaxPlayerForPos(pos))
        .keys()
        .value();
}

function getMaxPlayerForPos(pos) {
    return _(formationOptions)
        .map(formation => formation[pos])
        .max()
}

module.exports = {
    formationOptions,
    getTeamPlayers,
    getTeamFormation,
    getTeamAvailablePositions
};