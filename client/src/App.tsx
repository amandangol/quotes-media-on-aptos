import React from 'react';
import { Layout, Space } from 'antd';
import Header from './components/Header';
import RandomQuote from './components/RandomQuote';
import CustomQuote from './components/CustomQuote';
import QuoteSearch from './components/QuoteSearch';
import QuoteList from './components/QuoteList';
import { QuoteProvider } from './contexts/QuoteContext';
import InitializeButton from './components/InitializeButton';
import "./styles.css";

const { Content, Footer } = Layout;

const App: React.FC = () => {
  return (
    <QuoteProvider>
      <Layout className="layout"> 
        <Header />
        <Content className="content">
        <InitializeButton />
        <Space direction="vertical" size="large" style={{ display: 'flex', padding: '24px' }}>

          <div className="site-layout-content">
         
            <div className="quote-actions">
           
              <RandomQuote />
              <CustomQuote />
            </div>
            <QuoteSearch />
            
            <QuoteList />
          </div>
          </Space>
        </Content>
        <Footer className="footer">
          Quote Manager ©{new Date().getFullYear()} Created with Aptos
        </Footer>
      </Layout>
    </QuoteProvider>
  );
};

export default App;