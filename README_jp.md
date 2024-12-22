# AWS Lambda Recursion Detection By AWS CDK

2023 年 7 月に発表された「[Detecting and stopping recursive loops in AWS Lambda functions](https://aws.amazon.com/blogs/compute/detecting-and-stopping-recursive-loops-in-aws-lambda-functions/)」を検証するための環境を AWS CDK を使って構築します。

2024 年 10 月に[アップデート](https://aws.amazon.com/jp/about-aws/whats-new/2024/10/aws-lambda-detects-stops-recursive-loops-lambda-s3/)があり、S3間のLoopに関しても、検知と停止がされてるようになったので、対応の旨記載しました。



検証できる構成は、以下になります。

- Amazon SQS With Dead Letter Queue でのループ
- Amazon SQS Without Dead Letter Queue でのループ
- Amazon SNS でのループ
- Amazon SNS と Amazon SQS を組み合わせたループ
- Amazon SQS と AWS Lambda を組み合わせたループ
- Amazon SQS と AWS Lambda を数珠繋ぎにしたループ
- Amazon S3 でのループ(2024.10のアップデートで対応されました。嬉しい。)

## 必要なもの

- AWS Account
- [AWS CLI(v2 推奨)](https://docs.aws.amazon.com/ja_jp/cli/latest/userguide/getting-started-install.html)
- [AWS CDK v2](https://docs.aws.amazon.com/ja_jp/cdk/v2/guide/getting_started.html)
- Node.js v18 以降
  - 本構成で作成される AWS Lambda 関数は Node.js v18 ランタイムになります。
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

- DLQ にメッセージが入った際に、Lambda から Amazon SNS(これはループしない)経由で、Email を飛ばすので、そのメールアドレスを設定します。

`lib/aws-lambda-recursion-detection-stack.ts`

```
    // Sending Email(Your Email)
    const emailAddress = 'hogehoge@example.com' //<- Change Your Email Address.
```

- デプロイして、実行後に出力される Lambda 関数名をメモします。

`$ cdk deploy`

Outputs に以下のように表示されます。

```
Outputs:
AwsLambdaRecursionDetectionStack.AmazonS3LoopFunction = AwsLambdaRecursion~ <- Amazon S3でのループ用
AwsLambdaRecursionDetectionStack.AmazonSNSLoopFunction = AwsLambdaRecursion~ <- Amazon SNSでのループ用
AwsLambdaRecursionDetectionStack.AmazonSQSLambdaLoopFunction = AwsLambdaRecursion~ <- Amazon SNS と AWS Lambda を組み合わせた場合のループ用
AwsLambdaRecursionDetectionStack.AmazonSQSSNSLoopFunction = AwsLambdaRecursion~ <- Amazon SNS と Amazon SQS を組み合わせた場合のループ用
AwsLambdaRecursionDetectionStack.AmazonSQSWithDLQLoopFunction = AwsLambdaRecursion~ <- Amazon SQS With Dead Letter Queueでのループ用
AwsLambdaRecursionDetectionStack.AmazonSQSWithoutDLQLoopFunction = AwsLambdaRecursion~ <- Without Dead Letter Queue でのループ用
AwsLambdaRecursionDetectionStack.PythagoreanSwitchLoopFunction = AwsLambdaRecursion~ <- Amazon SQS と AWS Lambda を数珠繋ぎにした場合のループ用

```

- 設定した Email に `AWS Notification - Subscription Confirmation` という件名でメールが届いているので、メール内の `Confirm subscription` をクリックします。

### 実行

以下のコマンドを実行します。
AWS CLI v2 で実行可能になっていますので、実行の際は、インストールを忘れないようにしてください。

また、Cloudwatch Logs やメトリクスを見るのも忘れないように！

- Amazon SQS With Dead Letter Queue でのループ

```
$ aws lambda invoke --function-name {AwsLambdaRecursionDetectionStack.AmazonSQSWithDLQLoopFunctionで出力された値} \
 --payload file://test/sqs-test.json \
 --cli-binary-format raw-in-base64-out \
 response.json
```

- Amazon SQS Without Dead Letter Queue でのループ

```
$ aws lambda invoke --function-name {AwsLambdaRecursionDetectionStack.AmazonSQSWithoutDLQLoopFunctionで出力された値} \
 --payload file://test/sqs-test.json \
 --cli-binary-format raw-in-base64-out \
 response.json
```

- Amazon SNS でのループ

```
$ aws lambda invoke --function-name {AwsLambdaRecursionDetectionStack.AmazonSNSLoopFunctionで出力された値} \
 --payload file://test/sns-test.json \
 --cli-binary-format raw-in-base64-out \
 response.json
```

- Amazon SNS と Amazon SQS を組み合わせた場合のループ

```
$ aws lambda invoke --function-name {AwsLambdaRecursionDetectionStack.AmazonSQSSNSLoopFunctionで出力された値} \
 --payload file://test/sqs-test.json \
 --cli-binary-format raw-in-base64-out \
 response.json
```

- Amazon SNS と AWS Lambda を組み合わせた場合のループ

```
$ aws lambda invoke --function-name {AwsLambdaRecursionDetectionStack.AmazonSQSLambdaLoopFunctionで出力された値} \
 --payload file://test/sqs-test.json \
 --cli-binary-format raw-in-base64-out \
 response.json
```

- Amazon SQS と AWS Lambda を数珠繋ぎにした場合のループ

```
$ aws lambda invoke --function-name {AwsLambdaRecursionDetectionStack.PythagoreanSwitchLoopFunctionで出力された値} \
 --payload file://test/sqs-test.json \
 --cli-binary-format raw-in-base64-out \
 response.json
```

- Amazon S3 でのループ

```
$ aws lambda invoke --function-name {AwsLambdaRecursionDetectionStack.AmazonS3LoopFunctionで出力された値} \
 response.json
```

#### 確認

該当 Lambda 関数のメトリクスを見ると、16 回で停止していることがわかります。

Clouwatch Logs を確認すると、実行のログが 16 回出ていると思います。

例えば SQS でのループの場合、`Message has been sent to the queue` で検索をかけると、16 つのレコードが出てくるはずです。


### 後片付け

`$ cdk destroy`

※S3 のループパターンを実行した場合は、バケットにファイルが残っているので、削除してから上記コマンドを実行してください。


## 作者

Kenichiro Wada(@Keni_W)
