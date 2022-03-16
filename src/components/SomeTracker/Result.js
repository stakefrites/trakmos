import React, { useEffect, useState } from "react";
import { Container, Button } from "react-bootstrap";
import Table from "react-bootstrap/Table";
import currency from "currency.js";
import { CashStack } from "react-bootstrap-icons";
import _ from "lodash";

const Result = (props) => {
  let totalValue = 0;

  if (props.balances !== undefined && props.balances) {
    const realBalances = props.balances.map((balance) => {
      console.log("mapping balances", props.prices, balance);
      if (
        props.prices[balance.coinGeckoId] !== undefined &&
        props.prices[balance.coinGeckoId].price !== undefined
      ) {
        const thisPrice = props.prices[balance.coinGeckoId].price;
        totalValue += balance.total * thisPrice;
        return {
          ...balance,
          price: thisPrice,
          value: balance.total * thisPrice,
        };
      } else {
        return {
          ...balance,
          price: 0,
          value: balance.total * 0,
        };
      }
    });
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
                {realBalances.map((bal) => {
                  return (
                    <tr key={bal.chainAddress}>
                      <td>{currency(bal.price, { precision: 3 }).format()}</td>
                      <td width="auto">
                        <img
                          src={_.keyBy(props.networks, "name")[bal.name].image}
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
  }
  return <div>No balances</div>;
};
export default Result;
