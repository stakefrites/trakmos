import _ from "lodash";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Network from "../utils/Network.mjs";
import { overrideNetworks, mapAsync } from "../utils/Helpers.mjs";
import NewApp from "./NewApp";

import { useLocalStorage } from "../hooks/hooks.js";

import { Spinner } from "react-bootstrap";

import networksData from "../networks.json";

/*

  const getCache = (storageKey, valueKey, expireCache) => {
    console.log("Getting cache", storageKey);
    const cache = localStorage.getItem(storageKey);
    if (!cache) {
      console.log("no cache for this");
      return;
    }

    let cacheData = {};
    try {
      cacheData = JSON.parse(cache).price;
      //cacheData.coingecko_id = storageKey;
      console.log("cache data in parse", cacheData);
    } catch {
      cacheData = cache;
    }

    if (!cacheData[valueKey]) {
      return JSON.parse(cacheData).price;
    }
    if (!expireCache) {
      return JSON.parse(cacheData).price;
    }

    const cacheTime = cacheData.time && new Date(cacheData.time);
    if (!cacheData.time) return;

    //const expiry = new Date() - 1000 * 60 * 60 * 24 * 3;
    const expiry = new Date() - 1000 * 60 * 12;
    if (cacheTime >= expiry) {
      return cacheData.price;
    }
  };

  const getAllCache = (arr, valueKey, expireCache) => {
    const allCache = arr.map((item) => {
      let cachedInLoop = getCache(item.coingecko_id, valueKey, expireCache);
      return cachedInLoop;
    });
    console.log("compact, all cache", _.compact(allCache), allCache);
    if (allCache.includes(undefined)) {
      return false;
    } else {
      return allCache;
    }
  };

  const getPrices = async (networks, hardRefresh) => {
    const network = networks[0];

    setPricesLoaded(false);
    const cachedPrices = await getAllCache(networks, "price", true);

    if (cachedPrices) {
      setPrices(cachedPrices);
      localStorage.setItem(
        "prices",
        JSON.stringify({ prices: cachedPrices, time: +new Date() })
      );
      setPricesLoaded(true);
    } else {
      const pricesData = await network.queryClient.getPrice(networks);
      pricesData.map((price) => {
        localStorage.setItem(
          price.coingecko_id,
          JSON.stringify({ price: price, time: +new Date() })
        );
      });
      setPrices(pricesData);
      localStorage.setItem(
        "prices",
        JSON.stringify({ prices: pricesData.prices, time: +new Date() })
      );
      setPricesLoaded(true);
    }
  };
*/

function NetworkFinder() {
  const [networks, setNetworks] = useState([]);
  const [isNetworkLoading, setIsNetworkLoading] = useState(true);
  const [networkProgress, setNetworkProgress] = useState(0);
  const [error, setError] = useState(false);
  const [prices, setPrices] = useLocalStorage("prices", false);
  //const [prices, setPrices] = useState();
  const [pricesLoaded, setPricesLoaded] = useState(false);

  const getPrices = async (networks, hardRefresh) => {
    const network = networks[0];

    setPricesLoaded(false);

    const pricesData = await network.queryClient.getPrice(networks);
    console.log(
      "🚀 ~ file: NetworkFinder.js ~ line 110 ~ getPrices ~ pricesData",
      pricesData
    );
    setPrices(pricesData);
    pricesData.map((price) => {
      localStorage.setItem(
        price.coingecko_id,
        JSON.stringify({ price: price, time: +new Date() })
      );
    });
    setPrices(pricesData);
    localStorage.setItem(
      "prices",
      JSON.stringify({ prices: pricesData.prices, time: +new Date() })
    );
    setPricesLoaded(true);
  };

  const getNetworks = async () => {
    const registryNetworks = await axios
      .get("https://registry.cosmos.directory")
      .then((res) => res.data)
      .then((data) => data.reduce((a, v) => ({ ...a, [v.directory]: v }), {}));

    const networks = networksData
      .filter((el) => el.enabled !== false)
      .map((data) => {
        const registryData = registryNetworks[data.name] || {};
        return { ...registryData, ...data };
      });
    return _.compact(networks).reduce((a, v) => ({ ...a, [v.name]: v }), {});
  };

  const getAprs = async (networks) => {
    const aprs = 0;
  };

  /*   const changeNetwork = (network) => {
    setNetwork(network);
  }; */

  useEffect(() => {
    if (!Object.keys(networks).length) {
      setIsNetworkLoading(true);
      getNetworks().then((networks) => {
        setNetworks(networks);
        // setIsNetworkLoading(false);
        return mapAsync(Object.values(networks), async (network) => {
          const newData = await Network(network);
          /*  const percent = networkProgress + networkIncrement;
            console.log(percent, networkProgress);
            setNetworkProgress(percent); */
          return newData;
        }).then((data) => {
          setNetworks(data);
          setNetworkProgress(100);
          setIsNetworkLoading(false);
          getPrices(data);
          getAprs(data);
          //setNetwork(network);
        });
      });
    }
  }, [networks]);

  /* if (isNetworkLoading) {
    return (
      <div className="pt-5 text-center">
        <p> Initializing blockchain data...</p>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">
            Initializing blockchain data...
          </span>
        </Spinner>
      </div>
    );
  } */

  if (error) {
    return <p>Loading failed</p>;
  }

  return (
    <>
      <NewApp
        prices={_.keyBy(prices, "coingecko_id")}
        isNetworkLoading={isNetworkLoading}
        networks={networks}
        networkProgress={networkProgress}
        /* network={network} */
        /* changeNetwork={changeNetwork} */
      />
    </>
  );
}

export default NetworkFinder;
