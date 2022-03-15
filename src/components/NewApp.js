import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import React, { useEffect, useState, useRef } from "react";
import _ from "lodash";

import { Spinner, Container, Button, Badge, Form } from "react-bootstrap";

import SomeTrackerHome from "./SomeTracker/SomeTrackerHome";
import AlertMessage from "./modules/AlertMessage";
import Footer from "./modules/Footer";
import Header from "./modules/Header";
import About from "./modules/About";

import { Bech32 } from "@cosmjs/encoding";

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
  const isInitialMount = useRef(true);
  const { prices } = props;

  const [address, setAddress] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [error, setError] = useState();
  const [stargateClient, setStargateClient] = useState();
  const [keplr, setKeplr] = useState();
  const [accounts, setAccounts] = useState([]);
  const [newAddress, setNewAddress] = useState("");
  const [currentWallet, setCurrentWallet] = useState();

  useUpdateEffect(() => {
    console.log("Keplr use effect");
    if (!keplr && window.keplr) {
      console.log(
        "Keplr use effect !keplr && window.keplr ",
        keplr,
        window.keplr,
        "Setting Keplr to true"
      );
      setKeplr(true);
    }
  }, [keplr]);

  useEffect(() => {
    getAccounts();
    getAccounts();
    window.addEventListener("keplr_keystorechange", reconsiderAddress);
    if (!window.keplr) {
      setKeplr(false);
    } else {
      connect();
      setKeplr(true);
    }
  }, []);

  const connect = async () => {
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
      await suggestChain(props.network, window);
    }
    if (window.getOfflineSigner) {
      console.log("offline signer");
      const offlineSigner = await window.getOfflineSignerAuto(chainId);
      const key = await window.keplr.getKey(chainId);
      console.log(key, offlineSigner, Bech32.encode(props.network.prefix, key));
      const stargateClient = await props.network.signingClient(
        offlineSigner,
        key
      );

      const stargateAddress = await stargateClient.getAddress();
      setAddress(stargateAddress);
      setStargateClient(stargateClient);
      setError(false);
      if (address !== false) {
        console.log("address before balances", address);
        getBalances();
      }
    }
  };

  const reconsiderAddress = async () => {
    console.log("reconsidering address");
    const chainId = props.network.chainId;
    const key = await window.keplr.getKey(chainId);
    console.log("trackmos address", Bech32.encode("trackmos", key));

    const address = key.bech32Address;
    const newAccounts = _.uniq([...accounts].push(address));
    //setAccounts(newAccounts);
    localStorage.setItem("savedAccounts", newAccounts);
    setAddress(address);
  };

  const getAccounts = () => {
    const currentAccounts = localStorage.getItem("savedAccounts");
    console.log("current accounts", currentAccounts);
    if (currentAccounts) {
      const myAccounts = JSON.parse(currentAccounts);
      console.log("you have accounts", myAccounts);
      setAccounts(_.uniq(myAccounts));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const isValid = Bech32.decode(newAddress);
    if (isValid) {
      setAddress(newAddress);
    } else {
      setError("This is not a valid Bech32 address");
    }
  };

  const handleManualAddress = (e) => {
    setNewAddress(e.target.value);
  };

  console.log(props.prices);

  return (
    <>
      <Container>
        <Header />
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
                    {Array.isArray(accounts) ? (
                      <div>
                        <p>You have {accounts.length} accounts saved</p>
                        {accounts.map((account) => {
                          return (
                            <div>
                              <Button
                                onClick={() => {
                                  setAddress(account);
                                }}
                                variant="outline-dark"
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
                    <hr />
                    <Form className="manual-address" onSubmit={handleSubmit}>
                      <Form.Group className="mb-3" controlId="formBasicEmail">
                        <Form.Label>Enter any $COSMOS address</Form.Label>
                        <Form.Control
                          type="text"
                          value={newAddress}
                          onChange={handleManualAddress}
                          placeholder="osmo1eh... or cosmos1eh..."
                        />
                      </Form.Group>
                      <Button variant="primary" type="submit">
                        Submit
                      </Button>
                    </Form>
                  </AlertMessage>
                </>
              ) : (
                <div className="mb-5 text-center">
                  <Button onClick={connect}>Connect Keplr</Button>
                </div>
              )}
            </div>
          )}
        </div>

        <Footer />
        <About show={showAbout} onHide={() => setShowAbout(false)} />
      </Container>
    </>
  );
};

export default NewApp;
