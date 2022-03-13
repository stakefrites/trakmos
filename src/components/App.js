import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import React from "react";
import _ from "lodash";
import AlertMessage from "./AlertMessage";
import NetworkSelect from "./NetworkSelect";
import Wallet from "./Wallet";
import SomeTracker from "./SomeTracker/SomeTracker";
import Coins from "./Coins";
import ValidatorLink from "./ValidatorLink";
import About from "./About";

import { MsgGrant, MsgRevoke } from "cosmjs-types/cosmos/authz/v1beta1/tx.js";

import { Container, Button, Badge } from "react-bootstrap";
import { CopyToClipboard } from "react-copy-to-clipboard";
import GitHubButton from "react-github-btn";
import Logo from "../assets/logo.png";
import Logo2x from "../assets/logo@2x.png";
import Logo3x from "../assets/logo@3x.png";

import PoweredByAkash from "../assets/powered-by-akash.svg";
import { Twitter, Github } from "react-bootstrap-icons";
import StakeFriteLogo from "../assets/Sigle_Stake_house@2x.png";
import StakeFriteLogoLong from "../assets/Logo_Stake_house_VF_150.png";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { validatorImages: {} };
    this.connect = this.connect.bind(this);
    this.getPortfolio = this.getPortfolio.bind(this);
    this.getBalancesCache = this.getBalancesCache.bind(this);
    this.showNetworkSelect = this.showNetworkSelect.bind(this);
    this.getValidatorImage = this.getValidatorImage.bind(this);
    this.loadValidatorImages = this.loadValidatorImages.bind(this);
  }

  async componentDidMount() {
    await this.setNetwork();
    window.onload = async () => {
      if (!window.keplr) {
        this.setState({ keplr: false });
      } else {
        this.setState({ keplr: true });
        this.connect();
      }
    };
    window.addEventListener("keplr_keystorechange", this.connect);
    if (this.props.operators) {
      this.loadValidatorImages(
        this.props.network,
        _.compact(this.props.operators.map((el) => el.validatorData))
      );
    }
    this.loadValidatorImages(this.props.network, this.props.validators);
  }

  async componentDidUpdate(prevProps) {
    if (!this.state.keplr && window.keplr) {
      this.setState({ keplr: true });
      this.connect();
    }
    if (this.props.network !== prevProps.network) {
      if (this.state.address) {
        this.connect();
      }
      await this.setNetwork();
    }
  }

  componentWillUnmount() {
    window.removeEventListener("keplr_keystorechange", this.connect);
  }

  setNetwork() {
    const network = this.props.network;
    if (!network) return;

    return this.setState({
      error: false,
      queryClient: network.queryClient,
    });
  }

  showNetworkSelect() {
    this.setState({ showNetworkSelect: false });
  }

  async connect() {
    if (!this.props.network.connected) {
      return this.setState({
        error: "Could not connect to any available API servers",
      });
    }
    const chainId = this.props.network.chainId;
    try {
      await window.keplr.enable(chainId);
    } catch (e) {
      console.log(e.message, e);
      await this.suggestChain(this.props.network);
    }
    if (window.getOfflineSigner) {
      const offlineSigner = await window.getOfflineSignerAuto(chainId);
      const key = await window.keplr.getKey(chainId);
      const stargateClient = await this.props.network.signingClient(
        offlineSigner,
        key
      );

      const address = await stargateClient.getAddress();
      console.log("CONNECTING", address);

      stargateClient.registry.register(
        "/cosmos.authz.v1beta1.MsgGrant",
        MsgGrant
      );
      stargateClient.registry.register(
        "/cosmos.authz.v1beta1.MsgRevoke",
        MsgRevoke
      );
      this.setState({
        address: address,
        stargateClient: stargateClient,
        error: false,
      });
      this.getBalance();
      this.getPortfolio(true);
    }
  }

  getBalancesCache(expireCache) {
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
  getPortfolio(hardRefresh) {
    const totalacc = 0;
    const totalReducer = (acc, item) => {
      return acc + parseInt(item.value);
    };

    if (!this.getBalancesCache(true) || hardRefresh) {
      console.log(this.props.networks);
      const networks = Object.entries(this.props.networks);
      console.log("querying with address", this.state.address);
      const portfolio = this.state.queryClient
        .getPortfolio(this.state.address, networks)
        .then((data) => {
          const totalValue = data.reduce(totalReducer, totalacc);
          localStorage.setItem(
            "balances",
            JSON.stringify({ balances: data, time: +new Date() })
          );
          this.setState({ balances: data, totalValue, isLoaded: true });
        });
    } else {
      const balances = this.getBalancesCache(true);
      console.log("cached data ", JSON.parse(balances));
      const newBalances = JSON.parse(balances);
      const totalValue = newBalances.balances.reduce(totalReducer, totalacc);
      this.setState({
        totalValue,
        balances: newBalances.balances,
        isLoaded: true,
      });
    }
  }

  async disconnect() {
    this.setState({
      address: null,
      stargateClient: null,
    });
  }

  suggestChain(network) {
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
  }

  getValidatorImage(network, validatorAddress, expireCache) {
    const images = this.state.validatorImages[network.name] || {};
    if (images[validatorAddress]) {
      return images[validatorAddress];
    }
    return this.getValidatorImageCache(validatorAddress, expireCache);
  }

  getValidatorImageCache(validatorAddress, expireCache) {
    const cache = localStorage.getItem(validatorAddress);
    if (!cache) return;

    let cacheData = {};
    try {
      cacheData = JSON.parse(cache);
    } catch {
      cacheData.url = cache;
    }
    if (!cacheData.url) return;
    if (!expireCache) return cacheData.url;

    const cacheTime = cacheData.time && new Date(cacheData.time);
    if (!cacheData.time) return;

    const expiry = new Date() - 1000 * 60 * 60 * 24 * 3;
    if (cacheTime >= expiry) return cacheData.url;
  }

  async loadValidatorImages(network, validators) {
    this.setState((state, props) => ({
      validatorImages: _.set(
        state.validatorImages,
        network.name,
        state.validatorImages[network.name] || {}
      ),
    }));
    const calls = Object.values(validators).map((validator) => {
      return () => {
        if (
          validator.description.identity &&
          !this.getValidatorImage(network, validator.operator_address, true)
        ) {
          return fetch(
            "https://keybase.io/_/api/1.0/user/lookup.json?fields=pictures&key_suffix=" +
              validator.description.identity
          )
            .then((response) => {
              return response.json();
            })
            .then(
              (data) => {
                if (data.them && data.them[0] && data.them[0].pictures) {
                  const imageUrl = data.them[0].pictures.primary.url;
                  this.setState((state, props) => ({
                    validatorImages: _.set(
                      state.validatorImages,
                      [network.name, validator.operator_address],
                      imageUrl
                    ),
                  }));
                  localStorage.setItem(
                    validator.operator_address,
                    JSON.stringify({ url: imageUrl, time: +new Date() })
                  );
                }
              },
              (error) => {}
            );
        } else {
          return null;
        }
      };
    });
    const batchCalls = _.chunk(calls, 1);

    for (const batchCall of batchCalls) {
      await Promise.all(batchCall.map((call) => call()));
    }
  }

  async getBalance() {
    this.state.queryClient
      .getBalance(this.state.address, this.props.network.denom)
      .then((balance) => {
        this.setState({
          balance: balance,
        });
      });
  }

  setCopied() {
    this.setState({ copied: true });
    setTimeout(() => {
      this.setState({ copied: false });
    }, 2000);
  }

  render() {
    return (
      <Container>
        <header className="d-flex flex-wrap justify-content-between py-3 mb-4 border-bottom">
          <div className="logo d-flex align-items-center mb-3 mb-md-0 text-dark text-decoration-none">
            <img src={StakeFriteLogoLong} height="75" alt="Stake Frites" />
          </div>
          <div className="d-flex align-items-center mb-3 mb-md-0 text-dark text-decoration-none">
            <NetworkSelect
              show={this.state.showNetworkSelect}
              onHide={() => {
                this.setState({ showNetworkSelect: false });
              }}
              networks={this.props.networks}
              network={this.props.network}
              validators={this.props.validators}
              getValidatorImage={this.getValidatorImage}
              changeNetwork={this.props.changeNetwork}
              loadValidatorImages={this.loadValidatorImages}
            />
          </div>
        </header>
        <div className="mb-5">
          <AlertMessage
            message={this.state.error}
            variant="danger"
            dismissible={false}
          />
          {!this.state.address &&
            (!this.state.keplr ? (
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
            ) : (
              <div className="mb-5 text-center">
                <Button onClick={this.connect}>Connect Keplr</Button>
              </div>
            ))}
          {this.state.address && (
            <>
              <SomeTracker
                address={this.state.address}
                getPortfolio={this.getPortfolio}
                isLoaded={this.state.isLoaded}
                balances={this.state.balances}
                total={this.state.totalValue}
                networks={this.props.networks}
                network={this.props.network}
                queryClient={this.state.queryClient}
              />
            </>
          )}
        </div>
        <footer className="d-flex flex-wrap justify-content-between align-items-center py-3 my-4 border-top">
          <a
            href="https://akash.network"
            target="_blank"
            rel="noreferrer"
            className="col-md-4 mb-0 text-muted"
          >
            <img src={PoweredByAkash} alt="Powered by Akash" width={200} />
          </a>
          <p className="col-md-4 d-flex align-items-center justify-content-center me-lg-auto">
            <span className="d-none d-sm-inline me-1">
              Built with 🧡&nbsp; by
            </span>{" "}
            <a
              href="https://stakefrites.co/"
              className="link-dark text-decoration-none"
              target="_blank"
              rel="noreferrer"
            >
              Stake Frites (🥩,🍟)&nbsp;
            </a>
            and&nbsp;
            <a
              className="link-dark text-decoration-none"
              href="https://ecostake.com"
              target="_blank"
              rel="noreferrer"
            >
              {" "}
              ECO Stake 🌱
            </a>
          </p>
          <div className="col-md-3" align="right">
            <a
              href="https://twitter.com/stakefrites_"
              alt="Twitter"
              target="_blank"
              rel="noreferrer"
              className="link-dark text-decoration-none"
            >
              <Twitter color="black" size={24} />
            </a>
            <a
              href="https://github.com/stakefrites"
              alt="Github"
              target="_blank"
              rel="noreferrer"
              style={{ marginLeft: "10px" }}
              className="link-dark text-decoration-none"
            >
              <Github color="black" size={24} />
            </a>
          </div>
        </footer>
        <About
          show={this.state.showAbout}
          onHide={() => this.setState({ showAbout: false })}
        />
      </Container>
    );
  }
}

export default App;
