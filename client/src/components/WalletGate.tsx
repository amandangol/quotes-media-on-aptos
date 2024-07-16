import React, { ReactNode } from 'react';
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Typography, Space } from 'antd';
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import '../styles.css';
import logo from '../images/logo.png'; 
import aptosLogo from '../images/aptos-logo.png'; // Make sure to add this image to your project

const { Title, Text } = Typography;

interface WalletGateProps {
  children: ReactNode;
}

const WalletGate: React.FC<WalletGateProps> = ({ children }) => {
  const { account } = useWallet();

  if (!account) {
    return (
      <div className="wallet-gate-container">
        <div className="wallet-gate-content">
          <Space direction="vertical" align="center" size="large">
            <div className="logo-container">
              <img src={logo} alt="QuoteSphere Logo" className="logo" />
            </div>
            <Title level={2} className="wallet-gate-title">Welcome to QuoteSphere</Title>
            <Text className="wallet-gate-text">Connect your wallet to dive into a world of inspiring quotes</Text>
            <div className="wallet-selector-container">
              <WalletSelector />
            </div>
          </Space>
        </div>
        <div className="built-on-aptos">
          <img src={aptosLogo} alt="Aptos Logo" className="aptos-logo" />
          <Text className="built-on-text">Built on Aptos</Text>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default WalletGate;