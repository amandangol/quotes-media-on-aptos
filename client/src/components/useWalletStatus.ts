import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Network } from "aptos";

export const useWalletStatus = () => {
  const { account, network } = useWallet();

  const isConnected = !!account;
  const isTestnet = network?.name?.toLowerCase() === Network.TESTNET.toLowerCase();

  return { isConnected, isTestnet };
};