import React, { useEffect, useState } from 'react';
import { Layout, Row, Col, Typography, Button, message, Modal, Tooltip } from 'antd';
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import { CopyOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { NetworkName } from "@aptos-labs/wallet-adapter-core";

const { Header: AntHeader } = Layout;
const { Title, Text, Paragraph } = Typography;

const Header: React.FC = () => {
  const { account, network, connected } = useWallet();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const copyAddress = () => {
    if (account?.address) {
      navigator.clipboard.writeText(account.address)
        .then(() => message.success('Address copied to clipboard'))
        .catch(() => message.error('Failed to copy address'));
    }
  };

  useEffect(() => {
    if (connected) {
      if (network?.name !== NetworkName.Testnet) {
        setIsModalVisible(true);
      } else {
       
      }
    }
  }, [connected, network]);

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const tooltipContent = (
    <div>
      
        Please ensure your wallet is connected to the Aptos Testnet.
      
      If you haven't already, you may need to fund your wallet using the Aptos Testnet Faucet on Petra Wallet extension.

    </div>
  );

  return (
    <>
      <AntHeader className="header">
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} className="header-title">QuoteSphere</Title>
          </Col>
          <Col>
            <Row gutter={16} align="middle">
              <Col>
                <Tooltip title={tooltipContent} placement="bottomRight">
                  <InfoCircleOutlined style={{ fontSize: '20px', color: 'white', cursor: 'pointer' }} />
                </Tooltip>
              </Col>
              {account && (
                <Col>
                 
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
      <Modal
        title="Wallet Connection Reminder"
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleOk}
      >
        <Paragraph>
          Please ensure your wallet is connected to the Aptos Testnet. 
          If you haven't already, you may need to fund your wallet using the Aptos Testnet Faucet on Petra Wallet extension.
        </Paragraph>
        {/* <Paragraph>
          <a href="https://aptoslabs.com/testnet-faucet" target="_blank" rel="noopener noreferrer">
            Visit Aptos Testnet Faucet
          </a>
        </Paragraph> */}
      </Modal>
    </>
  );
};

export default Header;