import { PetraWallet } from "petra-plugin-wallet-adapter";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from 'react-router-dom';
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { WalletStatusProvider } from './components/WalletStatusProvider';


const wallets = [new PetraWallet()];

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <React.StrictMode>
    <AptosWalletAdapterProvider plugins={wallets} autoConnect={true}>
      <BrowserRouter>
      
        <App />
      </BrowserRouter>
    </AptosWalletAdapterProvider>
  </React.StrictMode>,
);

reportWebVitals();