import _ from "lodash";
import React, { useEffect, useState } from "react";

import { useLocalStorage } from "../hooks/hooks.js";

function PricesProvider(props) {
  const [error, setError] = useState(false);
  //const [prices, setPrices] = useLocalStorage("prices", []);
  const [prices, setPrices] = useState();
  const [isPricesLoading, setIsPricesLoading] = useState(true);

  const getPrices = async (networks, hardRefresh) => {
    console.log(networks);
    const network = networks[0];

    setIsPricesLoading(true);

    const pricesData = await network.queryClient.getPrice(networks);
    setPrices(pricesData);
    pricesData.map((price) => {
      localStorage.setItem(
        price.coingecko_id,
        JSON.stringify({ price: price, time: +new Date() })
      );
    });
    setPrices(pricesData);

    setIsPricesLoading(false);
  };

  useEffect(() => {
    console.log("reloading");
    if (props.networks) {
      getPrices(Object.values(props.networks));
    }
    console.log(props);
  }, [props.networks]);

  if (error) {
    return <p>Loading failed</p>;
  }
  return (
    <>
      {React.cloneElement(props.children, {
        prices: _.keyBy(prices, "coingecko_id"),
        isPricesLoading,
      })}
    </>
  );
}

export default PricesProvider;
