/**
 * Phase 2 Database Migration Script
 * 
 * This script migrates the database to support Phase 2 features:
 * - PullRequest collection
 * - Verification collection
 * - Institution collection
 * - Protocol branching fields
 * 
 * Run with: npx tsx scripts/migrate-phase2.ts
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/labchain";

async function migrate() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection failed");
    }

    // 1. Create PullRequest collection if it doesn't exist
    console.log("\n1. Creating PullRequest collection...");
    const prCollections = await db.listCollections({ name: "pullrequests" }).toArray();
    if (prCollections.length === 0) {
      await db.createCollection("pullrequests");
      console.log("✓ PullRequest collection created");
    } else {
      console.log("✓ PullRequest collection already exists");
    }

    // Create indexes for PullRequest
    const prCollection = db.collection("pullrequests");
    await prCollection.createIndex({ protocolId: 1, status: 1 });
    await prCollection.createIndex({ authorId: 1, status: 1 });
    await prCollection.createIndex({ createdAt: -1 });
    console.log("✓ PullRequest indexes created");

    // 2. Create Verification collection if it doesn't exist
    console.log("\n2. Creating Verification collection...");
    const verificationCollections = await db
      .listCollections({ name: "verifications" })
      .toArray();
    if (verificationCollections.length === 0) {
      await db.createCollection("verifications");
      console.log("✓ Verification collection created");
    } else {
      console.log("✓ Verification collection already exists");
    }

    // Create indexes for Verification
    const verificationCollection = db.collection("verifications");
    await verificationCollection.createIndex({ subjectId: 1, subjectType: 1 });
    await verificationCollection.createIndex({ institutionId: 1, timestamp: -1 });
    await verificationCollection.createIndex({ verifierId: 1, timestamp: -1 });
    console.log("✓ Verification indexes created");

    // 3. Create Institution collection if it doesn't exist
    console.log("\n3. Creating Institution collection...");
    const institutionCollections = await db
      .listCollections({ name: "institutions" })
      .toArray();
    if (institutionCollections.length === 0) {
      await db.createCollection("institutions");
      console.log("✓ Institution collection created");
    } else {
      console.log("✓ Institution collection already exists");
    }

    // Create indexes for Institution
    const institutionCollection = db.collection("institutions");
    await institutionCollection.createIndex({ name: 1 }, { unique: true });
    console.log("✓ Institution indexes created");

    // 4. Update existing Protocol documents with branching fields
    console.log("\n4. Updating Protocol documents with branching fields...");
    const protocolCollection = db.collection("protocols");
    const updateResult = await protocolCollection.updateMany(
      {
        $or: [
          { currentBranch: { $exists: false } },
          { branches: { $exists: false } },
        ],
      },
      {
        $set: {
          currentBranch: "main",
          branches: [],
        },
      }
    );
    console.log(`✓ Updated ${updateResult.modifiedCount} protocol documents`);

    console.log("\n✅ Migration completed successfully!");
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
}

// Run migration
migrate();

