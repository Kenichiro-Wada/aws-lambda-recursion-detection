#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AwsLambdaRecursionDetectionStack } from '../lib/aws-lambda-recursion-detection-stack';

const app = new cdk.App();
new AwsLambdaRecursionDetectionStack(app, 'AwsLambdaRecursionDetectionStack', {
});