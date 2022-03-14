import React, { useEffect, useState } from "react";
import Intake from "./Intake";
import Button from "react-bootstrap/Button";
import { ArrowClockwise } from "react-bootstrap-icons";

function SomeTracker(props) {
  if (props.error) {
    return (
      <>
        <p>ERROR</p>
      </>
    );
  }
  if (props == undefined) {
    return (
      <>
        <p>Error</p>
      </>
    );
  } else {
    return (
      <>
        <p className="text-center">
          <Button
            onClick={props.hardRefresh}
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
}

export default SomeTracker;
