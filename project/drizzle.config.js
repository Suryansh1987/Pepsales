import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.js",
  dbCredentials: {
    url: "postgresql://neondb_owner:npg_vjl6dMiDIPU9@ep-holy-scene-a4f0os2f-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require",
  }
});
