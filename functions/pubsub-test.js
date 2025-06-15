import { PubSub } from '@google-cloud/pubsub';
import 'dotenv/config';

const pubsub = new PubSub({
  projectId: process.env.PROJECT_ID,
  apiEndpoint: 'localhost:8085',
});

const main = async () => {
  const topic = pubsub.topic('budget-alerts');
  try {
    await topic.publishMessage({ json: { test: 'trigger' } });
    console.log('Published test message');
  } catch (error) {
    console.error('Error publishing message:', error);
    return;
  }
};

main();