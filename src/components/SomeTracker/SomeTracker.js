import React, { useEffect, useState } from "react";
import Intake from "./Intake";
import { Spinner } from "react-bootstrap";
import { json } from "stream/consumers";

function SomeTracker(props) {
  const [interval, setInterval] = useState();
  const [setIsLoaded, isLoaded] = useState(false);
  const [setError, error] = useState();
  const [balances, setBalances] = useState();
  //console.log(props.queryClient.address);
  useEffect(() => {
    // Your code here
    // Add a function that should get data onLoad
    //this.getDelegations();
    getPortfolio(setBalances);
    refreshInterval();
  }, []);
  useEffect(() => {
    // action on update of movies
  }, []);

  function getPortfolio(f) {
    const networks = Object.entries(props.networks);
    const portfolio = queryClient
      .getPortfolio(address, networks)
      .then((data) => {
        f(data);
      });
  }
  function refreshInterval() {
    const interval = setInterval(() => {
      //Add a function that should be reloaded (Addresses)
      //this.getDelegations(true);
      //getPortfolio();
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
    return (
      <>
        <Intake {...props} />
      </>
    );
  }
  return <h1>{JSON.stringify(balances)}</h1>;
}

export default SomeTracker;
