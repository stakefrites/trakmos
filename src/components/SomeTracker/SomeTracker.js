import React, { useEffect, useState } from "react";
import Intake from "./Intake";
import { Spinner } from "react-bootstrap";
import Button from "react-bootstrap/Button";
import { ArrowClockwise } from "react-bootstrap-icons";

function SomeTracker(props) {
  const [interval, setStateInterval] = useState();
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState();
  const [totalValue, setTotalValue] = useState();
  const [balances, setBalances] = useState([{}]);
  window.addEventListener("keplr_keystorechange", hardRefresh);
  const { queryClient, address } = props;
  useEffect(() => {
    // Your code here
    // Add a function that should get data onLoad
    //this.getDelegations();
    refresh();
    refreshInterval();
  }, []);

  function getBalancesCache(expireCache) {
    const cache = localStorage.getItem("balances");

    if (!cache) return;

    let cacheData = {};
    try {
      cacheData = JSON.parse(cache);
      const balances = JSON.parse(cacheData.balances);
      cacheData.balances = balances;

      cache = cacheData;
    } catch {
      cacheData.balances = cache;
    }
    if (!cacheData.balances) {
      return;
    }

    if (!expireCache) {
      return cacheData.balances;
    }
    if (!expireCache) return cacheData.balances;

    const cacheTime = cacheData.time && new Date(cacheData.time);
    if (!cacheData.time) return;

    //const expiry = new Date() - 1000 * 60 * 60 * 24 * 3;
    const expiry = new Date() - 1000 * 60 * 5;
    if (cacheTime >= expiry) {
      return cacheData.balances;
    }
  }

  function getPortfolio(hardRefresh) {
    const totalacc = 0;
    const totalReducer = (acc, item) => {
      return acc + parseInt(item.value);
    };

    if (!getBalancesCache(true) || hardRefresh) {
      const networks = Object.entries(props.networks);
      const portfolio = queryClient
        .getPortfolio(address, networks)
        .then((data) => {
          setBalances(data);
          const totalValue = data.reduce(totalReducer, totalacc);
          setTotalValue(totalValue);
          localStorage.setItem(
            "balances",
            JSON.stringify({ balances: data, time: +new Date() })
          );
          setIsLoaded(true);
        });
    } else {
      const balances = getBalancesCache(true);
      console.log("cached data ", JSON.parse(balances));
      const newBalances = JSON.parse(balances);
      const totalValue = newBalances.balances.reduce(totalReducer, totalacc);
      setTotalValue(totalValue);
      setBalances(newBalances.balances);
      setIsLoaded(true);
    }
  }
  function refresh(hardRefresh) {
    getPortfolio(hardRefresh);
    refreshInterval();
  }

  function hardRefresh() {
    localStorage.removeItem(balances);
    refresh(true);
  }

  function refreshInterval() {
    const interval = setInterval(() => {
      getPortfolio();
    }, 300_000);
    setStateInterval(interval);
  }

  if (!isLoaded) {
    return (
      <div className="text-center">
        <p>
          We are currently loading all your balances. <br />
          Please wait.
          <br /> It is still quicker than switching on all your accounts in
          Keplr
        </p>
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
  return (
    <>
      <p className="text-center">
        <Button
          onClick={hardRefresh}
          variant="outline-secondary"
          className="mb-3"
        >
          Refresh <ArrowClockwise color="black" size={16} />
        </Button>
        <Intake balances={balances} total={totalValue} {...props} />
      </p>
    </>
  );
}

export default SomeTracker;
