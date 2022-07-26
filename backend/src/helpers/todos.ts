import { TodoItem } from "../models/TodoItem";
import { CreateTodoRequest } from "../requests/CreateTodoRequest";
import { UpdateTodoRequest } from "../requests/UpdateTodoRequest";
import { TodoAccess } from "./todosAcess";
// TODO: Implement businessLogic
const todoAccess = new TodoAccess();

export async function getTodosForUser(userId: string): Promise<TodoItem[]> {
  return todoAccess.getTodosForUser(userId);
}

export async function createTodo(
  createTodoRequest: CreateTodoRequest,
  userId: string
): Promise<TodoItem> {
  return await todoAccess.createTodo(userId, createTodoRequest as TodoItem);
}

export async function updateTodo(
  updateTodoRequest: UpdateTodoRequest,
  userId: string,
  todoId: string
): Promise<void> {
  return await todoAccess.updateTodo(updateTodoRequest, userId, todoId);
}

export async function createAttachmentPresignedUrl(
  userId: string,
  todoId: string
): Promise<string> {
  const uploadUrl = await todoAccess.getSignedUrl(todoId);
  await todoAccess.updateAttachmentUrl(userId, todoId);

  return uploadUrl;
}

export async function deleteTodo(
  userId: string,
  todoId: string
): Promise<void> {
  await Promise.all([
    // todoid is the bucketKey
    todoAccess.deleteTodo(userId, todoId),
    todoAccess.deleteTodoAttachment(todoId),
  ]);
}
