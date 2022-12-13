import nodeFetch from "node-fetch";

import { Upload } from "@aws-sdk/lib-storage";
import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { DynamoDBStreamEvent, Handler } from 'aws-lambda';

import { getS3Client } from "./s3";
import { updateVideo } from "./repository";

const uploadItemToS3 = async (body: Buffer, key: string): Promise<string> => {
  const upload = new Upload({
    client: getS3Client(),
    params: {
      Body: body,
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
    },
  })

  await upload.done();

  return `https://${process.env.S3_BUCKET_NAME!}.s3.amazonaws.com/${key}`;
};

const getMiniatureAndUpload = async (id: string): Promise<string> => {
  const url = `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;

  const fetchResult = await nodeFetch(url);
  const fileContent = await fetchResult.blob();

  return uploadItemToS3(fileContent, `${id}.jpg`);
}

// export const handler: Handler<{ id: string }, string> = async (event) => {
//   const { id } = event;
//   return await getMiniatureAndUpload(id);
// }

export const handler: Handler<
  DynamoDBStreamEvent,
  void | string
  > = async (event) => {
  const additionEvents = event.Records.filter((record) => record.eventName === "INSERT");
  const result = await Promise.all(additionEvents.map(async (record) => {
    const { Id } = unmarshall(record.dynamodb!.NewImage as Record<string, AttributeValue>);

    const uploadedFileUrl = await getMiniatureAndUpload(Id);

    return updateVideo(Id, uploadedFileUrl);
  }));
  result.forEach((video) => console.log(`Update video ${video.id}`))
}
