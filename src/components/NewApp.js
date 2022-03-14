import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import React, { useEffect, useState, useRef } from "react";
import _ from "lodash";

import { MsgGrant, MsgRevoke } from "cosmjs-types/cosmos/authz/v1beta1/tx.js";

import { Spinner, Container, Button, Badge } from "react-bootstrap";

import SomeTracker from "./SomeTracker/SomeTracker";
import AlertMessage from "./modules/AlertMessage";
import Footer from "./modules/Footer";
import Header from "./modules/Header";
import About from "./modules/About";

const getCache = (storageKey, valueKey, expireCache) => {
  const cache = localStorage.getItem(storageKey);
  if (!cache) {
    return;
  }

  let cacheData = {};
  try {
    cacheData = JSON.parse(cache);
    const subData = JSON.parse(cacheData[valueKey]);
    cacheData[valueKey] = subData;
    cache = cacheData;
  } catch {
    cacheData = cache;
  }
  if (!cacheData) {
  }

  if (!expireCache) {
    return JSON.parse(cacheData)[valueKey];
  }
  if (!expireCache) return JSON.parse(cacheData);

  const cacheTime = cacheData.time && new Date(cacheData.time);
  if (!cacheData.time) return;

  //const expiry = new Date() - 1000 * 60 * 60 * 24 * 3;
  const expiry = new Date() - 1000 * 60 * 5;
  if (cacheTime >= expiry) {
    return cache[valueKey];
  }
};

getAllCache = (arr, storageKey, valueKey, expireCache) => {
  const allCache = arr.map((item) => {
    console.log("allcache item in map", item);
    return getCache(item.coingecko_id, valueKey, expireCache);
  });
  console.log("allcache before includes", allCache);
  if (allCache.includes(undefined)) {
    console.log("no cache");
    return false;
  } else {
    console.log("allcache", allCache);
    return allCache;
  }
};

const suggestChain = (network) => {
  const currency = {
    coinDenom: network.symbol,
    coinMinimalDenom: network.denom,
    coinDecimals: network.decimals,
    coinGeckoId: network.coinGeckoId,
  };
  return window.keplr.experimentalSuggestChain({
    rpc: network.rpcUrl,
    rest: network.restUrl,
    chainId: network.chainId,
    chainName: network.prettyName,
    stakeCurrency: currency,
    bip44: { coinType: network.slip44 },
    walletUrlForStaking: "https://restake.app/" + network.name,
    bech32Config: {
      bech32PrefixAccAddr: network.prefix,
      bech32PrefixAccPub: network.prefix + "pub",
      bech32PrefixValAddr: network.prefix + "valoper",
      bech32PrefixValPub: network.prefix + "valoperpub",
      bech32PrefixConsAddr: network.prefix + "valcons",
      bech32PrefixConsPub: network.prefix + "valconspub",
    },
    currencies: [currency],
    feeCurrencies: [currency],
  });
};

function useDidUpdate(callback, deps) {
  const hasMount = useRef(false);

  useEffect(() => {
    if (hasMount.current) {
      callback();
    } else {
      hasMount.current = true;
    }
  }, deps);
}

const NewApp = (props) => {
  console.log("newAPP reload", props);
  const [prices, setPrices] = useState();
  const [balances, setBalances] = useState();
  const [totalValue, setTotalValue] = useState(0);
  const [balancesLoaded, setBalancesLoaded] = useState(false);
  const [pricesLoaded, setPricesLoaded] = useState(false);
  const [address, setAddress] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [error, setError] = useState();
  const [queryClient, setQueryClient] = useState();
  const [stargateClient, setStargateClient] = useState();
  const [interval, setStateInterval] = useState();
  const [keplr, setKeplr] = useState();
  const [accounts, setAccounts] = useState();

  const setNetwork = async () => {
    const network = props.network;
    if (!network) return;
    setError(false);
    setQueryClient(network.queryClient);
  };

  function refresh(hardRefresh) {
    //getPortfolio(hardRefresh);
    refreshInterval();
  }
  function hardRefresh() {
    localStorage.removeItem("balances");
    props.setLoaded();
    refresh(true);
  }

  function refreshInterval() {
    const interval = setInterval(() => {
      //getPortfolio();
    }, 300_000);
    setStateInterval(interval);
  }

  useDidUpdate(() => {
    console.log("Keplr updated");
    if (!keplr && window.keplr) {
      console.log("Keplr true");
      setKeplr(true);
      connect();
    }
    console.log("not keplr");
  }, [keplr]);

  useDidUpdate(() => {
    if (address !== false) {
      getBalances();
    }
  }, [address]);

  const getAccounts = () => {
    const currentAccounts = localStorage.getItem("savedAccounts");
    console.log("current accounts", currentAccounts);
    if (currentAccounts) {
      const myAccounts = JSON.parse(currentAccounts);
      setAccounts(myAccounts);
    }
  };

  useEffect(async () => {
    getAccounts();
    console.log("USING EFFECT 1");
    await setNetwork();
    console.log("network set");
    console.log("window loaded");
    if (!window.keplr) {
      console.log("Not keplr");
      setKeplr(false);
      getPrices();
    } else {
      setKeplr(true);
      console.log("Keplr");
      console.log("Connecting with Keplr", address);
      getPrices();
      connect();
    }
    window.addEventListener("keplr_keystorechange", connect);

    refresh();
    refreshInterval();
  }, []);

  const connect = async () => {
    console.log("In connect Method", props);
    if (!props.network.connected) {
      setError("Could not connect to any available API servers");
    }
    const chainId = props.network.chainId;
    try {
      await window.keplr.enable(chainId);
      console.log("Keplr enables");
    } catch (e) {
      console.log("enable error signer");
      console.log(e.message, e);
      await suggestChain(props.network);
    }
    if (window.getOfflineSigner) {
      console.log("offline signer");
      const offlineSigner = await window.getOfflineSignerAuto(chainId);
      const key = await window.keplr.getKey(chainId);
      const stargateClient = await props.network.signingClient(
        offlineSigner,
        key
      );

      const stargateAddress = await stargateClient.getAddress();
      console.log("CONNECTING", address);

      stargateClient.registry.register(
        "/cosmos.authz.v1beta1.MsgGrant",
        MsgGrant
      );
      stargateClient.registry.register(
        "/cosmos.authz.v1beta1.MsgRevoke",
        MsgRevoke
      );
      console.log("pre portfolio", props.network);

      setAddress(stargateAddress);
      setStargateClient(stargateClient);
      setError(false);
      if (address !== false) {
        console.log("address before balances", address);
        getBalances();
      }
    }
  };

  // TODO: remove from here an abstract with a helper for cache (custom hook?)

  const getBalancesCache = (expireCache) => {
    const cache = localStorage.getItem(address);
    console.log("pre parsed balance cache", cache);

    if (!cache) return;

    let cacheData = {};
    try {
      cacheData = JSON.parse(cache);
      console.log("parsed cache", cacheData);
      const { balances } = cacheData;
      console.log("parsed balances", balances);
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
  };

  const getPrices = async (hardRefresh) => {
    const networks = Object.values(props.networks);
    const prices = await getAllCache(networks, "prices", "price");
    setPricesLoaded(false);
    console.log("prices cache'", prices);
    if (prices) {
      const pricesData = _.keyBy(prices, "coingecko_id");
      console.log("Settiong prices cachce", prices, pricesData);
      setPrices(pricesData);
      setPricesLoaded(true);
    } else {
      const pricesData = await props.network.queryClient.getPrice(networks);
      console.log("Settiong prices NOCACHE", pricesData);
      console.log("getting prices", prices);
      setPrices(pricesData);
      setPricesLoaded(true);
    }
  };

  const getBalances = (hardRefresh) => {
    const totalacc = 0;
    const totalReducer = (acc, item) => {
      return acc + parseInt(item.value);
    };
    setBalancesLoaded(false);
    console.log(!getBalancesCache, "balances cache");

    if (!getBalancesCache(true) || hardRefresh) {
      console.log("Getting balances from Network", getBalancesCache());
      const networks = Object.entries(props.networks);
      console.log(
        "new app, getting balabnec with query",
        props.network.queryClient
      );
      try {
        const portfolio = props.network.queryClient
          .getPortfolio(address, networks)
          .then((data) => {
            console.log(data);
            const totalValue = data.reduce(totalReducer, totalacc);
            localStorage.setItem(
              address,
              JSON.stringify({ balances: data, time: +new Date() })
            );
            setBalances(data);
            setTotalValue(totalValue);
            setBalancesLoaded(true);
          });
        return portfolio;
      } catch (e) {
        console.log(e);
        return;
      }
    } else {
      console.log("Getting balances from cache", getBalancesCache());
      const balances = getBalancesCache(true);
      const newBalances = JSON.parse(balances);
      const totalValue = newBalances.balances.reduce(totalReducer, totalacc);
      setBalances(newBalances.balances);
      setTotalValue(totalValue);
      setBalancesLoaded(true);
    }
  };
  return (
    <>
      <Header />
      <Container>
        <div className="mb-5">
          <AlertMessage message={error} variant="danger" dismissible={false} />
          {address && pricesLoaded && balancesLoaded ? (
            <>
              {accounts.map((account, i) => (
                <div key={i}>{account}</div>
              ))}
              <SomeTracker
                address={address}
                prices={
                  prices !== false ? _.keyBy(prices, "coingecko_id") : prices
                }
                setBalancesLoaded={setBalancesLoaded}
                error={error}
                getPortfolio={getBalances}
                balances={balances}
                networks={props.networks}
                network={props.network}
                queryClient={queryClient}
              />
            </>
          ) : (
            <>
              <div className="text-center">
                <p>
                  We are currently loading all your balances. <br />
                  Please wait.
                  <br /> It is still quicker than switching on all your accounts
                  in Keplr
                </p>
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
              </div>
            </>
          )}
        </div>

        <Footer />
        <About show={showAbout} onHide={() => setShowAbout(false)} />
      </Container>
    </>
  );
};

export default NewApp;
