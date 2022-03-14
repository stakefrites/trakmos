import React, { useEffect, useState } from "react";
import { Container, Button } from "react-bootstrap";
import Table from "react-bootstrap/Table";
import currency from "currency.js";
import { CashStack } from "react-bootstrap-icons";

const Intake = (props) => {
  //console.log("Intake props:", props);
  const totalacc = 0;
  const totalReducer = (acc, item) => {
    const thisTotal = item.total;
    console.log("reducing in Intake", acc); //, item, thisTotal, props);
    return acc + props.prices === undefined
      ? 0
      : thisTotal * props.prices[item.coingecko_id].price;
  };
  let totalValue = 0;
  /* if (props.prices !== false) {
    console.log("props.prices not equal to false", props.prices);
    totalValue = props.balances.reduce(totalReducer, totalacc);
    console.log("totalValue", totalValue);
  } */
  const realBalances = props.balances.map((balance) => {
    console.log("mapping balances", balance);
    const thisPrice = props.prices[balance.coingecko_id].price;
    console.log(balance.total, thisPrice);
    totalValue += balance.total * thisPrice;
    return {
      ...balance,
      price: thisPrice,
      value: balance.total * thisPrice,
    };
  });
  console.log("real balances", realBalances, totalValue);
  return (
    <>
      <Container fluid>
        <div className="col-12" align="right">
          <p>{props.address}</p>
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
                let price;
                let total;
                if (props.price !== false) {
                  price = props.prices[bal.coingecko_id].price;
                  total = price * bal.total;
                } else {
                  price = 0;
                  total = 0;
                }
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
