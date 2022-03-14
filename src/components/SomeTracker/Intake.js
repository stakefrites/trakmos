import React, { useEffect, useState } from "react";
import { Container, Button } from "react-bootstrap";
import Table from "react-bootstrap/Table";
import currency from "currency.js";
import { CashStack } from "react-bootstrap-icons";

const Intake = (props) => {
  console.log("Intake props:", props);
  return (
    <>
      <Container fluid>
        <div className="col-12" align="right">
          <button className="btn btn-outline-dark total-box"><CashStack className="total-box-button" size={20}/><span> {currency(props.total).format()}</span></button>
        </div>
        <div className="col-12 mt-3">
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
                    <td>{currency(bal.value).format()}</td>
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
