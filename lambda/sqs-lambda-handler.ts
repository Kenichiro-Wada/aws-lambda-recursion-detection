// index.js
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

// Amazon SQS Queue URL
const queueUrl = process.env.SQS_QUEUE_URL;

// Region
const region = process.env.REGION;

exports.LambdaRecursionDetectionSqsLambdaHandler = async function (
  event: any,
  context: any
) {
  console.log(JSON.stringify(event, null, 2));
  console.log(JSON.stringify(context, null, 2));
  try {
    // Get Event's body(Format SQS)
    const message: string = "Lambda Loop!!!";

    // Send Message SQS Queue
    await sendSqsMessage(message);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Message Send To Queue." }),
    };
  } catch (error) {
    console.error("An error has occurred.", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "An error has occurred." }),
    };
  }
};

async function sendSqsMessage(message: string) {
  // SQSクライアントを初期化します
  const sqsClient = new SQSClient({ region });
  const params = {
    QueueUrl: queueUrl,
    MessageBody: message,
  };

  const command = new SendMessageCommand(params);

  try {
    // メッセージをキューに送信します
    await sqsClient.send(command);
    console.log("Message has been sent to the queue");
  } catch (error) {
    console.error("An error occurred while sending the message", error);
    throw error;
  }
}
