import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";

export class FakeTubePersistentStack extends Stack {
  public readonly bucket: s3.Bucket;
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.bucket = new s3.Bucket(this, "VideoMiniaturesBucket", {
      bucketName: `video-miniatures-${Stack.of(this).account}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      publicReadAccess: true,
    });

    this.table = new dynamodb.Table(this, 'VideoTable', {
      partitionKey: { name: 'Id', type: dynamodb.AttributeType.STRING },
      stream: dynamodb.StreamViewType.NEW_IMAGE,
    });
  }
}
