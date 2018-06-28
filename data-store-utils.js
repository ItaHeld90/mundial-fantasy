const _ = require('lodash');

const {
    rootPath,
    dataRootPath,
    TOP_PLAYERS_PER_POS_AND_PRICE,
} = require('./settings');

const defense = require(`${dataRootPath}/defense.json`);
const positionScores = require(`${rootPath}/position-scores.json`);

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
    const { Position: position, Team: team, Anytime: goalOdds, shouldPlay } = player;
    const getPlayerScoreByAchievement = getPlayerScore(position);

    const goalScore = getPlayerScoreByAchievement('Goal');

    const cleanSheetOdds = defense.find(country => country.Name === team)['Clean sheet'];
    const cleanSheetScore = getPlayerScoreByAchievement('Clean');

    const assistOdds = goalOdds;
    const assistScore = getPlayerScoreByAchievement('Assist');

    const probabilityToPlay = shouldPlay;

    return (
        probabilityToPlay *
        ((goalScore * 1.2) / goalOdds + (assistScore * 1.2) / assistOdds + cleanSheetScore / cleanSheetOdds)
    );
}

function getPlayerScore(playerPosition) {
    return playerAchievement =>
        positionScores.find(
            ({ position, achievement }) => position === playerPosition && achievement === playerAchievement
        ).score;
}

module.exports = {
    topPlayersByPrice,
    calcPlayerXP,
}