const _ = require('lodash');
const { groupBy } = require('lodash');

const { dataRootPath } = require('./settings');
const { calcPlayerXP } = require('./data-store-utils');

const players = require(`${dataRootPath}/scorers.json`);

// normalizing the players prices
const normalizedScorers = players.map(player => ({
    ...player,
    shouldPlay: player['Should play'] != null ? player['Should play'] : 1,
    twoOrMore: player['2 or more'],
    Price: Math.round(Number(player.Price)),
}));

// calculate xp for each player
const playersWithXp = _(normalizedScorers)
    .filter(player => player.Position && player.Price && player.Price !== 'NA')
    .map(player => ({
        ...player,
        xp: calcPlayerXP(player),
    }))
    .value();

const playersByPos = groupBy(playersWithXp, player => player.Position);

module.exports = {
    players: playersWithXp,
    playersByPos,
};