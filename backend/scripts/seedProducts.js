/**
 * Data Seeder: Populate existing DynamoDB Products table with SmartCart Catalog
 *
 * Usage:
 *   PRODUCTS_TABLE="YourExistingProductsTableName" AWS_REGION="us-east-1" node backend/scripts/seedProducts.js
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { products } from '../../src/data/products.js';

const tableName = process.env.PRODUCTS_TABLE;
const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;

if (!tableName) {
  console.error('\n❌ ERROR: Please specify the PRODUCTS_TABLE environment variable.');
  console.error('Example:');
  console.error('  $env:PRODUCTS_TABLE="SmartCartProducts"; node backend/scripts/seedProducts.js\n');
  process.exit(1);
}

const client = new DynamoDBClient(region ? { region } : {});
const docClient = DynamoDBDocumentClient.from(client);

async function seed() {
  console.log(`\n📦 Seeding ${products.length} SmartCart products into DynamoDB table: "${tableName}" (region: ${region})...\n`);

  let successCount = 0;
  for (const product of products) {
    try {
      await docClient.send(new PutCommand({
        TableName: tableName,
        Item: {
          ...product,
          // Store both numeric and string representation for flexibility
          id: product.id,
          updatedAt: new Date().toISOString(),
        },
      }));
      console.log(`  ✓ Uploaded Product [${product.id}]: ${product.name} (₹${product.price})`);
      successCount++;
    } catch (err) {
      console.error(`  ✕ Failed to upload Product [${product.id}]:`, err.message);
    }
  }

  console.log(`\n🎉 Seeding complete: ${successCount}/${products.length} products stored in DynamoDB table "${tableName}".\n`);
}

seed();
