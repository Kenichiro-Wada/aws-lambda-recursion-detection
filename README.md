# AWS Lambda Recursion Detection By AWS CDK

An environment will be created using AWS CDK to validate the "[Detecting and stopping recursive loops in AWS Lambda functions](https://aws.amazon.com/blogs/compute/detecting-and-stopping-recursive-loops-in-aws-lambda-functions/)" announced in July 2023.

The configurations that can be verified are as follows

- Loop with Amazon SQS With Dead Letter Queue
- Loop with Amazon SQS Without Dead Letter Queue
- Loop with Amazon SNS
- Loop combining Amazon SNS and Amazon SQS
- Loop combining Amazon SQS and AWS Lambda
- Loop with Amazon SQS and AWS Lambda
- Loop with Amazon S3 (this is a bonus)
  - **Caution !!!! Note !!!! This configuration can be verified, but is outside the scope of this detection and shutdown, so it is necessary to manually stop the execution of the Lambda function. Be sure to monitor metrics and logs during execution and stop it immediately. We are not responsible for any costs incurred if you forget to stop it!**

## Required

- AWS Account
- [AWS CLI(v2 recommended)](https://docs.aws.amazon.com/ja_jp/cli/latest/userguide/getting-started-install.html)
- [AWS CDK v2](https://docs.aws.amazon.com/ja_jp/cdk/v2/guide/getting_started.html)
- Node.js v18 or later
  - The AWS Lambda function created in this configuration will be a Node.js v18 runtime.
- Typescript (>5.1.6)

## Command

### Build-up

- Install what you need. \*Omitted.
- Clone this repository and move it to the project repository.

```
$ git clone https://github.com/Kenichiro-Wada/aws-lambda-recursion-detection
$ cd aws-lambda-recursion-detection/
```

- When a message is received in DLQ, Lambda will send an Email via Amazon SNS (which does not loop), so set the email address.

`lib/aws-lambda-recursion-detection-stack.ts`

```
    // Sending Email(Your Email)
    const emailAddress = 'hogehoge@example.com' //<- Change Your Email Address.
```

- Install the required modules.

`$ npm i`

- Deploy and note the name of the Lambda function that will be output after execution.

`$ cdk deploy`

The following will appear in Outputs

```
Outputs:

AwsLambdaRecursionDetectionStack.AmazonS3LoopFunction = AwsLambdaRecursion~ <- For Loop with Amazon S3
AwsLambdaRecursionDetectionStack.AmazonSNSLoopFunction = AwsLambdaRecursion~ <- For Loop with Amazon SNS
AwsLambdaRecursionDetectionStack.AmazonSQSLambdaLoopFunction = AwsLambdaRecursion~ <- For Loop with Amazon SNS and AWS Lambda combined
AwsLambdaRecursionDetectionStack.AmazonSQSSNSLoopFunction = AwsLambdaRecursion~ <- For Loop with Amazon SNS and Amazon SQS
AwsLambdaRecursionDetectionStack.AmazonSQSWithDLQLoopFunction = AwsLambdaRecursion~ <- For Loop with Amazon SQS With Dead Letter Queue
AwsLambdaRecursionDetectionStack.AmazonSQSWithoutDLQLoopFunction = AwsLambdaRecursion~ <- For Loop with Amazon SQS Without Dead Letter Queue
AwsLambdaRecursionDetectionStack.PythagoreanSwitchLoopFunction = AwsLambdaRecursion~ <- For Loop with Amazon SQS and AWS Lambda are linked together

```

- You will receive an email with the subject `AWS Notification - Subscription Confirmation` to the email you set up.

### Execute

Execute the following command.
It is executable with AWS CLI v2, so don't forget to install it when you run it.

Also, don't forget to look at Cloudwatch Logs and metrics!

- Loop with Amazon SQS With Dead Letter Queue

```
$ aws lambda invoke --function-name {Value output to AwsLambdaRecursionDetectionStack.AmazonSQSWithDLQLoopFunction} \
 --payload file://test/sqs-test.json \
 --cli-binary-format raw-in-base64-out \
 response.json
```

- Loop with Amazon SQS Without Dead Letter Queue

```
$ aws lambda invoke --function-name {Value output to AwsLambdaRecursionDetectionStack.AmazonSQSWithoutDLQLoopFunction} \
 --payload file://test/sqs-test.json \
 --cli-binary-format raw-in-base64-out \
 response.json
```

- Loop with Amazon SNS

```
$ aws lambda invoke --function-name {Value output to AwsLambdaRecursionDetectionStack.AmazonSNSLoopFunction} \
 --payload file://test/sns-test.json \
 --cli-binary-format raw-in-base64-out \
 response.json
```

- For Loop with Amazon SNS and Amazon SQS

```
$ aws lambda invoke --function-name {Value output to AwsLambdaRecursionDetectionStack.AmazonSQSSNSLoopFunction} \
 --payload file://test/sqs-test.json \
 --cli-binary-format raw-in-base64-out \
 response.json
```

- For Loop with Amazon SNS and AWS Lambda combined

```
$ aws lambda invoke --function-name {Value output to AwsLambdaRecursionDetectionStack.AmazonSQSLambdaLoopFunction} \
 --payload file://test/sqs-test.json \
 --cli-binary-format raw-in-base64-out \
 response.json
```

- For Loop with Amazon SQS and AWS Lambda are linked together

```
$ aws lambda invoke --function-name {Value output to AwsLambdaRecursionDetectionStack.PythagoreanSwitchLoopFunction} \
 --payload file://test/sqs-test.json \
 --cli-binary-format raw-in-base64-out \
 response.json
```

#### Confirmation

The metrics for the relevant Lambda function show that it stopped 16 times.

If you check Clouwatch Logs, you will see that the execution is logged 16 times.

For example, for a loop in SQS, if you do a search on `Message has been sent to the queue`, you should get 16 records.

**Please note the following when executing: !!!! (Execution is at your own risk)**

- Looping with Amazon S3

**(Caution!) When this Lambda is executed, it will run about 20 times per minute. Throttling it to stop it immediately!!!!**

**As soon as you run it, run the following command to force it to stop!!!!**

```
$ aws lambda invoke --function-name {Value output to AwsLambdaRecursionDetectionStack.AmazonS3LoopFunction} \
 response.json
```

- Stop the execution of the Lambda function

**forgetting to stop may result in charges !!!!**

```
$ aws lambda put-function-concurrency \
 --function-name {AwsLambdaRecursionDetectionStack.AmazonS3LoopFunction} \
 --reserved-concurrent-executions 0
```

- Enable re-run

```
$ aws lambda put-function-concurrency \
 --function-name {AwsLambdaRecursionDetectionStack.AmazonS3LoopFunction} \
 --reserved-concurrent-executions 1
```

### Clean up

`$ cdk destroy`

\*If you have executed the S3 loop pattern, the file remains in the bucket, so delete it before executing the above command.

## Disclaimers

**We are not responsible for any costs incurred if you forget to stop the loop in Amazon S3 when you run it.**

## Author

Kenichiro Wada(@Keni_W)
