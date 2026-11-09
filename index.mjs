
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

import {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand
} from "@aws-sdk/lib-dynamodb";

import { randomUUID } from "node:crypto";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-south-1"
});

const db = DynamoDBDocumentClient.from(client);

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || "SmartCartProducts";
const ORDERS_TABLE = process.env.ORDERS_TABLE;

function getCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": process.env.CORS_ALLOW_ORIGIN || "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Content-Type": "application/json"
  };
}

function response(statusCode, body) {
  return {
    statusCode,
    headers: getCorsHeaders(),
    body: body === null ? "" : JSON.stringify(body)
  };
}

export const handler = async (event) => {
  try {
    const method = event.requestContext?.http?.method || event.httpMethod;
    const path = event.rawPath || event.path || "/";

    if (method === "OPTIONS") {
      return response(204, null);
    }

    if (
      method === "GET" &&
      (path === "/" || path === "/products" || path.endsWith("/products"))
    ) {
      if (!PRODUCTS_TABLE) {
        return response(500, {
          message: "The DynamoDB products table is not configured."
        });
      }

      const products = [];
      let lastEvaluatedKey;
      do {
        const result = await db.send(
          new ScanCommand({
            TableName: PRODUCTS_TABLE,
            Limit: 100,
            ...(lastEvaluatedKey ? { ExclusiveStartKey: lastEvaluatedKey } : {})
          })
        );
        products.push(...(result.Items || []));
        lastEvaluatedKey = result.LastEvaluatedKey;
      } while (lastEvaluatedKey);

      return response(200, products.map(item => ({
        ...item,
        id: item.id ?? item.productId ?? item.sku,
        name: item.name ?? item.productName,
        image: item.image ?? item.imageUrl
      })));
    }

    // Place a test order
    if (method === "POST" && (path === "/orders" || path.endsWith("/orders"))) {
      const order = JSON.parse(event.body || "{}");

      if (
        !Array.isArray(order.items) ||
        order.items.length === 0
      ) {
        return response(400, { message: "Order items are required" });
      }

      const newOrder = {
        orderId: randomUUID(),
        items: order.items,
        totalAmount: Number(order.totalAmount),
        status: "Placed",
        createdAt: new Date().toISOString()
      };

      if (
        !Number.isFinite(newOrder.totalAmount) ||
        newOrder.totalAmount < 0
      ) {
        return response(400, { message: "Invalid order amount" });
      }

      await db.send(
        new PutCommand({
          TableName: ORDERS_TABLE,
          Item: newOrder
        })
      );

      return response(201, {
        message: "Order saved successfully",
        order: newOrder
      });
    }

    return response(404, { message: "Route not found" });

  } catch (error) {
    console.error("SmartCart backend error:", error);

    return response(500, { message: "Internal server error" });
  }
};
