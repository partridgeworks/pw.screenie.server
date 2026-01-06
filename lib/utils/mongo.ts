import { connect, connection, Mongoose } from "mongoose";
import logger from "@/lib/utils/serverLogger";

// Global connection cache
let cachedMongoose: Mongoose | null = null;
let connectionPromise: Promise<Mongoose> | null = null;

/**
 * Get or create a Mongoose connection with proper caching and error handling.
 * 
 * This function:
 * - Reuses existing connections across multiple calls
 * - Handles concurrent connection attempts gracefully
 * - Validates connection health before returning
 * - Automatically reconnects if connection is lost
 * 
 * Safe to call multiple times per request or worker session.
 */
export async function getMongoose(): Promise<Mongoose> {
  // Return cached connection if valid and ready
  if (cachedMongoose && isConnectionHealthy()) {
    return cachedMongoose;
  }

  // If a connection is already being established, wait for it
  if (connectionPromise) {
    try {
      return await connectionPromise;
    } catch (error) {
      // If the pending connection failed, clear it and try again
      connectionPromise = null;
      cachedMongoose = null;
      throw error;
    }
  }

  // Create new connection
  connectionPromise = establishConnection();

  try {
    const mongoose = await connectionPromise;
    cachedMongoose = mongoose;
    return mongoose;
  } catch (error) {
    // Clear cache on failure so next call will retry
    connectionPromise = null;
    cachedMongoose = null;
    throw error;
  } finally {
    // Clear the promise reference once settled (success or failure)
    // This allows future calls to check cache or create new connections
    connectionPromise = null;
  }
}

/**
 * Check if the current cached connection is healthy and ready to use
 */
function isConnectionHealthy(): boolean {
  if (!cachedMongoose) {
    return false;
  }

  // Check Mongoose connection state
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const state = connection.readyState;
  
  if (state !== 1) {
    logger.warn("[Mongo]", `Connection state is ${state} (not connected). Will reconnect.`);
    return false;
  }

  return true;
}

/**
 * Establish a new MongoDB connection with all initialization logic
 */
async function establishConnection(): Promise<Mongoose> {
  try {
    const stringDatabaseURI = process.env.DATABASE_URI;
    if (!stringDatabaseURI || !stringDatabaseURI.length) {
      throw new Error("No DATABASE_URI configured");
    }

    logger.info("[Mongo]", "Establishing new MongoDB connection...");
    logger.info("[Mongo]", "Database URI:", stringDatabaseURI.replace(/\/\/(.*)@/, "//****:****@")); // Mask credentials
    
    // Connect with proper options
    const conn = await connect(stringDatabaseURI, {
      // Recommended production settings
      maxPoolSize: 10, // Maximum number of connections in the pool
      minPoolSize: 2,  // Minimum number of connections to maintain
      serverSelectionTimeoutMS: 5000, // Fail fast if can't connect
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });

    logger.info("[Mongo]", "Successfully connected to MongoDB");

    // Set up connection event listeners (only once per process)
    setupConnectionListeners();

    return conn;
  } catch (error) {
    logger.error("[Mongo]", "Failed to connect to MongoDB", error);
    throw error;
  }
}

/**
 * Set up event listeners for connection state changes
 * Only sets up once per process (checks if already set up)
 */
function setupConnectionListeners(): void {
  // Check if listeners are already set up by looking at listener count
  if (connection.listenerCount("disconnected") > 0) {
    return; // Already set up
  }

  connection.on("connected", () => {
    logger.info("[Mongo]", "Connection established");
  });

  connection.on("disconnected", () => {
    logger.warn("[Mongo]", "Connection lost. Will attempt to reconnect on next query.");
    // Clear cache so next getMongoose() call will reconnect
    cachedMongoose = null;
  });

  connection.on("error", (err) => {
    logger.error("[Mongo]", "Connection error:", err);
    // Clear cache to force reconnection
    cachedMongoose = null;
  });

  connection.on("reconnected", () => {
    logger.info("[Mongo]", "Successfully reconnected to MongoDB");
  });
}

/**
 * Gracefully close the MongoDB connection (useful for graceful shutdown)
 */
export async function closeMongoConnection(): Promise<void> {
  if (cachedMongoose) {
    try {
      await connection.close();
      logger.info("[Mongo]", "Connection closed gracefully");
    } catch (error) {
      logger.error("[Mongo]", "Error closing connection:", error);
    } finally {
      cachedMongoose = null;
      connectionPromise = null;
    }
  }
}
