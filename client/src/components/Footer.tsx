import React from 'react';
import { Layout } from 'antd';

const { Footer } = Layout;

const AppFooter: React.FC = () => (
  <Footer style={{ textAlign: 'center' }}>Quote Manager ©{new Date().getFullYear()} Created with Aptos</Footer>
);

export default AppFooter;
