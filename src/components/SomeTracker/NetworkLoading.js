import React from "react";
import { ProgressBar } from "react-bootstrap";

const NetworkLoading = (props) => {
  return (
    <div className="pt-5 text-center">
      <p> Loading networks</p>
      <ProgressBar animated now={75} />
    </div>
  );
};

export default NetworkLoading;
