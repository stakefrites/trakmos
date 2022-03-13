import React, { useEffect, useState } from "react";
import Intake from "./Intake";
import { Spinner } from "react-bootstrap";
import Button from "react-bootstrap/Button";
import { ArrowClockwise } from "react-bootstrap-icons";

function SomeTracker(props) {
  const [interval, setStateInterval] = useState();
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState();
  useEffect(() => {
    // Your code here
    // Add a function that should get data onLoad
    //this.getDelegations();
    refresh();
    refreshInterval();
  }, []);

  function refresh(hardRefresh) {
    props.getPortfolio(hardRefresh);
    refreshInterval();
  }

  function hardRefresh() {
    localStorage.removeItem("balances");
    setIsLoaded(false);
    refresh(true);
  }

  function refreshInterval() {
    const interval = setInterval(() => {
      props.getPortfolio();
    }, 300_000);
    setStateInterval(interval);
  }

  if (!props.isLoaded) {
    return (
      <div className="text-center">
        <p>
          We are currently loading all your balances. <br />
          Please wait.
          <br /> It is still quicker than switching on all your accounts in
          Keplr
        </p>
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
  return (
    <>
      <p className="text-center">
        <Button
          onClick={hardRefresh}
          variant="outline-secondary"
          className="mb-3"
        >
          Refresh <ArrowClockwise color="black" size={16} />
        </Button>
      </p>
      <Intake balances={props.balances} total={props.total} {...props} />
    </>
  );
}

export default SomeTracker;
