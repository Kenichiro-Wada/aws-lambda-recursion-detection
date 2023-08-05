# AWS Lambda Recursion Detection By AWS CDK
2023年7月に発表された「[Detecting and stopping recursive loops in AWS Lambda functions](https://aws.amazon.com/blogs/compute/detecting-and-stopping-recursive-loops-in-aws-lambda-functions/)」を検証するための環境をAWS CDKを使って構築します。

検証できる構成は、以下になります。
- Amazon SQS With Dead Letter Queueでのループ
- Amazon SQS Without Dead Letter Queueでのループ
- Amazon SNSでのループ
- Amazon S3でのループ(これはおまけ)
    - **注意!!!!注意!!!!この構成は検証できますが、今回の検知および停止の対象外なので、手動でLambda関数の実行を停止することが必要です。実行の際には、メトリクスやログを必ず監視し、すぐに止めるようにしてください。止め忘れた場合に発生する費用については、一切の責任を負いません**

## 必要なもの
- AWS Account
- [AWS CLI(なるべく最近)](https://docs.aws.amazon.com/ja_jp/cli/latest/userguide/getting-started-install.html)
- [AWS CDK v2](https://docs.aws.amazon.com/ja_jp/cdk/v2/guide/getting_started.html)
- Node.js v18以降
    - 本構成で作成されるAWS Lambda関数はNode.js v18ランタイムになります。
- Typescript (>5.1.6)

## コマンド
### 構築
- 必要なもののインストールします。※割愛
- このレポジトリーをクローンして、プロジェクトレポジトリに移動します。

```
$ git clone https://github.com/Kenichiro-Wada/aws-lambda-recursion-detection
$ cd aws-lambda-recursion-detection/
```

- 必要なモジュールをインストールします。

`$ npm i`

- DLQにメッセージが入った際に、LambdaからAmazon SNS(これはループしない)経由で、Emailを飛ばすので、そのメールアドレスを設定します。

`lib/aws-lambda-recursion-detection-stack.ts`

```
    // Sending Email(Your Email)
    const emailAddress = 'hogehoge@example.com' //<- Change Your Email Address.
```

- デプロイして、実行後に出力されるLambda関数名をメモします。

`$ cdk deploy`

Outputsに以下のように表示されます。

```
Outputs:
AwsLambdaRecursionDetectionStack.AmazonS3LoopFunction = AwsLambdaRecursion~ <- Amazon S3でのループ用
AwsLambdaRecursionDetectionStack.AmazonSNSLoopFunction = AwsLambdaRecursion~ <- Amazon SNSでのループ用
AwsLambdaRecursionDetectionStack.AmazonSQSWithDLQLoopFunction = AwsLambdaRecursion~ <- Amazon SQS With Dead Letter Queueでのループ用
AwsLambdaRecursionDetectionStack.AmazonSQSWithoutDLQLoopFunction = AwsLambdaRecursion~ <- Amazon SQS Without Dead Letter Queueでのループ用
```

- 設定したEmailに `AWS Notification - Subscription Confirmation` という件名でメールが届いているので、メール内の `Confirm subscription` をクリックします。

### 実行
以下のコマンドを実行します。
実行の際には、Cloudwatch Logsやメトリクスを見るように!

- Amazon SQS With Dead Letter Queueでのループ

```
$ aws lambda invoke --function-name {AwsLambdaRecursionDetectionStack.AmazonSQSWithDLQLoopFunctionで出力された値} \
 --payload file://test/sqs-test.json \
 --cli-binary-format raw-in-base64-out \
 response.json
```

- Amazon SQS Without Dead Letter Queueでのループ

```
$ aws lambda invoke --function-name {AwsLambdaRecursionDetectionStack.AmazonSQSWithoutDLQLoopFunctionで出力された値} \
 --payload file://test/sqs-test.json \
 --cli-binary-format raw-in-base64-out \
 response.json
```

- Amazon SNSでのループ

```
$ aws lambda invoke --function-name {AwsLambdaRecursionDetectionStack.AmazonSNSLoopFunctionで出力された値} \
 --payload file://test/sns-test.json \
 --cli-binary-format raw-in-base64-out \
 response.json
```

#### 確認

該当Lambda関数のメトリクスを見ると、16回で停止していることがわかります。

Clouwatch Logsを確認すると、実行のログが16回出ていると思います。

例えば SQSでのループの場合、`Message has been sent to the queue` で検索をかけると、16つのレコードが出てくるはずです。

**以下実行時は注意！！！！！(実行は自己責任です)**

- Amazon S3でのループ

**(注意!)このLambdaを実行すると、1分間に20回程度実行されます。すぐにスロットリングさせて止めること!!!**

**実行したらすぐに次のコマンドを実行して、強制的に停止させること!!!**

```
$ aws lambda invoke --function-name {AwsLambdaRecursionDetectionStack.AmazonS3LoopFunctionで出力された値} \
 response.json
```

- Lambda関数の実行を止める

**止めるのを忘れると課金が発生する可能性があります!!!!**

```
$ aws lambda put-function-concurrency \
 --function-name {AwsLambdaRecursionDetectionStack.AmazonS3LoopFunction} \
 --reserved-concurrent-executions 0
```

- 再実行できるようにする

```
$ aws lambda put-function-concurrency \
 --function-name {AwsLambdaRecursionDetectionStack.AmazonS3LoopFunction} \
 --reserved-concurrent-executions 1
```

### 後片付け

`$ cdk destroy`

## 免責事項
**Amazon S3でのループを実行した際に、止め忘れた場合に発生した費用については、一切の責任を負いかねます。**
