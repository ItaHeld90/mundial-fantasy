const _ = require('lodash');

const { dataRootPath } = require('./settings');
const { topPlayersByPrice, calcPlayerXP } = require('./data-store-utils');

const scorers = require(`${dataRootPath}/scorers.json`);

// normalizing the players prices
const normalizedScorers = scorers.map(player => ({
    ...player,
    shouldPlay: player['Should play'] != null ? player['Should play'] : 1,
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

const playersByPositionAndPrice = _(playersWithXp)
    .groupBy(({ Position }) => Position)
    .mapValues(topPlayersByPrice)
    .value();

module.exports = {
    playersWithXp,
    playersByPositionAndPrice
};