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

function NetworkFinder() {
  const [network, setNetwork] = useState(false);
  const [networks, setNetworks] = useState([]);
  const [isNetworkLoading, setIsNetworkLoading] = useState(true);
  const [error, setError] = useState(false);
  const [prices, setPrices] = useLocalStorage("prices");
  //const [prices, setPrices] = useState();
  const [pricesLoaded, setPricesLoaded] = useState(false);

  const getCache = (storageKey, valueKey, expireCache) => {
    const cache = localStorage.getItem(storageKey);
    if (!cache) {
      return;
    }

    let cacheData = {};
    try {
      cacheData = JSON.parse(cache);
      cacheData.coingecko_id = storageKey;
    } catch {
      cacheData = cache;
    }

    if (!cacheData[valueKey]) {
      return JSON.parse(cacheData);
    }
    if (!expireCache) {
      return JSON.parse(cacheData);
    }

    const cacheTime = cacheData.time && new Date(cacheData.time);
    if (!cacheData.time) return;

    //const expiry = new Date() - 1000 * 60 * 60 * 24 * 3;
    const expiry = new Date() - 1000 * 60 * 12;
    if (cacheTime >= expiry) {
      return cacheData;
    }
  };

  const getAllCache = (arr, storageKey, valueKey, expireCache) => {
    const allCache = arr.map((item) => {
      return getCache(item.coingecko_id, valueKey, expireCache);
    });
    if (allCache.includes(undefined)) {
      return false;
    } else {
      return allCache;
    }
  };

  const getPrices = async (network, hardRefresh) => {
    setPricesLoaded(false);
    const networksArray = Object.values(networks);
    const cachedPrices = await getAllCache(
      networksArray,
      "prices",
      "price",
      true
    );
    if (cachedPrices) {
      setPrices(cachedPrices);
      localStorage.setItem(
        "prices",
        JSON.stringify({ prices: cachedPrices, time: +new Date() })
      );
      setPricesLoaded(true);
    } else {
      const pricesData = await network.queryClient.getPrice(networksArray);
      pricesData.map((price) => {
        localStorage.setItem(
          price.coingecko_id,
          JSON.stringify({ price: price, time: +new Date() })
        );
      });
      setPrices(pricesData);
      /*  localStorage.setItem(
        "prices",
        JSON.stringify({ prices: pricesData.prices, time: +new Date() })
      ); */
      setPricesLoaded(true);
    }
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

  const changeNetwork = (network) => {
    setNetwork(network);
  };

  useEffect(() => {
    if (!Object.keys(networks).length) {
      setIsNetworkLoading(true);
      getNetworks().then((networks) => {
        setNetworks(networks);
        // setIsNetworkLoading(false);
      });
    }
  }, [networks]);

  useEffect(() => {
    if (Object.keys(networks).length && !network) {
      const networkName = Object.keys(networks)[0];
      const data = networks[networkName];
      if (!data) {
        //setIsNetworkLoading(false);
        return;
      }
      Network(data)
        .then((network) => {
          setNetwork(network);
          getPrices(network);
        })
        .then(() => {
          return mapAsync(Object.values(networks), async (network) => {
            const newData = await Network(network);
            return newData;
          });
        })
        .then((data) => {
          setNetworks(data);
          setIsNetworkLoading(false);
        });
    }
  }, [networks, network]);

  if (isNetworkLoading) {
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
  }

  if (error) {
    return <p>Loading failed</p>;
  }

  return (
    <NewApp
      prices={_.keyBy(prices, "coingecko_id")}
      networks={networks}
      network={network}
      changeNetwork={changeNetwork}
    />
  );
}

export default NetworkFinder;
