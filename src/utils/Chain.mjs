import axios from "axios";

import _ from "lodash";

import { uniqueArray } from "./Helpers.mjs";

const Chain = async (data) => {
  const getChainData = () => {
    return axios
      .get("https://registry.cosmos.directory/" + data.name + "/chain")
      .then((res) => res.data);
  };

  const getTokenData = async () => {
    return axios
      .get("https://registry.cosmos.directory/" + data.name + "/assetlist")
      .then((res) => res.data);
  };

  const chainData = await getChainData();
  const tokenData = await getTokenData();

  const getChainInfo = () => {
    return {
      prettyName: data.prettyName || chainData.pretty_name,
      chainId: data.chainId || chainData.chain_id,
      prefix: data.prefix || chainData.bech32_prefix,
      slip44: data.slip44 || chainData.slip44 || 118,
    };
  };

  const getTokenInfo = () => {
    const asset = tokenData.assets[0];
    const base = asset.denom_units.find((el) => el.denom === asset.base);
    const token = asset.denom_units.find((el) => el.denom === asset.display);
    return {
      denom: data.denom || base.denom,
      symbol: data.symbol || token.denom,
      decimals: data.decimals || token.exponent || 6,
      image:
        data.image ||
        (asset.logo_URIs && (asset.logo_URIs.png || asset.logo_URIs.svg)),
      coingecko_id: asset.coingecko_id,
    };
  };

  const { prettyName, chainId, prefix, slip44 } = getChainInfo();

  const { denom, symbol, decimals, image, coingecko_id } = getTokenInfo();

  return {
    tokenData: getTokenData(),
    tokenInfo: getTokenInfo(),
    prettyName,
    chainId,
    prefix,
    slip44,
    denom,
    symbol,
    decimals,
    image,
    coingecko_id,
    tokenData,
  };
};

export default Chain;
