import axios from "axios";
import _ from "lodash";
import { findAsync } from "./Helpers.mjs";
import {
  setupStakingExtension,
  QueryClient as CosmjsQueryClient,
  setupBankExtension,
  setupDistributionExtension,
  setupMintExtension,
  setupGovExtension,
} from "@cosmjs/stargate";
import Chain from "./Chain.mjs";

import { Tendermint34Client } from "@cosmjs/tendermint-rpc";
import { Bech32 } from "@cosmjs/encoding";

const QueryClient = async (chainId, rpcUrls, restUrls) => {
  const rpcUrl = await findAvailableUrl(
    Array.isArray(rpcUrls) ? rpcUrls : [rpcUrls],
    "rpc"
  );
  const restUrl = await findAvailableUrl(
    Array.isArray(restUrls) ? restUrls : [restUrls],
    "rest"
  );

  /**
   * Make Client
   *
   * @returns QueryClient with necessary extensions
   */
  const makeClient = async (rpcUrl) => {
    const tmClient = await Tendermint34Client.connect(rpcUrl);
    return CosmjsQueryClient.withExtensions(
      tmClient,
      setupStakingExtension,
      setupBankExtension,
      setupDistributionExtension,
      setupMintExtension,
      setupGovExtension
    );
  };

  const getAllValidators = (pageSize, pageCallback) => {
    return getAllPages((nextKey) => {
      return getValidators(pageSize, nextKey);
    }, pageCallback).then((pages) => {
      const validators = _.shuffle(pages.map((el) => el.validators).flat());
      return validators.reduce(
        (a, v) => ({ ...a, [v.operator_address]: v }),
        {}
      );
    });
  };

  const getValidators = (pageSize, nextKey) => {
    const searchParams = new URLSearchParams();
    searchParams.append("status", "BOND_STATUS_BONDED");
    if (pageSize) searchParams.append("pagination.limit", pageSize);
    if (nextKey) searchParams.append("pagination.key", nextKey);
    return axios
      .get(
        restUrl +
          "/cosmos/staking/v1beta1/validators?" +
          searchParams.toString()
      )
      .then((res) => res.data);
  };

  const getBalance = (address, denom) => {
    return axios
      .get(restUrl + "/cosmos/bank/v1beta1/balances/" + address)
      .then((res) => res.data)
      .then((result) => {
        const balance = result.balances.find(
          (element) => element.denom === denom
        ) || { denom: denom, amount: 0 };
        return balance;
      });
  };

  const getDelegations = (address) => {
    return axios
      .get(restUrl + "/cosmos/staking/v1beta1/delegations/" + address)
      .then((res) => res.data)
      .then((result) => {
        const delegations = _.shuffle(result.delegation_responses).reduce(
          (a, v) => ({ ...a, [v.delegation.validator_address]: v }),
          {}
        );
        return delegations;
      });
  };

  const getRewards = (address) => {
    return axios
      .get(
        restUrl +
          "/cosmos/distribution/v1beta1/delegators/" +
          address +
          "/rewards"
      )
      .then((res) => res.data)
      .then((result) => {
        const rewards = result.rewards.reduce(
          (a, v) => ({ ...a, [v.validator_address]: v }),
          {}
        );
        return rewards;
      });
  };

  const getGrants = (botAddress, address) => {
    const searchParams = new URLSearchParams();
    searchParams.append("grantee", botAddress);
    searchParams.append("granter", address);
    // searchParams.append("msg_type_url", "/cosmos.staking.v1beta1.MsgDelegate");
    return axios
      .get(restUrl + "/cosmos/authz/v1beta1/grants?" + searchParams.toString())
      .then((res) => res.data)
      .then((result) => {
        const claimGrant = result.grants.find((el) => {
          if (
            el.authorization["@type"] ===
              "/cosmos.authz.v1beta1.GenericAuthorization" &&
            el.authorization.msg ===
              "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward"
          ) {
            return Date.parse(el.expiration) > new Date();
          } else {
            return false;
          }
        });
        const stakeGrant = result.grants.find((el) => {
          if (
            el.authorization["@type"] ===
            "/cosmos.staking.v1beta1.StakeAuthorization"
          ) {
            return Date.parse(el.expiration) > new Date();
          } else {
            return false;
          }
        });
        return {
          claimGrant,
          stakeGrant,
        };
      });
  };

  const getAllValidatorDelegations = (
    validatorAddress,
    pageSize,
    pageCallback
  ) => {
    return getAllPages((nextKey) => {
      return getValidatorDelegations(validatorAddress, pageSize, nextKey);
    }, pageCallback).then((pages) => {
      return pages.map((el) => el.delegation_responses).flat();
    });
  };

  const getValidatorDelegations = (validatorAddress, pageSize, nextKey) => {
    const searchParams = new URLSearchParams();
    if (pageSize) searchParams.append("pagination.limit", pageSize);
    if (nextKey) searchParams.append("pagination.key", nextKey);

    return axios
      .get(
        restUrl +
          "/cosmos/staking/v1beta1/validators/" +
          validatorAddress +
          "/delegations?" +
          searchParams.toString()
      )
      .then((res) => res.data);
  };

  const getAllPages = async (getPage, pageCallback) => {
    let pages = [];
    let nextKey, error;
    do {
      const result = await getPage(nextKey);
      pages.push(result);
      nextKey = result.pagination.next_key;
      if (pageCallback) pageCallback(pages);
    } while (nextKey);
    return pages;
  };

  function findAvailableUrl(urls, type) {
    const path = type === "rest" ? "/blocks/latest" : "/block";
    return Promise.any(
      urls.map((url) => {
        return axios
          .get(url + path, { timeout: 10000 })
          .then((res) => res.data)
          .then((data) => {
            if (type === "rpc") data = data.result;
            if (!data.block.header.chain_id === chainId) {
              throw false;
            }
            return url;
          });
      })
    );
  }

  const getPrice = (coinGeckoId) => {
    return axios
      .get("https://api.coingecko.com/api/v3/simple/price", {
        params: {
          ids: coinGeckoId,
          vs_currencies: "usd",
        },
      })
      .then((data) => data.data[coinGeckoId].usd);
  };

  const getPortfolio = async (a, chains) => {
    const bech = Bech32.decode(a);
    const portfolio = [];
    for (let chainInst of chains) {
      const [chainName, chainConfig] = chainInst;
      const chainIml = await Chain(chainConfig);
      const rpcUrls = chainIml.chainData.apis.rpc.map((url) => url.address);
      const rpcUrl = await findAvailableUrl(
        Array.isArray(rpcUrls) ? rpcUrls : [rpcUrls],
        "rpc"
      );
      const price = parseFloat(await getPrice(chainIml.coinGeckoId));
      const client = await makeClient(rpcUrl);
      const { prefix } = chainIml;
      const chainAddress = Bech32.encode(prefix, bech.data);
      const rewardsReq = await client.distribution.delegationTotalRewards(
        chainAddress
      );
      const liquid = await client.bank.allBalances(chainAddress);
      let staked;
      try {
        staked = await client.staking.delegatorDelegations(chainAddress);
      } catch (error) {
        staked = { delegationResponses: [] };
      }
      console.log("staked", chainIml.prettyName, staked);
      const stakingAcc = 0;
      const rewardsAcc = 0;

      const stakedReducer = (acc, item) => {
        return acc + parseInt(item.balance.amount);
      };

      const rewardsReducer = (acc, item) => {
        if (item.reward.length == 0) {
          return 0;
        } else {
          return acc + parseInt(item.reward[0].amount);
        }
      };

      const totalTokensStaked =
        staked.delegationResponses.length == 0
          ? 0
          : staked.delegationResponses.reduce(stakedReducer, stakingAcc);

      const totalTokensRewards =
        rewardsReq.rewards.length == 0
          ? 0
          : rewardsReq.rewards.reduce(rewardsReducer, rewardsAcc);
      console.log(chainAddress, "Total staked", totalTokensStaked);

      const liquidBal = liquid.find((val) =>
        val.denom == chainIml.denom ? true : false
      );
      const rewards = totalTokensRewards / 1000000000000000000000000;
      const stakedBalance = (totalTokensStaked / 1000000).toFixed(2);
      const liquidBalance = liquidBal
        ? (parseFloat(liquidBal.amount) / 1000000).toFixed(2)
        : 0;
      const total =
        rewards + parseFloat(stakedBalance) + parseFloat(liquidBalance);
      console.log(total);
      const data = {
        name: chainIml.chainData.chain_name,
        rewards,
        staked: parseFloat(stakedBalance),
        liquid: parseFloat(liquidBalance),
        total,
        chainAddress,
        value: total * price,
      };
      portfolio.push(data);
    }
    return portfolio;
  };

  return {
    connected: !!rpcUrl && !!restUrl,
    rpcUrl,
    restUrl,
    getAllValidators,
    getValidators,
    getAllValidatorDelegations,
    getValidatorDelegations,
    getBalance,
    getDelegations,
    getRewards,
    getGrants,
    getPortfolio,
  };
};

export default QueryClient;
