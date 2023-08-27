import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as sns from "aws-cdk-lib/aws-sns";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as sqsSubscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodeJs from "aws-cdk-lib/aws-lambda-nodejs";
import {
  S3EventSource,
  SnsEventSource,
  SqsEventSource,
} from "aws-cdk-lib/aws-lambda-event-sources";

export class AwsLambdaRecursionDetectionStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /**
     * ENV
     */
    // Sending Email(Your Email)
    const emailAddress = "hogehoge@example.com"; //<- Change Your Email Address.

    // REGION
    const scopedAws = new cdk.ScopedAws(this);
    const region = scopedAws.region;

    /**
     * Amazon SQS
     */
    // For SQS Only Pattern
    // Dead Letter Queue
    const lambdaLoopDeadLetterQueue = new sqs.Queue(
      this,
      "LambdaLoopDeadLetterQueue",
      {
        queueName: "LambdaLoopDlq",
      }
    );
    const lambdaLoopDlq: sqs.DeadLetterQueue = {
      maxReceiveCount: 1,
      queue: lambdaLoopDeadLetterQueue,
    };
    // SQS Queue With DLQ
    const lambdaLoopQueueWithDlq = new sqs.Queue(
      this,
      "LambdaLoopQueueWithDlq",
      {
        queueName: "LambdaLoopQueueWithDlq",
        deadLetterQueue: lambdaLoopDlq,
      }
    );

    // SQS Queue Without DLQ
    const lambdaLoopQueue = new sqs.Queue(this, "LambdaLoopQueue", {
      queueName: "LambdaLoopQueue",
    });

    // SQS Queue For SQS & SNS Pattern
    // Dead Letter Queue
    const lambdaLoopAndSnsDeadLetterQueue = new sqs.Queue(
      this,
      "LambdaLoopAndSnsDeadLetterQueue",
      {
        queueName: "LambdaLoopAndSnsDlq",
      }
    );
    const lambdaLoopAndSnsDlq: sqs.DeadLetterQueue = {
      maxReceiveCount: 1,
      queue: lambdaLoopAndSnsDeadLetterQueue,
    };
    // SQS Queue With DLQ
    const lambdaLoopAndSnsQueue = new sqs.Queue(this, "LambdaLoopAndSnsQueue", {
      queueName: "LambdaLoopAndSnsQueue",
      deadLetterQueue: lambdaLoopAndSnsDlq,
    });

    // SQS Queue For SQS & Lambda Pattern
    const lambdaLoopAndLambdaDeadLetterQueue = new sqs.Queue(
      this,
      "LambdaLoopAndLambdaDeadLetterQueue",
      {
        queueName: "LambdaLoopAndLambdaDlq",
      }
    );
    const lambdaLoopAndLambdaDlq: sqs.DeadLetterQueue = {
      maxReceiveCount: 1,
      queue: lambdaLoopAndLambdaDeadLetterQueue,
    };
    // SQS Queue For AWS Lambda Loop With DLQ
    const lambdaLoopAndLambdaQueue = new sqs.Queue(
      this,
      "LambdaLoopAndLambdaQueue",
      {
        queueName: "LambdaLoopAndLambdaQueue",
        deadLetterQueue: lambdaLoopAndLambdaDlq,
      }
    );

    // SQS Queue For Pythagorean Switch Pattern
    const lambdaLoopPythagoreanSwitchDeadLetterQueue = new sqs.Queue(
      this,
      "LambdaLoopPythagoreanSwitchDeadLetterQueue",
      {
        queueName: "LambdaLoopPythagoreanSwitchDlq",
      }
    );
    const lambdaLoopPythagoreanSwitchDlq: sqs.DeadLetterQueue = {
      maxReceiveCount: 1,
      queue: lambdaLoopPythagoreanSwitchDeadLetterQueue,
    };
    // 1st SQS Queue For AWS Lambda Loop With DLQ
    const lambdaLoopPythagoreanSwitch1stQueue = new sqs.Queue(
      this,
      "LambdaLoopPythagoreanSwitch1stQueue",
      {
        queueName: "LambdaLoopPythagoreanSwitch1Queue",
        deadLetterQueue: lambdaLoopPythagoreanSwitchDlq,
      }
    );
    // 2nd SQS Queue For AWS Lambda Loop With DLQ
    const lambdaLoopPythagoreanSwitch2ndQueue = new sqs.Queue(
      this,
      "LambdaLoopPythagoreanSwitch2ndQueue",
      {
        queueName: "LambdaLoopPythagoreanSwitch2ndQueue",
        deadLetterQueue: lambdaLoopPythagoreanSwitchDlq,
      }
    );
    // 3rd SQS Queue For AWS Lambda Loop With DLQ
    const lambdaLoopPythagoreanSwitch3rdQueue = new sqs.Queue(
      this,
      "LambdaLoopPythagoreanSwitch3rdQueue",
      {
        queueName: "LambdaLoopPythagoreanSwitch3rdQueue",
        deadLetterQueue: lambdaLoopPythagoreanSwitchDlq,
      }
    );
    /**
     * Amazon SNS
     */
    // SNS Topic For SNS Only Pattern
    const lambdaLoopTopic = new sns.Topic(this, "LambdaLoopTopic");

    // SNS Topic For SQS AND SQS Pattern
    const lambdaLoopAndSqsTopic = new sns.Topic(this, "LambdaLoopAndSqsTopic");
    lambdaLoopAndSqsTopic.addSubscription(
      new sqsSubscriptions.SqsSubscription(lambdaLoopAndSnsQueue)
    );

    // SNS Topic For Send Email
    const sendMailTopic = new sns.Topic(this, "SendMailTopic");
    sendMailTopic.addSubscription(
      new sqsSubscriptions.EmailSubscription(emailAddress)
    );

    /**
     * Amazon S3
     */
    const lambdaLoopBucket = new s3.Bucket(this, "LambdaLoopBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    /**
     * Lambda
     */
    // Lambda Function For SQS(With DLQ) Send Massege
    const loopSqsWithDlqFunction = new lambdaNodeJs.NodejsFunction(
      this,
      "LoopSqsWithDlqFunction",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: "lambda/sqs-handler.ts",
        handler: "LambdaRecursionDetectionSqsHandler",
        timeout: cdk.Duration.seconds(30),
        tracing: lambda.Tracing.ACTIVE,
        description: "Lambda Recursion Detection For Send Sqs Message.With DLQ",
        environment: {
          SQS_QUEUE_URL: lambdaLoopQueueWithDlq.queueUrl,
          REGION: region,
        },
      }
    );
    lambdaLoopQueueWithDlq.grantSendMessages(loopSqsWithDlqFunction);
    loopSqsWithDlqFunction.addEventSource(
      new SqsEventSource(lambdaLoopQueueWithDlq, {})
    );

    // Lambda Function For SQS(Without DLQ) Send Massege
    const loopSqsFunction = new lambdaNodeJs.NodejsFunction(
      this,
      "LoopSqsFunction",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: "lambda/sqs-handler.ts",
        handler: "LambdaRecursionDetectionSqshHandler",
        timeout: cdk.Duration.seconds(30),
        tracing: lambda.Tracing.ACTIVE,
        description: "Lambda Recursion Detection For Send Sqs Message.",
        environment: {
          SQS_QUEUE_URL: lambdaLoopQueue.queueUrl,
          REGION: region,
        },
      }
    );
    lambdaLoopQueue.grantSendMessages(loopSqsFunction);
    loopSqsFunction.addEventSource(new SqsEventSource(lambdaLoopQueue, {}));

    // Lambda Function For SNS Publish
    const loopSnsFunction = new lambdaNodeJs.NodejsFunction(
      this,
      "LoopSnsFunction",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: "lambda/sns-handler.ts",
        handler: "LambdaRecursionDetectionSnsHandler",
        timeout: cdk.Duration.seconds(30),
        tracing: lambda.Tracing.ACTIVE,
        description: "Lambda Recursion Detection For SNS Publish.",
        environment: {
          SNS_TOPIC_ARN: lambdaLoopTopic.topicArn,
          REGION: region,
        },
      }
    );
    lambdaLoopTopic.grantPublish(loopSnsFunction);
    loopSnsFunction.addEventSource(new SnsEventSource(lambdaLoopTopic, {}));

    // Lambda Function For SQS & SNS Loop
    const loopSqsAndSnsFunction = new lambdaNodeJs.NodejsFunction(
      this,
      "LoopSqsAndSnsFunction",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: "lambda/sns-sqs-handler.ts",
        handler: "LambdaRecursionDetectionSnsSqsHandler",
        timeout: cdk.Duration.seconds(30),
        tracing: lambda.Tracing.ACTIVE,
        description: "Lambda Recursion Detection For SNS & SQS",
        environment: {
          SNS_TOPIC_ARN: lambdaLoopAndSqsTopic.topicArn,
          REGION: region,
        },
      }
    );
    lambdaLoopAndSqsTopic.grantPublish(loopSqsAndSnsFunction);
    loopSqsAndSnsFunction.addEventSource(
      new SqsEventSource(lambdaLoopAndSnsQueue, {})
    );

    // Lambda Function For SQS & Lambda
    const loopSqsAndLambdaFunction = new lambdaNodeJs.NodejsFunction(
      this,
      "LoopSqsAndLambdaFunction",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: "lambda/sqs-lambda-handler.ts",
        handler: "LambdaRecursionDetectionSqsLambdaHandler",
        timeout: cdk.Duration.seconds(30),
        tracing: lambda.Tracing.ACTIVE,
        description: "Lambda Recursion Detection For SQS & Lambda(SQS Publish)",
        environment: {
          SQS_QUEUE_URL: lambdaLoopAndLambdaQueue.queueUrl,
          REGION: region,
        },
      }
    );
    lambdaLoopAndLambdaQueue.grantSendMessages(loopSqsAndLambdaFunction);

    const loopLambdaFunction = new lambdaNodeJs.NodejsFunction(
      this,
      "LoopLambdaFunction",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: "lambda/lambda-handler.ts",
        handler: "LambdaRecursionDetectionLambdaHandler",
        timeout: cdk.Duration.seconds(30),
        tracing: lambda.Tracing.ACTIVE,
        description:
          "Lambda Recursion Detection For SQS & Lambda(Lambda Invoke)",
        environment: {
          LAMBDA_FUNCTION_NAME: loopSqsAndLambdaFunction.functionName,
          REGION: region,
        },
      }
    );
    loopSqsAndLambdaFunction.grantInvoke(loopLambdaFunction);
    loopLambdaFunction.addEventSource(
      new SqsEventSource(lambdaLoopAndLambdaQueue, {})
    );

    // Lambda Function For Pythagorean Switch Loop
    const loopPythagoreanSwitch1stFunction = new lambdaNodeJs.NodejsFunction(
      this,
      "LoopPythagoreanSwitch1stFunction",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: "lambda/sqs-handler.ts",
        handler: "LambdaRecursionDetectionSqsHandler",
        timeout: cdk.Duration.seconds(30),
        tracing: lambda.Tracing.ACTIVE,
        description:
          "Lambda Recursion Detection ForPythagorean Switch Loop 1st(& Loop) Function",
        environment: {
          SQS_QUEUE_URL: lambdaLoopPythagoreanSwitch1stQueue.queueUrl,
          REGION: region,
        },
      }
    );
    lambdaLoopPythagoreanSwitch1stQueue.grantSendMessages(
      loopPythagoreanSwitch1stFunction
    );
    loopPythagoreanSwitch1stFunction.addEventSource(
      new SqsEventSource(lambdaLoopPythagoreanSwitch3rdQueue, {})
    );
    const loopPythagoreanSwitch2ndFunction = new lambdaNodeJs.NodejsFunction(
      this,
      "LoopPythagoreanSwitch2ndFunction",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: "lambda/sqs-handler.ts",
        handler: "LambdaRecursionDetectionSqsHandler",
        timeout: cdk.Duration.seconds(30),
        tracing: lambda.Tracing.ACTIVE,
        description:
          "Lambda Recursion Detection ForPythagorean Switch Loop 2nd Function",
        environment: {
          SQS_QUEUE_URL: lambdaLoopPythagoreanSwitch2ndQueue.queueUrl,
          REGION: region,
        },
      }
    );
    lambdaLoopPythagoreanSwitch2ndQueue.grantSendMessages(
      loopPythagoreanSwitch2ndFunction
    );
    loopPythagoreanSwitch2ndFunction.addEventSource(
      new SqsEventSource(lambdaLoopPythagoreanSwitch1stQueue, {})
    );
    const loopPythagoreanSwitch3rdFunction = new lambdaNodeJs.NodejsFunction(
      this,
      "LoopPythagoreanSwitch3rdFunction",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: "lambda/sqs-handler.ts",
        handler: "LambdaRecursionDetectionSqsHandler",
        timeout: cdk.Duration.seconds(30),
        tracing: lambda.Tracing.ACTIVE,
        description:
          "Lambda Recursion Detection ForPythagorean Switch Loop 3rd Function",
        environment: {
          SQS_QUEUE_URL: lambdaLoopPythagoreanSwitch3rdQueue.queueUrl,
          REGION: region,
        },
      }
    );
    lambdaLoopPythagoreanSwitch3rdQueue.grantSendMessages(
      loopPythagoreanSwitch3rdFunction
    );
    loopPythagoreanSwitch3rdFunction.addEventSource(
      new SqsEventSource(lambdaLoopPythagoreanSwitch2ndQueue, {})
    );

    // Lambda Function For S3 Save JSON. (Not Detection)
    const loopS3Function = new lambdaNodeJs.NodejsFunction(
      this,
      "LoopS3Function",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: "lambda/s3-handler.ts",
        handler: "LambdaRecursionDetectionS3Handler",
        timeout: cdk.Duration.seconds(30),
        tracing: lambda.Tracing.ACTIVE,
        description: "Lambda Recursion Detection For Put S3 Object.",
        environment: {
          S3_BUCKET_NAME: lambdaLoopBucket.bucketName,
          REGION: region,
        },
      }
    );
    lambdaLoopBucket.grantReadWrite(loopS3Function);
    loopS3Function.addEventSource(
      new S3EventSource(lambdaLoopBucket, {
        events: [s3.EventType.OBJECT_CREATED],
      })
    );
    // SNS Publish For DLQ
    const snsPublishFunction = new lambdaNodeJs.NodejsFunction(
      this,
      "SnsPublishFunction",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: "lambda/sns-publish-handler.ts",
        handler: "SnsPublishHandler",
        timeout: cdk.Duration.seconds(30),
        tracing: lambda.Tracing.ACTIVE,
        description: "DLQ Alert Sns Publish.",
        environment: {
          SNS_TOPIC_ARN: sendMailTopic.topicArn,
          REGION: region,
        },
      }
    );
    sendMailTopic.grantPublish(snsPublishFunction);
    snsPublishFunction.addEventSource(
      new SqsEventSource(lambdaLoopDeadLetterQueue, {})
    );
    snsPublishFunction.addEventSource(
      new SqsEventSource(lambdaLoopAndSnsDeadLetterQueue, {})
    );
    snsPublishFunction.addEventSource(
      new SqsEventSource(lambdaLoopAndLambdaDeadLetterQueue, {})
    );

    // Lambda Function Name Output.
    new cdk.CfnOutput(this, "Amazon SQS With DLQ Loop Function", {
      value: loopSqsWithDlqFunction.functionName,
    });
    new cdk.CfnOutput(this, "Amazon SQS Without DLQ Loop Function", {
      value: loopSqsFunction.functionName,
    });
    new cdk.CfnOutput(this, "Amazon SNS Loop Function", {
      value: loopSnsFunction.functionName,
    });
    new cdk.CfnOutput(this, "Amazon SQS & SNS Loop Function", {
      value: loopSqsAndSnsFunction.functionName,
    });
    new cdk.CfnOutput(this, "Amazon SQS & Lambda Loop Function", {
      value: loopSqsAndLambdaFunction.functionName,
    });
    new cdk.CfnOutput(this, "Pythagorean Switch Loop Function", {
      value: loopPythagoreanSwitch1stFunction.functionName,
    });
    new cdk.CfnOutput(this, "Amazon S3 Loop Function", {
      value: loopS3Function.functionName,
    });
  }
}
