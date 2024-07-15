import React from 'react';
import { Layout, Row, Col, Typography } from 'antd';
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";

const { Header: AntHeader } = Layout;
const { Title } = Typography;

const Header: React.FC = () => {
  return (
    <AntHeader className="header">
      <Row justify="space-between" align="middle">
        <Col>
          <Title level={2} className="header-title">Quote Manager</Title>
        </Col>
        <Col>
          <WalletSelector />
        </Col>
      </Row>
    </AntHeader>
  );
};

export default Header;