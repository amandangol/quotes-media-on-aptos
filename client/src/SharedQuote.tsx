import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Typography, Spin, message, Button } from 'antd';
import { Provider, Network, Types } from "aptos";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { LikeOutlined, HomeOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const provider = new Provider(Network.TESTNET);
const moduleAddress = "0x34d6b6437bfca564420f3d609e66dc3e4dc625fc1a390efdd55abc1940177819";

interface Quote {
  id: string;
  content: string;
  author: string;
  created_at: string;
  shared: boolean;
  likes: number;
  ownerId: string;
}

interface MoveQuote {
  id: Types.MoveValue;
  content: Types.MoveValue;
  author: Types.MoveValue;
  created_at: Types.MoveValue;
  shared: Types.MoveValue;
  likes: Types.MoveValue;
  owner: Types.MoveValue;
}

const SharedQuote: React.FC = () => {
  const { ownerAddress, quoteId } = useParams<{ ownerAddress: string; quoteId: string }>();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { account, signAndSubmitTransaction } = useWallet();

  useEffect(() => {
    if (ownerAddress && quoteId) {
      fetchSharedQuote(ownerAddress, quoteId);
    }
  }, [ownerAddress, quoteId]);

  const fetchSharedQuote = async (owner: string, id: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await provider.view({
        function: `${moduleAddress}::Quotes::get_shared_quote`,
        type_arguments: [],
        arguments: [owner, id],
      });

      console.log("Raw result:", JSON.stringify(result, null, 2));

      if (Array.isArray(result)) {
        console.log("Result is an array with length:", result.length);
        result.forEach((item, index) => {
          console.log(`Item ${index}:`, JSON.stringify(item, null, 2));
        });

        if (result.length >= 7) {
          setQuote({
            id: result[0].toString(),
            content: result[1].toString(),
            author: result[2].toString(),
            created_at: new Date(Number(result[3]) * 1000).toISOString(),
            shared: Boolean(result[4]),
            likes: Number(result[5]),
            ownerId: result[6].toString(),
          });
        } else {
          throw new Error(`Unexpected array length: ${result.length}`);
        }
      } else if (typeof result === 'object' && result !== null) {
        console.log("Result is an object with keys:", Object.keys(result));
        const moveQuote = result as MoveQuote;
        setQuote({
          id: moveQuote.id.toString(),
          content: moveQuote.content.toString(),
          author: moveQuote.author.toString(),
          created_at: new Date(Number(moveQuote.created_at) * 1000).toISOString(),
          shared: Boolean(moveQuote.shared),
          likes: Number(moveQuote.likes),
          ownerId: moveQuote.owner.toString(),
        });
      } else {
        throw new Error(`Unexpected result type: ${typeof result}`);
      }
    } catch (error: unknown) {
      console.error("Error fetching shared quote:", error);
      setError(`Failed to fetch the shared quote: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const likeQuote = async () => {
    if (!account || !quote) return;

    try {
      setLoading(true);
      const payload: Types.TransactionPayload = {
        type: "entry_function_payload",
        function: `${moduleAddress}::Quotes::like_quote`,
        type_arguments: [],
        arguments: [quote.ownerId, quote.id],
      };

      const response = await signAndSubmitTransaction(payload);
      await provider.waitForTransaction(response.hash);
      message.success("Quote liked successfully!");
      fetchSharedQuote(quote.ownerId, quote.id);
    } catch (error: unknown) {
      console.error("Error liking quote:", error);
      message.error(`Failed to like quote: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spin size="large" />;
  }

  if (error) {
    return <Text type="danger">{error}</Text>;
  }

  if (!quote) {
    return <Text>Quote not found or not shared.</Text>;
  }

  return (
    <Card 
      title="Shared Quote"
      extra={<Link to="/"><Button icon={<HomeOutlined />}>Home</Button></Link>}
    >
      <Title level={4}>"{quote.content}"</Title>
      <Text italic>- {quote.author}</Text>
      <br />
      <Text type="secondary">Shared by: {quote.ownerId}</Text>
      <br />
      <Text type="secondary">Added at: {new Date(quote.created_at).toLocaleString()}</Text>
      <br />
      <Text type="secondary">Likes: {quote.likes}</Text>
      <br />
      <Button 
        icon={<LikeOutlined />} 
        onClick={likeQuote} 
        disabled={!account}
      >
        Like
      </Button>
    </Card>
  );
};

export default SharedQuote;