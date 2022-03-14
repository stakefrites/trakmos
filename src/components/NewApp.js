import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import React from "react";
import _ from "lodash";
import AlertMessage from "./AlertMessage";
import NetworkSelect from "./NetworkSelect";
import Wallet from "./Wallet";
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

const NewApp = (props) => {
  const getPricesCache = async (prices, expireCache) => {
    const allCache = prices
      .map(([name, config]) => {
        //console.log("cahche cibfgig", config);
        const cache = localStorage.getItem(config.coingecko_id);
        //console.log("cache item", cache);

        if (!cache) {
          return;
        }
        let cacheData = {};
        try {
          cacheData = JSON.parse(cache);
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
      })
      .filter((price) => {
        if (price == undefined) {
          //skip
        } else {
          return true;
        }
      });
    console.log("allcache", allCache);
    return allCache;
  };

  const getPrices = async (hardRefresh) => {
    const networks = Object.entries(this.props.networks);
    const networksCache = await this.getPricesCache(networks);
    const noCache = networksCache.length == 0 ? true : false;
    console.log("Do wwe get data?", noCache, noCache);
    if (noCache) {
      console.log("THERE WAS NO CACHE");
      const prices = await this.state.queryClient.getPrice(networks);
      const pricesData = _.keyBy(prices, "coingecko_id");
      console.log("prices", prices, "pricesData", pricesData);
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
  };
  return <h1>Allo</h1>;
};
