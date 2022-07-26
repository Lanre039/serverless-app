import "source-map-support/register";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import * as middy from "middy";
import { cors, httpErrorHandler } from "middy/middlewares";
import { getUserId } from "../utils";
import { getTodosForUser } from "../../helpers/todos";

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // Write your code here
    const userId = getUserId(event);

    const todos = await getTodosForUser(userId);

    return {
      statusCode: 200,
      body: JSON.stringify({
        items: todos,
      }),
    };
  }
);

handler.use(httpErrorHandler()).use(
  cors({
    credentials: true,
  })
);
