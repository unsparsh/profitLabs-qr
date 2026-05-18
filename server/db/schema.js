const { pgTable, uuid, varchar, text, timestamp, boolean, integer, json, pgEnum } = require('drizzle-orm/pg-core');

// Enums
const planEnum = pgEnum('plan', ['trial', 'basic', 'premium']);
const statusEnum = pgEnum('status', ['active', 'inactive', 'canceled']);
const roleEnum = pgEnum('role', ['admin', 'staff']);
const requestTypeEnum = pgEnum('request_type', ['call-service', 'order-food', 'room-service', 'complaint', 'custom-message', 'wifi-support', 'security-alert']);
const requestStatusEnum = pgEnum('request_status', ['pending', 'in-progress', 'completed', 'canceled']);
const priorityEnum = pgEnum('priority', ['low', 'medium', 'high']);
const toneEnum = pgEnum('tone', ['professional', 'friendly', 'apologetic']);

const hotels = pgTable('hotels', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 50 }).notNull(),
  address: text('address').notNull(),
  totalRooms: integer('total_rooms').notNull(),
  subscriptionPlan: planEnum('subscription_plan').default('trial'),
  subscriptionStatus: statusEnum('subscription_status').default('active'),
  subscriptionExpiresAt: timestamp('subscription_expires_at').defaultNow(),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  settings: json('settings').default({
    servicesEnabled: { callServiceBoy: true, orderFood: true, requestRoomService: true, lodgeComplaint: true, customMessage: true },
    notifications: { sound: true, email: true },
    emergencyContact: { phone: '+91 9876543210', description: 'Available 24/7 for any assistance' }
  }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

const subscriptionActiveEnum = pgEnum('subscription_active', ['Active', 'Inactive']);

const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: roleEnum('role').default('admin'),
  hotelId: uuid('hotel_id').references(() => hotels.id).notNull(),
  subscriptionActive: subscriptionActiveEnum('subscription_active').default('Inactive'),
  activeSubscriptionAmount: integer('active_subscription_amount').default(0),
  subscriptionDuration: integer('subscription_duration').default(0), // in days
  subscriptionExpiresAt: timestamp('subscription_expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

const rooms = pgTable('rooms', {
  id: uuid('id').defaultRandom().primaryKey(),
  hotelId: uuid('hotel_id').references(() => hotels.id).notNull(),
  number: varchar('number', { length: 50 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  uuid: varchar('uuid', { length: 255 }).notNull().unique(),
  qrCode: text('qr_code').notNull(),
  isActive: boolean('is_active').default(true),
  type: varchar('type', { length: 50 }).default('Standard'),
  status: varchar('status', { length: 50 }).default('available'),
  rate: integer('rate').default(2500),
  maxOccupancy: integer('max_occupancy').default(2),
  amenities: json('amenities').default('[]'),
  currentGuest: json('current_guest'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

const requests = pgTable('requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  hotelId: uuid('hotel_id').references(() => hotels.id).notNull(),
  roomId: uuid('room_id').references(() => rooms.id).notNull(),
  roomNumber: varchar('room_number', { length: 50 }).notNull(),
  guestPhone: varchar('guest_phone', { length: 50 }).notNull(),
  type: requestTypeEnum('type').notNull(),
  message: text('message').notNull(),
  orderDetails: json('order_details'),
  status: requestStatusEnum('status').default('pending'),
  priority: priorityEnum('priority').default('medium'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

const foodItems = pgTable('food_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  hotelId: uuid('hotel_id').references(() => hotels.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  price: integer('price').notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  isAvailable: boolean('is_available').default(true),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

const roomServiceItems = pgTable('room_service_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  hotelId: uuid('hotel_id').references(() => hotels.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }).notNull(),
  estimatedTime: varchar('estimated_time', { length: 100 }).notNull(),
  isAvailable: boolean('is_available').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

const complaintItems = pgTable('complaint_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  hotelId: uuid('hotel_id').references(() => hotels.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }).notNull(),
  priority: priorityEnum('priority').notNull(),
  isAvailable: boolean('is_available').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

const googleAuths = pgTable('google_auths', {
  id: uuid('id').defaultRandom().primaryKey(),
  hotelId: uuid('hotel_id').references(() => hotels.id).notNull(),
  googleAccountId: varchar('google_account_id', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  picture: text('picture'),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token').notNull(),
  businessName: varchar('business_name', { length: 255 }),
  businessId: varchar('business_id', { length: 255 }),
  expiresAt: timestamp('expires_at').notNull(),
  businessLocationId: varchar('business_location_id', { length: 255 }),
  reviewsCache: json('reviews_cache'),
  cacheTimestamp: timestamp('cache_timestamp'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

const templates = pgTable('templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  hotelId: uuid('hotel_id').references(() => hotels.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  content: text('content').notNull(),
  tone: toneEnum('tone').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

module.exports = {
  planEnum, statusEnum, roleEnum, requestTypeEnum, requestStatusEnum, priorityEnum, toneEnum, subscriptionActiveEnum,
  hotels, users, rooms, requests, foodItems, roomServiceItems, complaintItems, googleAuths, templates
};
