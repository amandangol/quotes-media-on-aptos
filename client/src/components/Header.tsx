import React, { useEffect } from 'react';
import { Layout, Row, Col, Typography, Button, message } from 'antd';
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import { CopyOutlined } from '@ant-design/icons';
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { NetworkName } from "@aptos-labs/wallet-adapter-core";

const { Header: AntHeader } = Layout;
const { Title, Text } = Typography;

const Header: React.FC = () => {
  const { account, network } = useWallet();

  const copyAddress = () => {
    if (account?.address) {
      navigator.clipboard.writeText(account.address)
        .then(() => message.success('Address copied to clipboard'))
        .catch(() => message.error('Failed to copy address'));
    }
  };


  return (
    <AntHeader className="header">
      <Row justify="space-between" align="middle">
        <Col>
          <Title level={2} className="header-title">Quote Manager</Title>
        </Col>
        <Col>
          <Row gutter={16} align="middle">
            {account && (
              <Col>
                <Text style={{ marginRight: '8px' }}>
                  {`${account.address.slice(0, 6)}...${account.address.slice(-4)}`}
                </Text>
                <Button 
                  icon={<CopyOutlined />} 
                  onClick={copyAddress}
                  size="small"
                >
                </Button>
              </Col>
            )}
            <Col>
              <WalletSelector />
            </Col>
          </Row>
        </Col>
      </Row>
    </AntHeader>
  );
};

export default Header;