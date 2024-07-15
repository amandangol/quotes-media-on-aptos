import React from 'react';
import { useWalletStatus } from './useWalletStatus';
import { message } from 'antd';

export const WalletStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isConnected, isTestnet } = useWalletStatus();

  React.useEffect(() => {
    if (!isConnected) {
      message.warning('Please connect your wallet.');
    } else if (!isTestnet) {
      message.warning('Please connect to the Testnet.');
    }
  }, [isConnected, isTestnet]);

  return <>{children}</>;
};