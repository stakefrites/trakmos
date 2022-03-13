import React, { useEffect, useState } from "react";
import Intake from "./Intake";
import { Spinner } from "react-bootstrap";

const SomeTracker = (props) => {
  const [interval, setInterval] = useState();
  const [setIsLoaded, isLoaded] = useState(false);
  const [setError, error] = useState();
  useEffect(() => {
    // Your code here
    // Add a function that should get data onLoad
    //this.getDelegations();
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
    return <Intake />;
  }
  return <Intake></Intake>;
};

export default SomeTracker;
