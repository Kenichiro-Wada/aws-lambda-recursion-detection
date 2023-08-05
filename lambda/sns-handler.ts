// index.js
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

// Amazon SNS Topic ARN
const topicArn = process.env.SNS_TOPIC_ARN;

// Region
const region = process.env.REGION;

exports.LambdaRecursionDetectionSnsHandler = async function (event: any, context: any) {
  console.log(JSON.stringify(event, null, 2));
  console.log(JSON.stringify(context, null, 2));
  try {
    // Get Event's body(Format SNS)
    const message:string = event.Records[0].Sns.Message;

    // Publish SNS Topic
    await publishSnsMessage(message);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Message Send To Topic." }),
    };
  } catch (error) {
    console.error('An error has occurred.', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'An error has occurred.' }),
    };
  }
}

async function publishSnsMessage(message: string) {
  // initialize SNS Client
  const snsClient = new SNSClient({region});
  const params = {
    TopicArn: topicArn,
    Message: message,
  };

  const command = new PublishCommand(params);

  try {
    // Send a message to the topic.
    await snsClient.send(command);
    console.log("Message sent to topic");
  } catch (error) {
    console.error("An error occurred while sending the message", error);
    throw error;
  }
}
