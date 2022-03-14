import React, { useEffect, useState } from "react";
import { Container, Button } from "react-bootstrap";
import Table from "react-bootstrap/Table";
import currency from "currency.js";
import { CashStack } from "react-bootstrap-icons";

const Intake = (props) => {
  console.log("Intake props:", props);
  const totalacc = 0;
  const totalReducer = (acc, item) => {
    const thisTotal = parseInt(item.total);
    const thisValue = thisTotal * props.prices[item.coingecko_id].price;
    return acc + thisValue;
  };
  const totalValue = props.balances.reduce(totalReducer, totalacc);
  console.log(totalValue);
  return (
    <>
      <Container fluid>
        <div className="col-12" align="right">
          <button className="btn btn-outline-dark total-box">
            <CashStack className="total-box-button" size={20} />
            <span> {currency(totalValue).format()}</span>
          </button>
        </div>
        <div className="col-12 mt-3">
          <Table striped bordered hover responsive variant="dark">
            <thead>
              <tr>
                <th>Price</th>
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
                const price = props.prices[bal.coingecko_id].price;
                const total = price * bal.total;
                console.log("rendering", bal);
                return (
                  <tr key={bal.chainAddress}>
                    <td>{currency(price).format()}</td>
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
                    <td>{currency(total).format()}</td>
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
