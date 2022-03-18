import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import React, { useEffect, useState, useRef } from "react";
import _ from "lodash";
import SavedAccounts from "./SomeTracker/SavedAccounts";

import {
  Spinner,
  Container,
  Button,
  Card,
  Badge,
  Form,
  ProgressBar,
} from "react-bootstrap";

import SomeTrackerHome from "./SomeTracker/SomeTrackerHome";
import ManualAddress from "./SomeTracker/ManualAddress";
import AlertMessage from "./modules/AlertMessage";
import Footer from "./modules/Footer";
import Header from "./modules/Header";
import About from "./modules/About";

import { useLocalStorage } from "../hooks/hooks";

import { Bech32 } from "@cosmjs/encoding";
import NetworkLoading from "./SomeTracker/NetworkLoading";

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

const NewApp = (props) => {
  const [address, setAddress] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [error, setError] = useState();
  const [stargateClient, setStargateClient] = useState();
  const [keplr, setKeplr] = useState();
  const [accounts, setAccounts] = useLocalStorage("myAccounts", []);
  const [newAddress, setNewAddress] = useState("");
  const [currentWallet, setCurrentWallet] = useState();

  useUpdateEffect(() => {
    if (!keplr && window.keplr) {
      setKeplr(true);
    }
  }, [keplr]);

  useEffect(() => {
    window.addEventListener("keplr_keystorechange", reconsiderAddress);
    if (!window.keplr) {
      setKeplr(false);
    } else {
      setKeplr(true);
      if (props.networks.length > 0) {
        console.log("network length", props);
        connect();
      }
    }
  }, [props.networks]);

  const connect = async () => {
    console.log(props);
    if (!props.networks[0].connected) {
      setError("Could not connect to any available API servers");
    }
    const network = props.networks[0];
    const chainId = network.chainId;
    try {
      await window.keplr.enable(chainId);
    } catch (e) {
      await suggestChain(network, window);
    }
    if (window.getOfflineSigner) {
      const offlineSigner = await window.getOfflineSignerAuto(chainId);
      const key = await window.keplr.getKey(chainId);
      const stargateClient = await network.signingClient(offlineSigner, key);

      const stargateAddress = await stargateClient.getAddress();
      const decodedAddress = Bech32.decode(stargateAddress);
      const trackAddress = Bech32.encode("trakmos", decodedAddress.data);
      setAddress(trackAddress);
      setStargateClient(stargateClient);
      setError(false);
      if (address !== false) {
      }
    }
  };

  const reconsiderAddress = async () => {
    const network = props.networks[0];
    const chainId = network?.chainId;
    const key = await window.keplr.getKey(chainId);
    const address = Bech32.encode("trakmos", key.address);
    setAddress(address);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const isValid = Bech32.decode(newAddress);
    if (isValid) {
      setAddress(newAddress);
      setNewAddress("");
    } else {
      setError("This is not a valid Bech32 address");
    }
  };

  const handleManualAddress = (e) => {
    setNewAddress(e.target.value);
  };

  return (
    <>
      <Container>
        <Header address={address} accounts={accounts} setAddress={setAddress} />
        <div className="mb-5">
          <AlertMessage message={error} variant="danger" dismissible={false} />
          {address ? (
            <>
              <SomeTrackerHome
                address={address}
                setAddress={setAddress}
                error={error}
                accounts={accounts}
                setAccounts={setAccounts}
                {...props}
              />
            </>
          ) : (
            <div>
              {!keplr ? (
                <>
                  <AlertMessage variant="warning" dismissible={false}>
                    Please install the{" "}
                    <a
                      href="https://chrome.google.com/webstore/detail/keplr/dmkamcknogkgcdfhhbddcghachkejeap?hl=en"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Keplr browser extension
                    </a>{" "}
                    using desktop Google Chrome.
                    <br />
                    WalletConnect and mobile support is coming soon.
                  </AlertMessage>
                  <ManualAddress
                    keplr={keplr}
                    connect={connect}
                    newAddress={newAddress}
                    handleSubmit={handleSubmit}
                    handleManualAddress={handleManualAddress}
                  />
                </>
              ) : (
                <div className="mb-5 text-center">
                  {props.isNetworkLoading ? (
                    <NetworkLoading />
                  ) : (
                    <ManualAddress
                      keplr={keplr}
                      connect={connect}
                      newAddress={newAddress}
                      handleSubmit={handleSubmit}
                      handleManualAddress={handleManualAddress}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <Footer className="fixed-bottom" />
        <About show={showAbout} onHide={() => setShowAbout(false)} />
      </Container>
    </>
  );
};

export default NewApp;
