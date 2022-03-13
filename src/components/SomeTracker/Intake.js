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
                <th>LP</th>
                <th>Rewards</th>
                <th>Total</th>
                <th>USD$</th>
              </tr>
            </thead>
            <tbody>
              {props.balances.map((bal) => {
                const total = parseFloat(bal.staked) + bal.rewards + bal.liquid;
                console.log(
                  "this is total",
                  total,
                  parseFloat(bal.staked),
                  bal.rewards
                );
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
                    <td>{bal.lp}</td>
                    <td>{bal.rewards}</td>
                    <td>{total}</td>
                    <td></td>
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
