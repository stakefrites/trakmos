import React, { useEffect, useState } from "react";
import Intake from "./Intake";
import { Spinner } from "react-bootstrap";
import { json } from "stream/consumers";

function SomeTracker(props) {
  const [interval, setInterval] = useState();
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState();
  const [balances, setBalances] = useState([{}]);

  const { queryClient, address } = props;
  useEffect(async () => {
    // Your code here
    // Add a function that should get data onLoad
    //this.getDelegations();
    getPortfolio();
    refreshInterval();
  }, []);

  function getBalancesCache(expireCache) {
    const cache = localStorage.getItem("balances");
    console.log("GETTING CACHE", cache);

    if (!cache) return;

    let cacheData = {};
    try {
      cacheData = JSON.parse(cache);
      const balances = JSON.parse(cacheData.balances);
      cacheData.balances = balances;

      console.log("Parsed cache", cacheData, balances);
      cache = cacheData;
      console.log("Parsed cache2", cache);
    } catch {
      cacheData.balances = cache;
      console.log("Catch cache2", cache);
    }
    if (!cacheData.balances) {
      console.log("Not cahche data", cacheData.balances);
      return;
    }

    if (!expireCache) {
      console.log("not expired", cacheData.balances);
      return cacheData.balances;
    }
    if (!expireCache) return cacheData.balances;

    const cacheTime = cacheData.time && new Date(cacheData.time);
    if (!cacheData.time) return;

    const expiry = new Date() - 1000 * 60 * 60 * 24 * 3;
    if (cacheTime >= expiry) {
      console.log("cachetime > = expiry", cacheData.balances, expiry);
      return cacheData.balances;
    }
  }

  function getPortfolio() {
    if (!getBalancesCache(true)) {
      console.log("not cache");
      const networks = Object.entries(props.networks);
      const portfolio = queryClient
        .getPortfolio(address, networks)
        .then((data) => {
          setBalances(data);
          localStorage.setItem(
            "balances",
            JSON.stringify({ balances: data, time: +new Date() })
          );
          setIsLoaded(true);
        });
    } else {
      const balances = getBalancesCache(true);
      console.log("not cache real vf ", JSON.parse(balances));
      const newBalances = JSON.parse(balances);
      setBalances(newBalances.balances);
      setIsLoaded(true);
    }
  }
  function refreshInterval() {
    const interval = setInterval(() => {
      //Add a function that should be reloaded (Addresses)
      //this.getDelegations(true);
      //getPortfolio();
    }, 30_000);
    //setIsLoaded(true);
    setInterval(interval);
  }
  if (!isLoaded) {
    return (
      <div className="text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }
  if (error) {
    return (
      <>
        <Intake {...props} />
      </>
    );
  }
  return <Intake balances={balances} {...props} />;
}

export default SomeTracker;
