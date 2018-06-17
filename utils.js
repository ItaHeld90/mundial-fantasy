const { fill } = require('lodash');

function getRandomInterpolation(targetSum, numBuckets, minValue, maxValue) {
    let sourceAmount = targetSum - (numBuckets * minValue);
    const arr = fill(Array(numBuckets), minValue);

    while (sourceAmount > 0) {
        const idx = randomInRange(0, arr.length - 1);
        const numInstances = arr[idx];

        if (numInstances < maxValue) {
            arr[idx]++;
            sourceAmount--;
        }
    }

    return arr;
}

function randomInRange(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
}

module.exports = {
    getRandomInterpolation,
    randomInRange
};