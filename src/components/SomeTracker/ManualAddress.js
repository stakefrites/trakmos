import React from "react";
import { Card, Form, Button } from "react-bootstrap";

import SavedAccounts from "./SavedAccounts";

const ManualAddress = (props) => {
  return (
    <Card>
      <Card.Body>
        {keplr ? (
          <>
            <Button onClick={props.connect}>Connect Keplr</Button>
            <hr />
          </>
        ) : (
          ""
        )}
        <Form className="manual-address" onSubmit={props.handleSubmit}>
          <Form.Group className="mb-3" controlId="formBasicEmail">
            <Form.Label>Enter any $COSMOS address</Form.Label>
            <Form.Control
              type="text"
              value={props.newAddress}
              onChange={props.handleManualAddress}
              placeholder="osmo1eh... or cosmos1eh..."
            />
          </Form.Group>
          <Button variant="primary" type="submit">
            Submit
          </Button>
        </Form>
        <SavedAccounts {...props} />
      </Card.Body>
    </Card>
  );
};

export default ManualAddress;
