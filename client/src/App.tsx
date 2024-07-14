import React, { useState, useEffect } from 'react';
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import { Layout, Button, Spin, message, List, Typography, Card, Row, Col } from 'antd';
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Network, Provider, Types } from "aptos";
import { PlusOutlined, ShareAltOutlined, CopyOutlined, ReloadOutlined, LikeOutlined } from '@ant-design/icons';
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import './styles.css';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

const provider = new Provider(Network.TESTNET);
const moduleAddress = "0x1081f1c161922255c6f109c53e6ce73c9d6bc7244febc298bb544c67368fa05e";

interface Quote {
  id: string;
  content: string;
  author: string;
  created_at: string;
  shared: boolean;
  likes: number;
  ownerId: string;
}

const App: React.FC = () => {
  const { account, signAndSubmitTransaction } = useWallet();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [randomQuote, setRandomQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (account) {
      initializeQuotes();
      fetchQuotes();
    }
  }, [account]);
  useEffect(() => {
    console.log("Current quotes state:", quotes);
  }, [quotes]);

  const initializeQuotes = async () => {
    if (!account) return;
  
    try {
      setLoading(true);
      const payload: Types.TransactionPayload = {
        type: "entry_function_payload",
        function: `${moduleAddress}::Quotes::initialize`,
        type_arguments: [],
        arguments: [],
      };
  
      const response = await signAndSubmitTransaction(payload);
      console.log("Initialize transaction submitted:", response);
      await provider.waitForTransaction(response.hash);
      console.log("Initialize transaction confirmed");
      message.success("Quotes initialized successfully!");
      
      // Check if the resource exists after initialization
      await checkQuotesResourceExists();
    } catch (error) {
      console.error("Error initializing quotes:", error);
      if (error instanceof Error) {
        message.error(`Failed to initialize quotes: ${error.message}`);
      } else {
        message.error("Failed to initialize quotes. It might already be initialized.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchQuotes = async () => {
    if (!account) return;
  
    try {
      setLoading(true);
      console.log("Fetching quotes for address:", account.address);
      
      const result = await provider.view({
        function: `${moduleAddress}::Quotes::get_quotes`,
        type_arguments: [],
        arguments: [account.address],
      });
  
      console.log("Raw result from get_quotes:", JSON.stringify(result, null, 2));
  
      if (Array.isArray(result) && result.length > 0 && Array.isArray(result[0])) {
        const formattedQuotes = result[0].map((quote: any) => {
          console.log("Processing quote:", JSON.stringify(quote, null, 2));
          
          let created_at;
          try {
            const timestamp = quote.created_at ? parseInt(quote.created_at) : null;
            created_at = isNaN(timestamp!) ? new Date().toISOString() : new Date(timestamp! * 1000).toISOString();
          } catch (error) {
            console.error("Error parsing timestamp:", error);
            created_at = new Date().toISOString();
          }
  
          return {
            id: quote.id.toString(),
            content: quote.content,
            author: quote.author,
            created_at,
            shared: Boolean(quote.shared),
            likes: Number(quote.likes),
            ownerId: account.address,  // This is correct as we're fetching the current user's quotes
          };
        });
        
        console.log("Formatted quotes:", formattedQuotes);
        setQuotes(formattedQuotes);
      } else {
        console.error("Unexpected result format:", result);
        message.error("Unexpected data format received from the blockchain");
      }
    } catch (error) {
      console.error("Error fetching quotes:", error);
      if (error instanceof Error) {
        message.error(`Failed to fetch quotes: ${error.message}`);
      } else {
        message.error("Failed to fetch quotes. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };
  
  const likeQuote = async (quoteOwnerId: string, quoteId: string) => {
    if (!account) return;
  
    try {
      setLoading(true);
      const payload: Types.TransactionPayload = {
        type: "entry_function_payload",
        function: `${moduleAddress}::Quotes::like_quote`,
        type_arguments: [],
        arguments: [quoteOwnerId, quoteId],
      };
  
      const response = await signAndSubmitTransaction(payload);
      await provider.waitForTransaction(response.hash);
      message.success("Quote liked successfully!");
      fetchQuotes();  // Refresh quotes after liking
    } catch (error) {
      console.error("Error liking quote:", error);
      message.error("Failed to like quote. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const checkQuotesResourceExists = async () => {
    if (!account) return;
  
    try {
      const result = await provider.getAccountResource(
        account.address,
        `${moduleAddress}::Quotes::Quotes`
      );
      console.log("Quotes resource exists:", result);
      message.success("Quotes resource exists for this account");
    } catch (error) {
      console.error("Error checking Quotes resource:", error);
      message.error("Quotes resource does not exist for this account. Try initializing.");
    }
  };
  

  const fetchRandomQuote = async () => {
    try {
      setLoading(true);
      const response = await fetch("https://api.quotable.io/random");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setRandomQuote({
        id: data._id,
        content: data.content,
        author: data.author,
        created_at: new Date().toISOString(),
        shared: false,
        likes:0,
        ownerId: account!.address,
      });
    } catch (error) {
      console.error("Error fetching random quote:", error);
      message.error("Failed to fetch random quote. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const addQuote = async () => {
    if (!account || !randomQuote) return;
  
    try {
      setLoading(true);
      console.log("Adding quote:", randomQuote); // Debug log
  
      const payload: Types.TransactionPayload = {
        type: "entry_function_payload",
        function: `${moduleAddress}::Quotes::add_quote`,
        type_arguments: [],
        arguments: [randomQuote.content, randomQuote.author],
      };
  
      console.log("Payload:", payload); // Debug log
  
      const response = await signAndSubmitTransaction(payload);
      await provider.waitForTransaction(response.hash);
      message.success("Quote added successfully!");
      setRandomQuote(null);
      fetchQuotes(); // Fetch quotes after adding
    } catch (error) {
      console.error("Error adding quote:", error);
      message.error("Failed to add quote. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const shareQuote = async (quoteId: string) => {
    if (!account) return;

    try {
      setLoading(true);
      const payload: Types.TransactionPayload = {
        type: "entry_function_payload",
        function: `${moduleAddress}::Quotes::share_quote`,
        type_arguments: [],
        arguments: [quoteId],
      };

      const response = await signAndSubmitTransaction(payload);
      await provider.waitForTransaction(response.hash);
      message.success("Quote shared successfully!");
      fetchQuotes();
    } catch (error) {
      console.error("Error sharing quote:", error);
      message.error("Failed to share quote. Please try again.");
    } finally {
      setLoading(false);
    }
  };



  const manualRefresh = () => {
    fetchQuotes();
  };
  
  // Add this button in your JSX, perhaps next to the "Get Random Quote" button
  <Button onClick={manualRefresh}>Refresh Quotes</Button>

  const getShareableLink = (quoteId: string) => {
    return `${window.location.origin}/quote/${account?.address}/${quoteId}`;
  };

  return (
    <Layout className="layout">
      <Header className="header">
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ color: 'white', margin: 0 }}>Quote Manager</Title>
          </Col>
          <Col>
            <WalletSelector />
          </Col>
        </Row>
      </Header>
      <Content className="content">
        <Spin spinning={loading}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card title="Random Quote" extra={<Button type="primary" icon={<ReloadOutlined />} onClick={fetchRandomQuote}>Get Random Quote</Button>}>
                {randomQuote ? (
                  <>
                    <Text strong>"{randomQuote.content}"</Text>
                    <br />
                    <Text italic>- {randomQuote.author}</Text>
                    <br />
                    <Button 
                      type="primary" 
                      icon={<PlusOutlined />} 
                      onClick={addQuote} 
                      disabled={!account}
                      style={{ marginTop: '10px' }}
                    >
                      Add to My Quotes
                    </Button>
                  </>
                ) : (
                  <Text>Click the button to get a random quote.</Text>
                )}
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title="Actions" extra={<Button type="primary" icon={<ReloadOutlined />} onClick={fetchQuotes}>Refresh Quotes</Button>}>
                <Button onClick={checkQuotesResourceExists} style={{ marginRight: '10px' }}>Check Quotes Resource</Button>
                <Button onClick={initializeQuotes}>Initialize Quotes</Button>
              </Card>
            </Col>
          </Row>
          <Card title="My Quotes" style={{ marginTop: '16px' }}>
            <List
              itemLayout="vertical"
              dataSource={quotes}
              renderItem={(quote) => (
                <List.Item
                  actions={[
                    <Button
          icon={<LikeOutlined />}
          onClick={() => likeQuote(quote.ownerId, quote.id)}
          disabled={account?.address === quote.ownerId}
        >
          Like ({quote.likes})
        </Button>,
                    <Button 
                      type={quote.shared ? 'default' : 'primary'}
                      icon={<ShareAltOutlined />}
                      onClick={() => shareQuote(quote.id)} 
                      disabled={quote.shared}
                    >
                      {quote.shared ? 'Shared' : 'Share'}
                    </Button>,
                    quote.shared && (
                      <Button 
                        icon={<CopyOutlined />}
                        onClick={() => {
                          navigator.clipboard.writeText(getShareableLink(quote.id));
                          message.success('Shareable link copied to clipboard!');
                        }}
                      >
                        Copy Link
                      </Button>
                      
                    )
                    
                  ]}
                  
                >
                  
                  
                  <List.Item.Meta
                    title={<Text strong>"{quote.content}"</Text>}
                    description={
                      <>
                        <Text italic>- {quote.author}</Text>
                        <br />
                        <Text type="secondary">Added at: {new Date(quote.created_at).toLocaleString()}</Text>
                      </>
                    }
                  />
                </List.Item>
                
              )}
              
            />
          </Card>
        </Spin>
      </Content>
      <Footer style={{ textAlign: 'center' }}>Quote Manager ©{new Date().getFullYear()} Created with Aptos</Footer>
    </Layout>
  );
};

export default App;