const _ = require('lodash');
const { subtract, pick, mapValues, assignWith, add, values } = require('lodash');
const { getRandomInterpolation } = require('./utils');

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

function getTeamLineup(team) {
    return pick(team, ["S", "M", "D"]);
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

function findMutationBetweenFormations(oldFormation, newFormation, mutationSize) {
    // calculate the visible mutation between the 2 formations
    const visibleMutation = assignWith({}, newFormation, oldFormation, subtract);
    const diffPosInMutation = mapValues(visibleMutation, delta => Math.max(delta, 0));
    const diffPosOutMutation = mapValues(visibleMutation, delta => Math.abs(Math.min(delta, 0)));

    // calculate visible mutation size between the 2 formations
    const visibleMutationSize = values(diffPosInMutation)
        ? _(diffPosInMutation)
            .values()
            .flatten()
            .sum()
        : 0;

    mutationGapTofill = mutationSize - visibleMutationSize;

    // calculate the mutation caused by mutating for the same position 
    let samePosMutation = {};
    [
        samePosMutation["S"],
        samePosMutation["M"],
        samePosMutation["D"]
    ] = getRandomInterpolation(mutationGapTofill, 3, 0, Infinity);

    // calculate the final mutation
    const [inMutation, outMutation] =
        _([diffPosInMutation, diffPosOutMutation])
            .zip([samePosMutation, samePosMutation])
            .map(([diffMutation, samePosMutation]) =>
                assignWith({}, diffMutation, samePosMutation, add)
            )
            .value();

    return {
        in: inMutation,
        out: outMutation
    };
}

module.exports = {
    formationOptions,
    getTeamPlayers,
    getTeamFormation,
    getTeamAvailablePositions,
    findMutationBetweenFormations,
    getTeamLineup,
};