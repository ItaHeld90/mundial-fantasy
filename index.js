const _ = require('lodash');
const scorers = require('./data/scorers.json');
const defense = require('./data/defense.json');
const positionScores = require('./data/position-scores.json');
const { run } = require('./genetic-algo-runner');

// calculate xp for each player
const playersWithXp = _(scorers)
	.filter(player => player.Position && player.Price && player.Price !== "NA")
	.map(player => ({
		...player,
		xp: calcPlayerXP(player)
	}))
	.value();

const topPlayersByPositionAndPrice = _(playersWithXp)
	.groupBy(({ Position }) => Position)
	.mapValues(topPlayersByPrice)
	.value();

run(topPlayersByPositionAndPrice);

function topPlayersByPrice(players) {
	return _(players)
		.groupBy(({ Price }) => Price)
		.pickBy(players => players.length > 0)
		.mapValues(players => takeTopPlayers(players, 5))
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