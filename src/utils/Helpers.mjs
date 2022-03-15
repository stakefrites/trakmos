import _ from "lodash";

export function overrideNetworks(networks, overrides) {
  return networks.map((network) => {
    let override = overrides[network.name];
    if (!override) return network;
    override.overriden = true;
    return _.merge(network, override);
  });
}

export function mapAsync(array, callbackfn) {
  const mapAsyncResult = Promise.all(array.map(callbackfn));
  console.log(mapAsyncResult);
  return mapAsyncResult;
}

export function findAsync(array, callbackfn) {
  return mapAsync(array, callbackfn).then((findMap) => {
    return array.find((value, index) => findMap[index]);
  });
}

export function filterAsync(array, callbackfn) {
  return mapAsync(array, callbackfn).then((filterMap) => {
    return array.filter((value, index) => filterMap[index]);
  });
}

export function uniqueArray(arr, key) {
  return _.uniqBy(arr, key);
}

export async function mapSync(calls, count, batchCallback) {
  const batchCalls = _.chunk(calls, count);
  let results = [];
  let index = 0;
  for (const batchCall of batchCalls) {
    const batchResults = await mapAsync(batchCall, (call) => call());
    results.push(batchResults);
    if (batchCallback) batchCallback(batchResults, index);
    index++;
  }
  return results.flat();
}

export async function executeSync(calls, count) {
  const batchCalls = _.chunk(calls, count);
  for (const batchCall of batchCalls) {
    await mapAsync(batchCall, (call) => call());
  }
}
