import React, { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import Table from "react-bootstrap/Table";

const Intake = (props) => {
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
              </tr>
            </thead>
            <tbody>
              {props.balances.map((bal) => {
                const total =
                  parseFloat(bal.staked) +
                  parseFloat(bal.rewards) +
                  parseFloat(bal.liquid);
                return (
                  <tr key={bal.address}>
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
                    <td>{total.toFixed(2)}</td>
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
