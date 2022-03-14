import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import React from "react";
import _ from "lodash";
import AlertMessage from "./modules/AlertMessage";
import NetworkSelect from "./NetworkSelect";
import Wallet from "./Stake/Wallet";
import SomeTracker from "./SomeTracker/SomeTracker";
import Coins from "./modules/Coins";
import ValidatorLink from "./Stake/ValidatorLink";
import About from "./About";
import { Bech32 } from "@cosmjs/encoding";

import { MsgGrant, MsgRevoke } from "cosmjs-types/cosmos/authz/v1beta1/tx.js";

import { Container, Button, Badge, Form } from "react-bootstrap";
import { CopyToClipboard } from "react-copy-to-clipboard";

import PoweredByAkash from "../assets/powered-by-akash.svg";
import { Twitter, Github } from "react-bootstrap-icons";
import StakeFriteLogo from "../assets/Sigle_Stake_house@2x.png";
import StakeFriteLogoLong from "../assets/Logo_Stake_house_VF_150.png";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      validatorImages: {},
      address: "",
      balances: [],
      prices: false,
    };
    this.connect = this.connect.bind(this);
    this.getPortfolio = this.getPortfolio.bind(this);
    this.getPrices = this.getPrices.bind(this);
    this.getPricesCache = this.getPricesCache.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.getBalancesCache = this.getBalancesCache.bind(this);
    this.handleManualAddress = this.handleManualAddress.bind(this);
    this.showNetworkSelect = this.showNetworkSelect.bind(this);
    this.getValidatorImage = this.getValidatorImage.bind(this);
    this.loadValidatorImages = this.loadValidatorImages.bind(this);
  }

  async componentDidMount() {
    await this.setNetwork();
    window.onload = async () => {
      if (!window.keplr) {
        this.setState({ keplr: false });
        this.getPrices();
      } else {
        this.setState({ keplr: true });
        console.log("Connecting with Keplr", this.state.address);
        this.connect();
      }
    };
    this.getPrices();
    window.addEventListener("keplr_keystorechange", this.connect);
    /* if (this.props.operators) {
      this.loadValidatorImages(
        this.props.network,
        _.compact(this.props.operators.map((el) => el.validatorData))
      );
    } */
    //this.loadValidatorImages(this.props.network, this.props.validators);
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

  handleSubmit(e) {
    e.preventDefault();
    const isValid = Bech32.decode(this.state.newAddress);
    console.log("ISVALID", isValid);
    this.setState({ address: this.state.newAddress });
  }

  handleManualAddress(e) {
    this.setState({ newAddress: e.target.value });
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
    this.setState({ showNetworkSelect: true });
  }

  async connect() {
    //console.trace("In connect Method", this.props);
    if (!this.props.network.connected) {
      return this.setState({
        error: "Could not connect to any available API servers",
      });
    }
    const chainId = this.props.network.chainId;
    try {
      await window.keplr.enable(chainId);
      console.log("Keplr enables");
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
      this.getPrices();
      this.getBalance();
      this.getPortfolio();
    }
  }

  getBalancesCache(expireCache) {
    const cache = localStorage.getItem(this.state.address);

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

  getPricesCache(prices, expireCache) {
    //console.trace("Getting prices", prices);
    const allCache = prices.map(([name, config]) => {
      //console.log("cache config", config);
      const cache = localStorage.getItem(config.coingecko_id);
      //console.log("cache item", cache);

      if (!cache) {
        console.log("!cache");
        return;
      }
      let cacheData = {};
      try {
        cacheData = JSON.parse(cache);
        //console.log("cache data json parse getprices cache", cacheData);
        const price = JSON.parse(cacheData.price);
        cacheData.price = price;
        cache = cacheData;
      } catch {
        cacheData = cache;
      }

      if (!cacheData.price) {
      }

      if (!expireCache) {
        console.log("not expired", JSON.parse(cacheData).price);
        return JSON.parse(cacheData).price;
      }
      if (!expireCache) return JSON.parse(cacheData);

      const cacheTime = cacheData.time && new Date(cacheData.time);
      if (!cacheData.time) return;

      //const expiry = new Date() - 1000 * 60 * 60 * 24 * 3;
      const expiry = new Date() - 1000 * 60 * 5;
      if (cacheTime >= expiry) {
        return cache.price;
      }
    });

    if (allCache.includes(undefined)) {
      return false;
    } else {
      console.log("allcache", allCache);
      return allCache;
    }
  }

  async getPrices(hardRefresh) {
    const networks = Object.entries(this.props.networks);
    const networksCache = await this.getPricesCache(networks);
    if (networksCache == false) {
      console.log("THERE WAS NO CACHE");
      const prices = await this.state.queryClient.getPrice(networks);
      console.log("prices in App.js/getPrices", prices);
      const pricesData = _.keyBy(prices, "coingecko_id");
      console.log("pricesData in App.js/getPrices", pricesData);
      this.setState({ prices: pricesData });

      localStorage.setItem("prices", JSON.stringify(prices));
      const realPrices = prices.map((price) => {
        localStorage.setItem(
          price.coingecko_id,
          JSON.stringify({ price, time: +new Date() })
        );
      });
    } else {
      console.log("NOT getting prices... We have cache right?");
      console.log(networks, "networks", this.props.network);
      const prices = await this.getPricesCache(networks);
      console.log("cached data ", prices);
      const pricesData = _.keyBy(prices, "coingecko_id");
      this.setState({
        prices: pricesData,
      });
    }
  }
  getPortfolio(hardRefresh) {
    const totalacc = 0;
    const totalReducer = (acc, item) => {
      return acc + parseInt(item.value);
    };
    this.setState({ isLoaded: false });

    if (!this.getBalancesCache(true) || hardRefresh) {
      const networks = Object.entries(this.props.networks);
      console.log("querying with address", this.state.address);
      try {
        const portfolio = this.state.queryClient
          .getPortfolio(this.state.address, networks)
          .then((data) => {
            console.log(data);
            const totalValue = data.reduce(totalReducer, totalacc);
            localStorage.setItem(
              this.state.address,
              JSON.stringify({ balances: data, time: +new Date() })
            );
            this.setState({ balances: data, totalValue, isLoaded: true });
          });
        return portfolio;
      } catch (e) {
        console.log(e);
        return;
      }
    } else {
      const balances = this.getBalancesCache(true);
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
          <div className="invisible d-flex align-items-center mb-3 mb-md-0 text-dark text-decoration-none">
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
                  <hr />
                  <Form className="manual-address" onSubmit={this.handleSubmit}>
                    <Form.Group className="mb-3" controlId="formBasicEmail">
                      <Form.Label>Enter any $COSMOS address</Form.Label>
                      <Form.Control
                        type="text"
                        value={this.state.address}
                        onChange={this.handleManualAddress}
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
                <Button onClick={this.connect}>Connect Keplr</Button>
              </div>
            ))}
          {this.state.address && (
            <>
              <SomeTracker
                address={this.state.address}
                prices={
                  this.state.prices !== false
                    ? _.keyBy(this.state.prices, "coingecko_id")
                    : this.state.prices
                }
                getPortfolio={this.getPortfolio}
                isLoaded={this.state.isLoaded}
                setLoaded={() => {
                  this.setState({ isLoaded: false });
                }}
                balances={this.state.balances}
                networks={this.props.networks}
                network={this.props.network}
                queryClient={this.state.queryClient}
              />
            </>
          )}
        </div>
        <footer className="align-items-center py-3 my-4 border-top row">
          <div className="col-md-4 col-sm-12 col-12 mt-2">
            <a
              href="https://akash.network"
              target="_blank"
              rel="noreferrer"
              className="col-md-4 mb-0 text-muted"
            >
              <img src={PoweredByAkash} alt="Powered by Akash" width={200} />
            </a>
          </div>
          <div className="col-lg-6 col-md-6 col-sm-12 col-12 mt-2">
            <span>Built with 🧡&nbsp;by</span>
            <a
              href="https://stakefrites.co/"
              className="link-dark text-decoration-none"
              target="_blank"
              rel="noreferrer"
            >
              Stake Frites (🥩,🍟)&nbsp;
            </a>
            <span>and&nbsp;</span>
            <a
              className="link-dark text-decoration-none"
              href="https://ecostake.com"
              target="_blank"
              rel="noreferrer"
            >
              ECO Stake 🌱
            </a>
          </div>
          <div className="col-lg-2 col-md-2 col-sm-12 col-12 mt-2">
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
