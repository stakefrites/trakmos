import React, { useEffect, useState } from "react";
import Intake from "./Intake";
import { Spinner } from "react-bootstrap";

const SomeTracker = (props) => {
  const [interval, setInterval] = useState();
  const [setIsLoaded, isLoaded] = useState(false);
  const [setError, error] = useState();

  const { queryClient, address } = props;
  useEffect(async () => {
    // Your code here
    // Add a function that should get data onLoad
    //this.getDelegations();
    console.log(
      await queryClient.address(address, [
        {
          chain: "Osmosis",
          prefix: "osmo",
          rpcUrl: "https://rpc.cosmos.directory/osmosis",
        },
        {
          chain: "Cosmos Hub",
          prefix: "cosmos",
          rpcUrl: "https://rpc.cosmos.directory/cosmoshub",
        },
        {
          chain: "Akash",
          prefix: "akash",
          rpcUrl: "https://rpc.cosmos.directory/akash",
        },
        {
          chain: "Sif Chain",
          prefix: "sif",
          rpcUrl: "https://rpc.cosmos.directory/sifchain",
        },
        {
          chain: "Chihuahua",
          prefix: "chihuahua",
          rpcUrl: "https://rpc.cosmos.directory/chihuahua",
        },
        {
          chain: "Juno",
          prefix: "juno",
          rpcUrl: "https://rpc.cosmos.directory/juno",
        },
      ])
    );
    refreshInterval();
  }, []);

  function refreshInterval() {
    const interval = setInterval(() => {
      //Add a function that should be reloaded (Addresses)
      //this.getDelegations(true);
    }, 30_000);
    //setIsLoaded(true);
    setInterval(interval);
  }
  if (!isLoaded) {
    return (
      <div className="text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }
  if (error) {
    return <Intake {...props} />;
  }
  return <Intake {...props}></Intake>;
};

export default SomeTracker;
