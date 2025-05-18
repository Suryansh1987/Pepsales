import { pgTable, serial, varchar, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';


export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});


export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  type: varchar('type', { length: 50 }).notNull(), 
  status: varchar('status', { length: 50 }).default('unread').notNull(), 
  metadata: text('metadata'), 
  createdAt: timestamp('created_at').defaultNow().notNull(),
  isEmailed: boolean('is_emailed').default(false).notNull(), 
  emailStatus: varchar('email_status', { length: 50 }),
  retryCount: integer('retry_count').default(0).notNull() 
});