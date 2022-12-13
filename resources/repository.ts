import { ScanCommand, PutCommand, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb"

import { getDynamoClient } from './db';

interface Video {
  id: string;
  title: string;
  miniatureUrl?: string;
}

export async function listVideos(): Promise<Video[]> {
  const dynamo = getDynamoClient();
  const scanResult = await dynamo.send(new ScanCommand({
    TableName: process.env.VIDEOS_TABLE_NAME,
  }));

  if (!scanResult.Items) {
    return [];
  }

  return scanResult.Items.map((item) => ({
    id: item.Id,
    title: item.Title,
    miniatureUrl: item.miniatureUrl ?? "",
  }));
}

export async function findVideo(id: string): Promise<Video | undefined> {
  const dynamo = getDynamoClient();

  const result = await dynamo.send(new GetCommand({
    TableName: process.env.VIDEOS_TABLE_NAME,
    Key: {
      Id: id,
    },
  }));

  if (!result.Item) {
    return;
  }

  return {
    id: result.Item.Id,
    title: result.Item.Title,
  };
}

export async function createVideo(id: string, title: string): Promise<Video> {
  const dynamo = getDynamoClient();

  await dynamo.send(new PutCommand({
    TableName: process.env.VIDEOS_TABLE_NAME,
    Item: {
      Id: id,
      Title: title,
    },
  }));

  return {
    id,
    title,
  }
}

export async function updateVideo(Id: string, miniatureUrl: string): Promise<Video> {
  const dynamo = getDynamoClient();

  const result = await dynamo.send(new UpdateCommand({
    ExpressionAttributeValues: {
      ":miniatureUrl": miniatureUrl,
    },
    Key: {
      Id,
    },
    TableName: process.env.VIDEOS_TABLE_NAME,
    UpdateExpression: "SET miniatureUrl = :miniatureUrl",
    ReturnValues: "ALL_NEW",
  }));

  return result.Attributes as Video;
}
