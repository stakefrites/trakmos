import Bugsnag from "@bugsnag/js";
import BugsnagPluginReact from "@bugsnag/plugin-react";
import React from "react";

import ReactDOM from "react-dom";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import NetworkFinder from "../components/NetworkFinder";
import Single from "../components/SomeTracker/Single";
import "./index.css";
import reportWebVitals from "../utils/reportWebVitals";
import NetworkProvider from "../components/NetworkProvider";
/* 
Bugsnag.start({
  apiKey: "5cda10bb1c98f351cd0b722a1535d8c2",
  plugins: [new BugsnagPluginReact()],
  enabledReleaseStages: ["production", "staging"],
  releaseStage: process.env.NODE_ENV,
});

const ErrorBoundary = Bugsnag.getPlugin("react").createErrorBoundary(React); */

const WrappedSingle = () => {
  return (
    <NetworkProvider>
      <Single />
    </NetworkProvider>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" exact element={<NetworkFinder />} />
        <Route path="/:network" element={<WrappedSingle />} />
        <Route path="/:network/:operator" element={<NetworkFinder />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
