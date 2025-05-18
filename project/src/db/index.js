import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();


const connectionString = process.env.DATABASE_URL;


const queryClient = postgres(connectionString);


const db = drizzle(queryClient);

export default db;