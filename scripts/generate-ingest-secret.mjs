#!/usr/bin/env node
/**
 * Print a random ingest secret suitable for INTEGRATIONS_INGEST_SECRET.
 * Add the line to .env.local (never commit the value).
 */
import crypto from "node:crypto";

const secret = crypto.randomBytes(32).toString("hex");
console.log(`INTEGRATIONS_INGEST_SECRET=${secret}`);
