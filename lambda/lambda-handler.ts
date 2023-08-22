// index.mjs
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

// Invoke Lambda Fuction Name
const invokeFunctionName = process.env.LAMBDA_FUNCTION_NAME;

// Region
const region = process.env.REGION;

exports.LambdaRecursionDetectionLambdaHandler = async function (
  event: any,
  context: any
) {
  console.log(JSON.stringify(event, null, 2));
  console.log(JSON.stringify(context, null, 2));
  try {
    const lambdaClient = new LambdaClient({ region });

    const invokeParams = {
      FunctionName: invokeFunctionName,
      InvocationType: "Event",
    };

    const invokeCommand = new InvokeCommand(invokeParams);
    const result = await lambdaClient.send(invokeCommand);

    console.log(`Invocation result: ${JSON.stringify(result)}`);
    console.log("Invoke Lambda Function.");
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Invoke Lambda Function." }),
    };
  } catch (error) {
    console.error("An error has occurred.", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "An error has occurred." }),
    };
  }
};
