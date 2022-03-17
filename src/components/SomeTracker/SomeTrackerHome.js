import React, { useEffect, useState } from "react";
import Result from "./Result";
import { Spinner, Button, Row, Col, Container, Badge } from "react-bootstrap";
import { ArrowClockwise } from "react-bootstrap-icons";
import _ from "lodash";
import SavedAccounts from "./SavedAccounts";

import { Bech32 } from "@cosmjs/encoding";

function SomeTrackerHome(props) {
  const [balances, setBalances] = useState();
  const [balancesLoaded, setBalancesLoaded] = useState(false);
  const [interval, setStateInterval] = useState();
  const [error, setError] = useState(false);

  useEffect(() => {
    setNetwork();
    getBalances();
  }, []);

  useEffect(() => {
    refresh();
  }, [props.address]);

  function refresh() {
    getBalances();
    refreshInterval();
  }
  function hardRefresh() {
    console.log("HR");
    setBalancesLoaded(false);
    localStorage.removeItem("balances");
    getBalances(true);
    //setBalances([]);
    //setBalancesLoaded(false);
    refresh();
  }

  function refreshInterval() {
    const interval = setInterval(() => {
      getBalances();
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

    if (!cache) {
      return;
    }

    let cacheData = {};
    try {
      const parsedCacheData = JSON.parse(cache);
      const { balances } = parsedCacheData;
      cacheData.balances = balances;
      cacheData.time = parsedCacheData.time;
    } catch {
      cacheData.balances = cache;
    }
    if (!Array.isArray(cacheData.balances)) {
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

  const saveAccounts = (address) => {
    const decodedAddress = Bech32.decode(address);
    const trackAddress = Bech32.encode("trackmos", decodedAddress.data);

    const myAccounts = props.accounts;
    const newAccounts = myAccounts
      ? [trackAddress, ...myAccounts]
      : [trackAddress];
    props.setAccounts(_.uniq(newAccounts));
  };

  const getBalances = (hardRefresh) => {
    const cache = getBalancesCache(true);
    setBalancesLoaded(false);
    saveAccounts(props.address);

    if (!cache || hardRefresh) {
      try {
        const portfolio = props.networks[0].queryClient
          .getPortfolio(props.address, props.networks)
          .then((data) => {
            localStorage.setItem(
              props.address,
              JSON.stringify({ balances: data, time: +new Date() })
            );
            setBalances(data);
            setBalancesLoaded(true);
          });
        return portfolio;
      } catch (e) {
        console.log(e);
        return;
      }
    } else {
      const newBalances = cache;
      setBalances(newBalances);
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

  /*  <Button
              onClick={hardRefresh}
              variant="outline-secondary"
              className="justify-content-end"
            >
              Refresh Balances <ArrowClockwise color="black" size={13} />
            </Button>

  */
  return (
    <>
      <Container>
        <Row>
          <Col></Col>
          <Col className="mb-3 d-flex flex-row-reverse "></Col>
        </Row>
      </Container>
      {balancesLoaded ? <Result balances={balances} {...props} /> : ""}
    </>
  );
}
export default SomeTrackerHome;
