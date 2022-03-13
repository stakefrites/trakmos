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
    return findAsync(urls, (url) => {
      return axios
        .get(url + path, { timeout: 2000 })
        .then((res) => res.data)
        .then((data) => {
          if (type === "rpc") data = data.result;
          return data.block.header.chain_id === chainId;
        })
        .catch((error) => {
          return false;
        });
    });
  }

  const getPortfolio = async (a, chains) => {
    const bech = Bech32.decode(a);
    const portfolio = [];
    for (chain of chains) {
      console.log("chain", chain);
      const [chainName, chainConfig] = chain;
      const chainIml = await Chain(chainConfig);
      console.log("chainIMPL", chainIml);
      console.log("chainName", chainName, chainConfig);

      const { rpcUrl } = chainConfig;
      console.log(rpcUrls);
      let rpc;
      if (typeof rpcUrl == String) {
        console.log("Is a string");
        rpc = rpcUrl;
      } else {
        console.log("Is an array", rpcUrls);
        rpc = rpcUrl[0];
        console.log("RPC from Array", rpc);
      }
      console.log(rpc);
      const client = await makeClient(rpc);
      const { prefix } = chainIml;
      const chainAddress = Bech32.encode(prefix, bech.data);
      console.log(chainAddress);
      const rewards = await client.distribution.delegationTotalRewards(
        chainAddress
      );
      const liquid = await client.bank.allBalances(chainAddress);
      const staked = await client.staking.delegatorDelegations(chainAddress);
      let totalStaked = 0;
      for (stake of staked.delegationResponses) {
        console.log("loop stake:", stake, stake.balance.amount);
        totalStaked += stake.balance.amount;
      }
      console.log("staked", JSON.stringify(staked), totalStaked);
      const stakingRewards = rewards.total.find((val) =>
        val.denom == chainIml.denom ? true : false
      );
      const liquidBalance = liquid.find((val) =>
        val.denom == chainIml.denom ? true : false
      );
      const stakedBalance = staked.delegationResponses.find((val) =>
        val.balance.denom == chainIml.denom ? true : false
      );
      console.log("chainStaked", stakingRewards);
      const data = {
        name: chainName,
        rewards: stakingRewards.amount / 1000000000000000000000000,
        staked: (stakedBalance.balance.amount / 1000000).toFixed(2),
        liquid: (liquidBalance.amount / 1000000).toFixed(2),
        chainAddress,
      };
      portfolio.push(data);
      console.log(chainAddress, data);
    }
    console.log("Portfolio", portfolio);
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
