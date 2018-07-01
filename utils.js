const _ = require('lodash');
const { fill, flatMap, times, cloneDeep, sample, sum, sumBy, identity, range } = require('lodash');

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

function randomFillBuckets(targetSum, arrRanges) {
    const buckets = arrRanges.map(({ key, min, max }) => ({ key, amount: min, max }));
    let inventory = targetSum - sumBy(buckets, ({ amount }) => amount);

    const bucketsFull = 
        () => buckets.every(bucket => bucket.amount === bucket.max);

    while (inventory > 0 && !bucketsFull()) {
        const rndBucket = sample(buckets);

        if (rndBucket.amount < rndBucket.max) {
            rndBucket.amount++;
            inventory--;
        }
    }

    amountByKey = _(buckets)
        .keyBy(bucket => bucket.key)
        .mapValues(({ amount }) => amount)
        .value();

    return amountByKey;
}

function randomInRange(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
}

function monteCarloRandom(min, max, distributationFn = identity) {
    while (true) {
        const r1 = Math.random();
        const probability = distributationFn(r1);
        const r2 = Math.random();

        if (r2 < probability) {
            return (max - min) * r1 + min;
        }
    }
}

function sampleUpToSum(descSortedValues, numPick, targetSum) {
    const pointers = new Set(range(0, numPick));

    let currSum = _([...pointers.values()])
        .map(pointer => descSortedValues[pointer])
        .sum();

    // while sum is bigger than the target sum
    while (currSum > targetSum) {
        // pick a random pointer
        const pointerToUpdate = sample([...pointers.values()]);
        // find an available index to decrease the pointer to
        const updatedPointer =
            findSmallestVacantNumber(pointers, pointerToUpdate + 1, descSortedValues.length);

        if (updatedPointer !== -1) {
            // update the pointer index
            pointers.delete(pointerToUpdate);
            pointers.add(updatedPointer);

            // update the current sum
            currSum +=
                descSortedValues[updatedPointer] - descSortedValues[pointerToUpdate];
        }
    }

    return [...pointers.values()];
}

function findSmallestVacantNumber(numbersSet, min, max) {
    for (let i = min; i < max; i++) {
        if (!numbersSet.has(i)) {
            return i;
        }
    }

    return -1;
}

module.exports = {
    getRandomInterpolation,
    monteCarloRandom,
    randomFillBuckets,
    sampleUpToSum
};