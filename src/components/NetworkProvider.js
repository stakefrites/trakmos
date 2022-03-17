import _ from "lodash";
import axios from "axios";
import React, { useEffect, useState } from "react";
import Network from "../utils/Network.mjs";
import { overrideNetworks, mapAsync } from "../utils/Helpers.mjs";

import { useLocalStorage } from "../hooks/hooks.js";

import networksData from "../networks.json";

function NetworkProvider(props) {
  //  const [networks, setNetworks] = useLocalStorage("networks", []);
  const [networks, setNetworks] = useState(false);
  const [isNetworkLoading, setIsNetworkLoading] = useState(true);
  const [networkProgress, setNetworkProgress] = useState(0);
  const [error, setError] = useState(false);
  const [prices, setPrices] = useLocalStorage("prices", false);
  //const [prices, setPrices] = useState();
  const [isPricesLoading, setIsPricesLoading] = useState(true);

  const getPrices = async (networks, hardRefresh) => {
    const network = networks[0];

    setIsPricesLoading(true);

    const pricesData = await network.queryClient.getPrice(networks);
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
    setIsPricesLoading(false);
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

    const newNetworks = await mapAsync(
      Object.values(networks),
      async (network) => {
        const newData = await Network(network);
        return newData;
      }
    );
    console.log(newNetworks);
    setNetworks(newNetworks);

    return _.compact(newNetworks).reduce((a, v) => ({ ...a, [v.name]: v }), {});
  };

  useEffect(() => {
    setIsNetworkLoading(true);
    getNetworks().then((networks) => {
      setNetworks(networks);
      setIsNetworkLoading(false);
      setNetworks(networks);
    });
  }, []);

  const getAprs = async (networks) => {
    const aprs = 0;
  };

  /*   const changeNetwork = (network) => {
    setNetwork(network);
  }; */

  useEffect(() => {
    /*  if (networks.length) {
      console.log("Ça roule?");
      setIsNetworkLoading(true);
      getNetworks().then((networks) => {
        return mapAsync(Object.values(networks), async (network) => {
          const newData = await Network(network);
          return newData;
        }).then((data) => {
          setNetworks(data);
          setIsNetworkLoading(false);
          setNetworkProgress(100);
          getPrices(data);
          setIsPricesLoading(false);
          getAprs(data);
        });
      });
    } */
  }, [networks]);

  /*  if (isNetworkLoading) {
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
  /* network={network} */
  /* changeNetwork={changeNetwork} */
  return (
    <>
      {React.cloneElement(props.children, {
        price: _.keyBy(prices, "coingecko_id"),
        isNetworkLoading,
        isPricesLoading,
        networks,
        networkProgress,
      })}
    </>
  );
}

export default NetworkProvider;
