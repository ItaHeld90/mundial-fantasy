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

function randomfillBuckets(targetSum, arrRanges) {
    const buckets = arrRanges.map(({ key, min, max }) => ({ key, amount: min, max }));
    let inventory = targetSum - sumBy(buckets, ({ amount }) => amount);

    while (inventory > 0) {
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

function sampleUpToSum(sampleSettings, expectedSum) {
    // initialize a pointer for every sample at the end of the respective array
    const pointers =
        flatMap(sampleSettings, ({ key, arr, numSamples }) =>
            times(numSamples, _ => ({
                idx: arr.length - 1,
                arr,
                key
            }))
        );

    return getCombination(pointers);

    function getCombination(pointers) {
        const currSum = sum(
            pointers.map(({ arr, idx }) => arr[idx])
        );

        // if the sum gets below the expected sum - return the current combination
        if (currSum <= expectedSum) {
            return createCombination(pointers);
        }

        // update a random pointer and recurse
        const newPointers = updateRandomPointer(cloneDeep(pointers));
        return getCombination(newPointers);

        function updateRandomPointer(pointers) {
            // sample a random pointer
            const pointerToUpdate = sample(pointers);

            // if the random pointer can be moved backward
            // update it and return the new pointers 
            if (pointerToUpdate.idx > 0) {
                pointerToUpdate.idx--;
                return pointers;
            }

            // recurse
            return updateRandomPointer(pointers);
        }

        function createCombination(pointers) {
            // const bla = groupBy(pointers, ({ key }) => key);
            return _(pointers)
                .groupBy(({ key }) => key)
                .mapValues(sampleSettings =>
                    sampleSettings.map(({ arr, idx }) => arr[idx])
                )
                .value();
        }
    }
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

function sampleUpToSum2(descSortedValues, numPick, targetSum) {
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
    sampleUpToSum,
    monteCarloRandom,
    randomfillBuckets,
    sampleUpToSum2
};