import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sqsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodeJs from 'aws-cdk-lib/aws-lambda-nodejs';
import { S3EventSource, SnsEventSource, SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

export class AwsLambdaRecursionDetectionStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /**
     * ENV
     */
    // Sending Email(Your Email)
    const emailAddress = 'hogehoge@example.com' //<- Change Your Email Address.

    // REGION
    const scopedAws = new cdk.ScopedAws(this);
    const region = scopedAws.region;
    
    /**
     * Amazon SQS
     */
    // Dead Letter QUEUE
    const lambdaLoopDeadLetterQueue = new sqs.Queue(this, 'LambdaLoopDeadLetterQueue', {
      queueName: 'LambdaLoopDlq'
    });
    const lambdaLoopDlq: sqs.DeadLetterQueue = {
      maxReceiveCount: 1,
      queue: lambdaLoopDeadLetterQueue,
    }
    // SQS Queue For AWS Lambda Loop With DLQ
    const lambdaLoopQueueWithDlq = new sqs.Queue(this, 'LambdaLoopQueueWithDlq', {
      queueName: 'LambdaLoopQueueWithDlq',
      deadLetterQueue: lambdaLoopDlq
    });
    // SQS Queue For AWS Lambda Loop
    const lambdaLoopQueue = new sqs.Queue(this, 'LambdaLoopQueue', {
      queueName: 'LambdaLoopQueue'
    });

    /**
     * Amazon S3
     */
    const lambdaLoopBucket = new s3.Bucket(this, 'LambdaLoopBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    /**
     * Amazon SNS
     */
    // SNS Topic For Lambda Loop
    const lambdaLoopTopic = new sns.Topic(this, 'LambdaLoopTopic');

    // SNS Topic For Send Email
    const sendMailTopic = new sns.Topic(this, 'SendMailTopic');
    sendMailTopic.addSubscription(new sqsSubscriptions.EmailSubscription(emailAddress));

    /**
     * Lambda
     */
    // SQS(With DLQ) Send Massege
    const loopSqsWithDlqFunction = new lambdaNodeJs.NodejsFunction(this, 'LoopSqsWithDlqFunction', 
    {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: 'lambda/sqs-handler.ts',
      handler: 'LambdaRecursionDetectionSqshHandler',
      timeout: cdk.Duration.seconds(30),
      tracing: lambda.Tracing.ACTIVE,
      description: 'Lambda Recursion Detection For Send Sqs Message.With DLQ',
      environment : {
        'SQS_QUEUE_URL': lambdaLoopQueueWithDlq.queueUrl,
        'REGION': region
      }
    });
    lambdaLoopQueueWithDlq.grantSendMessages(loopSqsWithDlqFunction);
    loopSqsWithDlqFunction.addEventSource(new SqsEventSource(lambdaLoopQueueWithDlq, {}));

    // SQS Send Massege
    const loopSqsFunction = new lambdaNodeJs.NodejsFunction(this, 'LoopSqsFunction', 
    {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: 'lambda/sqs-handler.ts',
      handler: 'LambdaRecursionDetectionSqshHandler',
      timeout: cdk.Duration.seconds(30),
      tracing: lambda.Tracing.ACTIVE,
      description: 'Lambda Recursion Detection For Send Sqs Message.',
      environment : {
        'SQS_QUEUE_URL': lambdaLoopQueue.queueUrl,
        'REGION': region
      }
    });
    lambdaLoopQueue.grantSendMessages(loopSqsFunction);
    loopSqsFunction.addEventSource(new SqsEventSource(lambdaLoopQueue, {}));

    // SNS Publish 
    const loopSnsFunction = new lambdaNodeJs.NodejsFunction(this, 'LoopSnsFunction', 
    {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: 'lambda/sns-handler.ts',
      handler: 'LambdaRecursionDetectionSnsHandler',
      timeout: cdk.Duration.seconds(30),
      tracing: lambda.Tracing.ACTIVE,
      description: 'Lambda Recursion Detection For SNS Publish.',
      environment : {
        'SNS_TOPIC_ARN': lambdaLoopTopic.topicArn,
        'REGION': region
      }
    });
    lambdaLoopTopic.grantPublish(loopSnsFunction);
    loopSnsFunction.addEventSource(new SnsEventSource(lambdaLoopTopic, {}));

    // S3 Save JSON.
    const loopS3Function = new lambdaNodeJs.NodejsFunction(this, 'LoopS3Function', 
    {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: 'lambda/s3-handler.ts',
      handler: 'LambdaRecursionDetectionS3Handler',
      timeout: cdk.Duration.seconds(30),
      tracing: lambda.Tracing.ACTIVE,
      description: 'Lambda Recursion Detection For Put S3 Object.',
      environment : {
        'S3_BUCKET_NAME': lambdaLoopBucket.bucketName,
        'REGION': region
      }
    });
    lambdaLoopBucket.grantReadWrite(loopS3Function);
    loopS3Function.addEventSource(new S3EventSource(lambdaLoopBucket,{
      events: [s3.EventType.OBJECT_CREATED],
    }));

    // SNS Publish For DLQ
    const snsPublishFunction = new lambdaNodeJs.NodejsFunction(this, 'SnsPublishFunction', 
    {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: 'lambda/sns-publish-handler.ts',
      handler: 'SnsPublishHandler',
      timeout: cdk.Duration.seconds(30),
      tracing: lambda.Tracing.ACTIVE,
      description: 'DLQ Alert Sns Publish.',
      environment : {
        'SNS_TOPIC_ARN': sendMailTopic.topicArn,
        'REGION': region
      }
    });
    sendMailTopic.grantPublish(snsPublishFunction);
    snsPublishFunction.addEventSource(new SqsEventSource(lambdaLoopDeadLetterQueue, {}));

    // Lambda Function Name Output.
    new cdk.CfnOutput(this, 'Amazon SQS With DLQ Loop Function', {value: loopSqsWithDlqFunction.functionName});
    new cdk.CfnOutput(this, 'Amazon SQS Without DLQ Loop Function', {value: loopSqsFunction.functionName});
    new cdk.CfnOutput(this, 'Amazon SNS Loop Function', {value: loopSnsFunction.functionName});
    new cdk.CfnOutput(this, 'Amazon S3 Loop Function', {value: loopS3Function.functionName});
  }
}
