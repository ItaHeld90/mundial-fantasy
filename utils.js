const _ = require('lodash');
const { fill, flatMap, times, cloneDeep, sample, sum } = require('lodash');

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

module.exports = {
    getRandomInterpolation,
    randomInRange,
    sampleUpToSum,
};