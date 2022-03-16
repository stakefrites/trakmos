import axios from "axios";
import _ from "lodash";
import { findAsync, mapAsync } from "./Helpers.mjs";
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

function parseCommissionRate(validator) {
  return (
    parseInt(validator.commission.commission_rates.rate) / 1000000000000000000
  );
}

function duration(epochs, epochIdentifier) {
  const epoch = epochs.find((epoch) => epoch.identifier === epochIdentifier);
  if (!epoch) {
    return 0;
  }

  // Actually, the date type of golang protobuf is returned by the unit of seconds.
  return parseInt(epoch.duration.replace("s", ""));
}

const QueryClient = async (chainId, rpcUrls, restUrls) => {
  const rpcUrl = await findAvailableUrl(
    Array.isArray(rpcUrls) ? rpcUrls : [rpcUrls],
    "rpc"
  );
  const restUrl = await findAvailableUrl(
    Array.isArray(restUrls) ? restUrls : [restUrls],
    "rest"
  );

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

  async function findAvailableUrl(urls, type) {
    const path = type === "rest" ? "/blocks/latest" : "/block";
    const promis = await Promise.any(
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
    if (promis.AggregateError) {
      console.log("Aggregate Error", promis);
      return false;
    }
    console.log("promiseAny", promis);
    return promis;
  }

  const getChainApr = async (denom) => {
    const client = await makeClient();
    const pool = await client.staking.pool();
    const supply = await client.bank.supplyOf(denom);
    const bondedTokens = pool.pool.bondedTokens;
    const totalSupply = supply.amount;
    if (chainId.startsWith("osmosis")) {
      const apr = await osmosisApr(totalSupply, bondedTokens);
      return apr;
    } else if (chainId.startsWith("sifchain")) {
      const aprRequest = await axios.get(
        "https://data.sifchain.finance/beta/validator/stakingRewards"
      );
      const apr = aprRequest.data.rate;
      return apr;
    } else {
      const req = await client.mint.inflation();
      const baseInflation = req.toFloatApproximation();
      const ratio = bondedTokens / totalSupply;
      const apr = baseInflation / ratio;
      return apr;
    }
  };

  const osmosisApr = async (totalSupply, bondedTokens) => {
    const mintParams = await axios.get(
      restUrl + "/osmosis/mint/v1beta1/params"
    );
    const osmosisEpochs = await axios.get(
      restUrl + "/osmosis/epochs/v1beta1/epochs"
    );
    const epochProvisions = await axios.get(
      restUrl + "/osmosis/mint/v1beta1/epoch_provisions"
    );
    const { params } = mintParams.data;
    const { epochs } = osmosisEpochs.data;
    const { epoch_provisions } = epochProvisions.data;
    const mintingEpochProvision =
      parseFloat(params.distribution_proportions.staking) * epoch_provisions;
    const epochDuration = duration(epochs, params.epoch_identifier);
    const yearMintingProvision =
      (mintingEpochProvision * (365 * 24 * 3600)) / epochDuration;
    const baseInflation = yearMintingProvision / totalSupply;
    const bondedRatio = bondedTokens / totalSupply;
    const apr = baseInflation / bondedRatio;
    console.log(
      params,
      epochs,
      mintingEpochProvision,
      epochDuration,
      yearMintingProvision,
      baseInflation,
      bondedRatio,
      apr,
      "getting osmosis apr",
      epochProvisions,
      osmosisEpochs,
      mintParams,
      apr
    );
    return apr;
  };
  const getApy = async (validators, denom) => {
    const periodPerYear = 365;
    const chainApr = await getChainApr(denom);
    let validatorApy = {};
    for (const [address, validator] of Object.entries(validators)) {
      const realApr = chainApr * (1 - parseCommissionRate(validator));
      const apy = (1 + realApr / periodPerYear) ** periodPerYear - 1;
      validatorApy[address] = apy;
    }
    return validatorApy;
  };

  const getPrice = async (chains) => {
    console.log("QUEEERY CLIENT: chains in get price before map", chains);
    const asyncs = await mapAsync(chains, (chain) => {
      const { coingecko_id } = chain;
      if (coingecko_id !== undefined) {
        const datarr = axios.get(
          "https://api.coingecko.com/api/v3/simple/price",
          {
            params: {
              ids: coingecko_id,
              vs_currencies: "usd",
            },
          }
        );
        console.log("GetPrice in the coingecko return", datarr);
        return datarr;
      } else {
        return {};
      }
    });
    console.log("price asyncs", asyncs);
    const mappedRequest = asyncs.map((price, i) => {
      console.log("mapping request", price, i, chains);
      const configChain = chains[i];
      return {
        price:
          price.status === 200 ? price.data[configChain.coingecko_id].usd : 0,
        coingecko_id:
          price.status === 200 ? configChain.coingecko_id : configChain.name,
      };
    });
    console.log("asyncs", asyncs, "mapped", mappedRequest);
    return mappedRequest;
  };

  const getPortfolio = async (a, chains) => {
    const bech = Bech32.decode(a);
    const portfolio = [];
    for (let chain of chains) {
      const { decimals, prefix, coinGeckoId, denom, name } = chain;
      console.log("chain", chain);
      const chainAddress = Bech32.encode(prefix, bech.data);
      try {
        const client = await makeClient(chain.queryClient.rpcUrl);
        console.log("the client", client);
        const rewardsReq = await client.distribution.delegationTotalRewards(
          chainAddress
        );

        console.log("rewards req", rewardsReq);
        const liquid = await client.bank.allBalances(chainAddress);
        let staked;
        try {
          staked = await client.staking.delegatorDelegations(chainAddress);
        } catch (error) {
          staked = { delegationResponses: [] };
        }
        const stakingAcc = 0;
        const rewardsAcc = 0;

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
          val.denom == chain.denom ? true : false
        );
        const rewards = totalTokensRewards / Math.pow(10, decimals + 18);
        console.log(rewards, Math.pow(10, decimals + 18), totalTokensRewards);

        const stakedBalance = (
          totalTokensStaked / Math.pow(10, decimals)
        ).toFixed(2);
        const liquidBalance = liquidBal
          ? (parseFloat(liquidBal.amount) / Math.pow(10, decimals)).toFixed(2)
          : 0;
        const total =
          rewards + parseFloat(stakedBalance) + parseFloat(liquidBalance);
        console.log(total);
        const data = {
          name: chain.name,
          rewards,
          staked: parseFloat(stakedBalance),
          liquid: parseFloat(liquidBalance),
          coinGeckoId,
          total,
          chainAddress,
        };
        console.log("pushing", data);
        portfolio.push(data);
      } catch (e) {
        console.log(e);
        return;
      }
    }
    console.log("WERE RETURNIN FOLIO", portfolio);
    return portfolio;
  };

  return {
    connected: !!rpcUrl && !!restUrl,
    rpcUrl,
    restUrl,
    getAllValidators,
    getPrice,
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
