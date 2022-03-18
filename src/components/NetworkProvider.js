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
    setNetworks(newNetworks);
    setIsNetworkLoading(false);

    return _.compact(newNetworks).reduce((a, v) => ({ ...a, [v.name]: v }), {});
  };

  useEffect(() => {
    if (!networks.length) {
      setIsNetworkLoading(true);
      getNetworks();
    }
  }, []);

  const getAprs = async (networks) => {
    const aprs = 0;
  };

  /*   const changeNetwork = (network) => {
    setNetwork(network);
  }; */

  useEffect(() => {}, [networks]);

  if (error) {
    return <p>Loading failed</p>;
  }
  /* network={network} */
  /* changeNetwork={changeNetwork} */
  return (
    <>
      {React.cloneElement(props.children, {
        isNetworkLoading,
        networks,
        networkProgress,
      })}
    </>
  );
}

export default NetworkProvider;
