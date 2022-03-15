import React, { useEffect, useState } from "react";
import Result from "./Result";
import { Spinner, Button } from "react-bootstrap";
import { ArrowClockwise } from "react-bootstrap-icons";
import _ from "lodash";

function useUpdateEffect(effect, dependencies = []) {
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      return effect();
    }
  }, dependencies);
}

function SomeTrackerHome(props) {
  console.log("new some tracker reaload", props);
  const [balances, setBalances] = useState();
  const [balancesLoaded, setBalancesLoaded] = useState(false);
  const [interval, setStateInterval] = useState();
  const [error, setError] = useState(false);

  useEffect(() => {
    setNetwork();
    getBalances();
  }, []);

  useEffect(() => {
    console.log("effect hook for balances", props.address);
    refresh();
  }, [props.address]);

  function refresh(hardRefresh) {
    getBalances();
    refreshInterval();
  }
  function hardRefresh() {
    console.log("HR address", props.address);
    localStorage.removeItem("balances");
    setBalances([]);
    setBalancesLoaded(false);
    refresh(true);
  }

  function refreshInterval() {
    const interval = setInterval(() => {
      //Insert a function to run at each X time
    }, 300_000);
    setStateInterval(interval);
  }

  const setNetwork = async () => {
    const network = props.network;
    if (!network) return;
    setError(false);
  };

  // TODO: remove from here an abstract with a helper for cache (custom hook?)

  const getBalancesCache = (expireCache) => {
    const cache = localStorage.getItem(props.address);
    console.log("pre parsed balance cache", cache, props);

    if (!cache) {
      console.log("not cache");
      return;
    }

    let cacheData = {};
    try {
      cacheData = JSON.parse(cache);
      console.log("parsed cache", JSON.parse(cacheData));
      const { balances } = JSON.parse(cacheData);
      console.log("parsed balances", balances);
      cacheData.balances = balances;

      cache = cacheData;
    } catch {
      console.log("catched", cache, cacheData);
      cacheData.balances = cache;
    }
    if (!Array.isArray(cacheData.balances)) {
      console.log("not balances");
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
  };

  const getBalances = (hardRefresh) => {
    const totalacc = 0;
    const totalReducer = (acc, item) => {
      return acc + parseInt(item.value);
    };
    const cache = getBalancesCache(true);
    console.log(cache);
    setBalancesLoaded(false);
    console.log(
      "getting balances, if true, go to network",
      getBalancesCache(true) == undefined,
      getBalancesCache(true) && hardRefresh
    );

    if (!getBalancesCache(true) || hardRefresh) {
      const networks = Object.entries(props.networks);
      try {
        const portfolio = props.network.queryClient
          .getPortfolio(props.address, props.networks)
          .then((data) => {
            console.log(data);
            localStorage.setItem(
              props.address,
              JSON.stringify({ balances: data, time: +new Date() })
            );
            const newAccounts = props.accounts
              ? [props.address, ...props.accounts]
              : [props.address];
            console.log(
              "ACCOUNTS PROPS & NEW ACCOUNTS",
              props.accounts,
              props.address,
              newAccounts
            );
            localStorage.setItem("savedAccounts", JSON.stringify(newAccounts));
            props.setAccounts(_.uniq(newAccounts));
            setBalances(data);
            setBalancesLoaded(true);
          });
        return portfolio;
      } catch (e) {
        console.log(e);
        return;
      }
    } else {
      const balances = getBalancesCache(true);
      console.log("balances cachce", balances);
      const newBalances = JSON.parse(balances);

      const totalValue = newBalances.balances.reduce(totalReducer, totalacc);
      setBalances(newBalances.balances);
      setBalancesLoaded(true);
    }
  };
  if (!balancesLoaded) {
    return (
      <div className="pt-5 text-center">
        <p>Loading all balances ....</p>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">
            Initializing blockchain data...
          </span>
        </Spinner>
      </div>
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
          Refresh Balances <ArrowClockwise color="black" size={16} />
        </Button>
      </p>
      {Array.isArray(props.accounts) ? (
        <div>
          <p>You have {props.accounts.length} accounts saved</p>
          {props.accounts.map((account) => {
            const styles = account == props.address ? "dark" : "outline-dark";
            return (
              <div key={account}>
                <Button
                  variant={styles}
                  onClick={() => {
                    props.setAddress(account);
                  }}
                >
                  {account}
                </Button>
              </div>
            );
          })}
        </div>
      ) : (
        ""
      )}
      <Result balances={balances} {...props} />
    </>
  );
}
export default SomeTrackerHome;
