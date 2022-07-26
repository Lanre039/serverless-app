import * as AWS from "aws-sdk";
import * as AWSXRay from "aws-xray-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { createLogger } from "../utils/logger";
import { TodoItem } from "../models/TodoItem";
import { TodoUpdate } from "../models/TodoUpdate";
import * as uuid from "uuid";

const XAWS = AWSXRay.captureAWS(AWS);

const logger = createLogger("TodosAccess");

// TODO: Implement the dataLayer logic
export class TodoAccess {
  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly todoTable = process.env.TODOS_TABLE,
    // private readonly todoTableIndex = process.env.TODOS_CREATED_AT_INDEX,
    private readonly todoByUserIndex = process.env.TODOS_BY_USER_INDEX,
    private readonly bucketName = process.env.ATTACHMENTS_S3_BUCKET,
    private readonly urlExpiration = process.env.SIGNED_URL_EXPIRATION,
    private readonly s3 = new XAWS.S3({ signatureVersion: "v4" })
  ) {}

  async getTodosForUser(userId: string): Promise<TodoItem[]> {
    logger.info("Getting all todos", { userId });
    const result = await this.docClient
      .query({
        TableName: this.todoTable,
        IndexName: this.todoByUserIndex,
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": userId,
        },
      })
      .promise();

    const items = result.Items;
    return items as TodoItem[];
  }

  async createTodo(userId: string, todo: TodoItem): Promise<TodoItem> {
    const todoId = uuid.v4();

    const newItem = {
      userId,
      todoId,
      createdAt: new Date().toISOString(),
      name: todo.name,
      dueDate: todo.dueDate,
      done: false,
      attachmentUrl: todo.attachmentUrl,
    };

    logger.info("Storing new item: ", newItem);
    this.docClient.delete;
    await this.docClient
      .put({
        TableName: this.todoTable,
        Item: newItem,
      })
      .promise();

    return newItem;
  }

  async updateTodo(
    updateTodoItem: TodoUpdate,
    userId: string,
    todoId: string
  ): Promise<void> {
    logger.info("updating todoItem for user", {
      userId,
      todoId,
      updateTodoItem,
    });

    await this.docClient
      .update({
        TableName: this.todoTable,
        Key: {
          userId: userId,
          todoId: todoId,
        },
        UpdateExpression: "set #name=:name, dueDate=:dueDate, done=:done",
        ExpressionAttributeValues: {
          ":name": updateTodoItem.name,
          ":dueDate": updateTodoItem.dueDate,
          ":done": updateTodoItem.done,
        },
        ExpressionAttributeNames: {
          "#name": "name",
        },
      })
      .promise();
  }

  async deleteTodo(userId: string, todoId: string): Promise<void> {
    logger.info("deleting todoItem for user", { userId, todoId });

    await this.docClient
      .delete({
        TableName: this.todoTable,
        Key: {
          userId: userId,
          todoId: todoId,
        },
      })
      .promise();
  }

  async updateAttachmentUrl(userId: string, todoId: string): Promise<void> {
    logger.info("updating attachment url", { userId, todoId });

    await this.docClient
      .update({
        TableName: this.todoTable,
        Key: {
          userId: userId,
          todoId: todoId,
        },
        UpdateExpression: "set attachmentUrl=:attachmentUrl",
        ExpressionAttributeValues: {
          ":attachmentUrl": `https://${this.bucketName}.s3.amazonaws.com/${todoId}`,
        },
      })
      .promise();
  }

  async getSignedUrl(bucketKey: string): Promise<string> {
    logger.info("getting signed url");

    return this.s3.getSignedUrl("putObject", {
      Bucket: this.bucketName,
      Key: bucketKey,
      Expires: Number(this.urlExpiration),
    });
  }

  async deleteTodoAttachment(bucketKey: string): Promise<void> {
    logger.info("delete todo attachment");

    await this.s3
      .deleteObject({
        Bucket: this.bucketName,
        Key: bucketKey,
      })
      .promise();
  }
}

function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    console.log("Creating a local DynamoDB instance");
    return new AWS.DynamoDB.DocumentClient({
      region: "localhost",
      endpoint: "http://localhost:8000",
    });
  }
  return new AWS.DynamoDB.DocumentClient();
}
