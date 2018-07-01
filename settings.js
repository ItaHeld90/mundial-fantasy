const period = 4;
const rootPath = './data/';
const dataRootPath = `${rootPath}/period ${period}/`;

const budget = 102;
const numPlayers = 11;

const NUM_GENERATIONS = 2000;
const NUM_GENERATION_TEAMS = 20;
const NUM_TEAMS_TOP_SELECTION = 5;
const NUM_OF_MUTATIONS = Math.floor(NUM_GENERATION_TEAMS / NUM_TEAMS_TOP_SELECTION) - 1;
const MUTATION_SIZE = 2;

const TOP_PLAYERS_PER_POS_AND_PRICE = 7;

const GK_PROBABILITY_FOR_SUBTITUTION = 0.2;

const NUM_LIMIT_BY_TEAM = 3;

module.exports = {
    rootPath,
    dataRootPath,
    budget,
    numPlayers,
    NUM_GENERATIONS,
    NUM_GENERATION_TEAMS,
    NUM_TEAMS_TOP_SELECTION,
    NUM_OF_MUTATIONS,
    MUTATION_SIZE,
    TOP_PLAYERS_PER_POS_AND_PRICE,
    GK_PROBABILITY_FOR_SUBTITUTION,
    NUM_LIMIT_BY_TEAM,
}