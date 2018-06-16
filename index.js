const _ = require('lodash');
const scorers = require('./data/scorers.json');
const defense = require('./data/defense.json');
const positionScores = require('./data/position-scores.json');
const { getRandomTeam } = require('./random-team-utils');

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

getRandomTeam(topPlayersByPositionAndPrice);
// console.log(topPlayersByPositionAndPrice);

// output the results
// printResults(topPlayersByPrice);

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

function calcPlayerXpByPrice(playerWithXp, xpPerPriceUnit, destAveragePrice) {
	const { xp, Price: price } = playerWithXp;

	const priceDeviation = price - destAveragePrice;
	return xp - (priceDeviation * xpPerPriceUnit);
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

function groupTopByPosition(sortedPlayerRanks) {
	const topScorers = _(sortedPlayerRanks)
		.filter(({ Position }) => Position === 'S')
		.take(5)
		.value();

	const topMiddleFielders = _(sortedPlayerRanks)
		.filter(({ Position }) => Position === 'M')
		.take(5)
		.value();

	const topDefenders = _(sortedPlayerRanks)
		.filter(({ Position }) => Position === 'D')
		.take(5)
		.value();

	printResults([...topScorers, ...topMiddleFielders, ...topDefenders]);
}

function printResults(playerResults) {
	playerResults.forEach(
		({ Name, Position, Price, xp, xpByPrice }, idx) => {
			console.log(`${idx + 1})`, 'Name:', Name, 'xp:', xpByPrice, 'Position:', Position, 'price:', Price);
		});
}