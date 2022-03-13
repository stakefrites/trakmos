import React, { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import Table from "react-bootstrap/Table";

const Intake = (props) => {
  console.log(props);
  return (
    <>
      <Container fluid>
        <div>
          <Table striped bordered hover responsive variant="dark">
            <thead>
              <tr>
                <th>Chain</th>
                <th>Balance</th>
                <th>Delegated</th>
                <th>Rewards</th>
                <th>Total</th>
                <th>Value (in USD)</th>
              </tr>
            </thead>
            <tbody>
              {props.balances.map((bal) => {
                console.log("rendering", bal);
                return (
                  <tr key={bal.chainAddress}>
                    <td width="auto">
                      <img
                        src={props.networks[bal.name].image}
                        height="30"
                        width="30"
                      />
                    </td>
                    <td>{bal.liquid}</td>
                    <td>{bal.staked}</td>
                    <td>{bal.rewards.toFixed(2)}</td>
                    <td>{bal.total.toFixed(2)}</td>
                    <td>{bal.value.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
      </Container>
    </>
  );
};
export default Intake;
