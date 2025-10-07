import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const accountTypeEnum = pgEnum("account_type", ["USER", "TECHNICAL", "COMPANY", "MACHINE_REP", "SOFTWARE_REP"]);
export const blogCategoryEnum = pgEnum("blog_category", ["TUTORIAL", "TIPS", "TECHNICAL_SUPPORT", "FAQ", "NEWS"]);
export const threadTypeEnum = pgEnum("thread_type", ["DISCUSSION", "QUESTION", "SHOWCASE", "ANNOUNCEMENT", "TECHNICAL_SUPPORT"]);
export const threadStatusEnum = pgEnum("thread_status", ["OPEN", "SOLVED", "CLOSED", "PINNED"]);
export const moderationActionEnum = pgEnum("moderation_action", ["WARN", "HIDE", "DELETE", "BAN", "APPROVE"]);
export const fileTypeEnum = pgEnum("file_type", ["DXF", "STL", "SVG", "STEP", "IGES", "PDF", "ZIP", "GCODE", "IMAGE", "OTHER"]);
export const materialTypeEnum = pgEnum("material_type", ["MDF", "COMPENSADO", "MADEIRA_MACICA", "ACRILICO", "ALUMINIO", "PLASTICO", "OUTRO"]);

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// CNC Router Brands table (defined before users for foreign key reference)
export const cncBrands = pgTable("cnc_brands", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  category: varchar("category").notNull().default("router"),
  website: varchar("website"),
  logoUrl: varchar("logo_url"),
  description: text("description"),
  isSponsor: boolean("is_sponsor").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  passwordHash: varchar("password_hash"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  bio: text("bio"),
  accountType: accountTypeEnum("account_type").default("USER"),
  companyName: varchar("company_name"),
  jobTitle: varchar("job_title"),
  companyWebsite: varchar("company_website"),
  isVerified: boolean("is_verified").default(false),
  isAdmin: boolean("is_admin").default(false),
  isBanned: boolean("is_banned").default(false),
  cncMachine: varchar("cnc_machine"),
  camSoftware: varchar("cam_software"),
  yearsExperience: integer("years_experience"),
  specialties: text("specialties").array(),
  city: varchar("city"),
  state: varchar("state"),
  serviceArea: text("service_area"),
  cncBrandId: varchar("cnc_brand_id").references(() => cncBrands.id),
  isIndependent: boolean("is_independent").default(false),
  machinesMaintenance: text("machines_maintenance").array(),
  phoneNumber: varchar("phone_number"),
  whatsappNumber: varchar("whatsapp_number"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  slug: varchar("slug").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  categoryId: varchar("category_id").references(() => categories.id),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  imageUrl: varchar("image_url"),
  fileUrl: varchar("file_url"),
  fileName: varchar("file_name"),
  fileType: varchar("file_type"),
  fileSize: integer("file_size"),
  downloadCount: integer("download_count").default(0),
  likeCount: integer("like_count").default(0),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const likes = pgTable("likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const blogPosts = pgTable("blog_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  imageUrl: varchar("image_url"),
  fileUrl: varchar("file_url"),
  fileName: varchar("file_name"),
  fileType: varchar("file_type"),
  fileSize: integer("file_size"),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  slug: varchar("slug").notNull().unique(),
  category: blogCategoryEnum("category").default("TUTORIAL"),
  isPublished: boolean("is_published").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const faqs = pgTable("faqs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  question: varchar("question").notNull(),
  answer: text("answer"),
  fileUrl: varchar("file_url"),
  fileName: varchar("file_name"),
  fileType: varchar("file_type"),
  fileSize: integer("file_size"),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  category: varchar("category"),
  viewCount: integer("view_count").default(0),
  isPublished: boolean("is_published").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const faqAnswers = pgTable("faq_answers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  faqId: varchar("faq_id").references(() => faqs.id, { onDelete: 'cascade' }).notNull(),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  isAccepted: boolean("is_accepted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const threads = pgTable("threads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  type: threadTypeEnum("type").default("DISCUSSION"),
  status: threadStatusEnum("status").default("OPEN"),
  categoryId: varchar("category_id").references(() => categories.id),
  viewCount: integer("view_count").default(0),
  replyCount: integer("reply_count").default(0),
  upvotes: integer("upvotes").default(0),
  downvotes: integer("downvotes").default(0),
  isPinned: boolean("is_pinned").default(false),
  isLocked: boolean("is_locked").default(false),
  acceptedAnswerId: varchar("accepted_answer_id").references(() => threadPosts.id),
  lastActivityAt: timestamp("last_activity_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const threadPosts = pgTable("thread_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  threadId: varchar("thread_id").references(() => threads.id, { onDelete: 'cascade' }).notNull(),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  parentPostId: varchar("parent_post_id").references((): any => threadPosts.id, { onDelete: 'cascade' }),
  upvotes: integer("upvotes").default(0),
  downvotes: integer("downvotes").default(0),
  isAccepted: boolean("is_accepted").default(false),
  isEdited: boolean("is_edited").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tags = pgTable("tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  slug: varchar("slug").notNull().unique(),
  description: text("description"),
  color: varchar("color").default("#4D9FFF"),
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const threadTags = pgTable("thread_tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  threadId: varchar("thread_id").references(() => threads.id, { onDelete: 'cascade' }).notNull(),
  tagId: varchar("tag_id").references(() => tags.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const votes = pgTable("votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  threadId: varchar("thread_id").references(() => threads.id, { onDelete: 'cascade' }),
  postId: varchar("post_id").references(() => threadPosts.id, { onDelete: 'cascade' }),
  value: integer("value").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueThreadVote: unique("unique_user_thread_vote").on(table.userId, table.threadId),
  uniquePostVote: unique("unique_user_post_vote").on(table.userId, table.postId),
}));

export const userReputations = pgTable("user_reputations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  points: integer("points").default(0),
  level: integer("level").default(1),
  questionsAsked: integer("questions_asked").default(0),
  answersGiven: integer("answers_given").default(0),
  acceptedAnswers: integer("accepted_answers").default(0),
  helpfulVotes: integer("helpful_votes").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const badges = pgTable("badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  icon: varchar("icon"),
  color: varchar("color").default("#FFD700"),
  type: varchar("type").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userBadges = pgTable("user_badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  badgeId: varchar("badge_id").references(() => badges.id).notNull(),
  earnedAt: timestamp("earned_at").defaultNow(),
});

export const moderationActions = pgTable("moderation_actions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  moderatorId: varchar("moderator_id").references(() => users.id).notNull(),
  targetUserId: varchar("target_user_id").references(() => users.id),
  targetThreadId: varchar("target_thread_id").references(() => threads.id),
  targetPostId: varchar("target_post_id").references(() => threadPosts.id),
  action: moderationActionEnum("action").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const threadSubscriptions = pgTable("thread_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  threadId: varchar("thread_id").references(() => threads.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const threadFiles = pgTable("thread_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  threadId: varchar("thread_id").references(() => threads.id, { onDelete: 'cascade' }).notNull(),
  fileName: varchar("file_name").notNull(),
  fileUrl: varchar("file_url").notNull(),
  fileType: fileTypeEnum("file_type").notNull(),
  fileSize: integer("file_size"),
  description: text("description"),
  downloadCount: integer("download_count").default(0),
  rating: integer("rating").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const threadMetadata = pgTable("thread_metadata", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  threadId: varchar("thread_id").references(() => threads.id, { onDelete: 'cascade' }).notNull().unique(),
  materialType: materialTypeEnum("material_type"),
  materialDetails: varchar("material_details"),
  cncMachine: varchar("cnc_machine"),
  cncSoftware: varchar("cnc_software"),
  toolUsed: varchar("tool_used"),
  toolDiameter: varchar("tool_diameter"),
  cuttingSpeed: varchar("cutting_speed"),
  spindleSpeed: varchar("spindle_speed"),
  isVerifiedContent: boolean("is_verified_content").default(false),
  verifiedByUserId: varchar("verified_by_user_id").references(() => users.id),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const postImages = pgTable("post_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").references(() => threadPosts.id, { onDelete: 'cascade' }).notNull(),
  imageUrl: varchar("image_url").notNull(),
  caption: text("caption"),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const projectImages = pgTable("project_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  imageUrl: varchar("image_url").notNull(),
  caption: text("caption"),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const projectVideos = pgTable("project_videos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  videoUrl: varchar("video_url").notNull(),
  title: varchar("title"),
  description: text("description"),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cncTools = pgTable("cnc_tools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(),
  diameter: varchar("diameter"),
  length: varchar("length"),
  material: varchar("material"),
  flutes: integer("flutes"),
  maxRpm: integer("max_rpm"),
  manufacturer: varchar("manufacturer"),
  notes: text("notes"),
  isPublic: boolean("is_public").default(false),
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userGallery = pgTable("user_gallery", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  imageUrl: varchar("image_url").notNull(),
  projectId: varchar("project_id").references(() => projects.id),
  threadId: varchar("thread_id").references(() => threads.id),
  isFeatured: boolean("is_featured").default(false),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const materials = pgTable("materials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(),
  description: text("description"),
  density: varchar("density"),
  hardness: varchar("hardness"),
  recommendedFeedRate: varchar("recommended_feed_rate"),
  recommendedSpindleSpeed: varchar("recommended_spindle_speed"),
  recommendedDepthOfCut: varchar("recommended_depth_of_cut"),
  notes: text("notes"),
  contributedBy: varchar("contributed_by").references(() => users.id),
  upvotes: integer("upvotes").default(0),
  downvotes: integer("downvotes").default(0),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const challenges = pgTable("challenges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  theme: varchar("theme").notNull(),
  rules: text("rules"),
  prizeDescription: text("prize_description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  votingEndDate: timestamp("voting_end_date"),
  status: varchar("status").notNull().default('draft'),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  winnerId: varchar("winner_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const challengeSubmissions = pgTable("challenge_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  challengeId: varchar("challenge_id").references(() => challenges.id, { onDelete: 'cascade' }).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  imageUrls: text("image_urls").array(),
  fileUrls: text("file_urls").array(),
  projectLink: varchar("project_link"),
  votes: integer("votes").default(0),
  isWinner: boolean("is_winner").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: varchar("type").notNull(),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  category: varchar("category"),
  skills: text("skills").array(),
  machinesAvailable: text("machines_available").array(),
  location: varchar("location"),
  priceRange: varchar("price_range"),
  availability: varchar("availability"),
  contactInfo: text("contact_info"),
  imageUrls: text("image_urls").array(),
  status: varchar("status").notNull().default('active'),
  views: integer("views").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  projects: many(projects),
  comments: many(comments),
  likes: many(likes),
  blogPosts: many(blogPosts),
  faqs: many(faqs),
  threads: many(threads),
  threadPosts: many(threadPosts),
  votes: many(votes),
  reputation: one(userReputations, {
    fields: [users.id],
    references: [userReputations.userId],
  }),
  badges: many(userBadges),
  subscriptions: many(threadSubscriptions),
  cncTools: many(cncTools),
  gallery: many(userGallery),
  materials: many(materials),
  challenges: many(challenges),
  challengeSubmissions: many(challengeSubmissions),
  services: many(services),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  projects: many(projects),
  threads: many(threads),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  author: one(users, {
    fields: [projects.authorId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [projects.categoryId],
    references: [categories.id],
  }),
  comments: many(comments),
  likes: many(likes),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [comments.projectId],
    references: [projects.id],
  }),
}));

export const likesRelations = relations(likes, ({ one }) => ({
  user: one(users, {
    fields: [likes.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [likes.projectId],
    references: [projects.id],
  }),
}));

export const blogPostsRelations = relations(blogPosts, ({ one }) => ({
  author: one(users, {
    fields: [blogPosts.authorId],
    references: [users.id],
  }),
}));

export const faqsRelations = relations(faqs, ({ one }) => ({
  author: one(users, {
    fields: [faqs.authorId],
    references: [users.id],
  }),
}));

export const threadsRelations = relations(threads, ({ one, many }) => ({
  author: one(users, {
    fields: [threads.authorId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [threads.categoryId],
    references: [categories.id],
  }),
  posts: many(threadPosts),
  tags: many(threadTags),
  votes: many(votes),
  subscriptions: many(threadSubscriptions),
  files: many(threadFiles),
  metadata: one(threadMetadata, {
    fields: [threads.id],
    references: [threadMetadata.threadId],
  }),
  galleryItems: many(userGallery),
}));

export const threadPostsRelations = relations(threadPosts, ({ one, many }) => ({
  author: one(users, {
    fields: [threadPosts.authorId],
    references: [users.id],
  }),
  thread: one(threads, {
    fields: [threadPosts.threadId],
    references: [threads.id],
  }),
  votes: many(votes),
  images: many(postImages),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  threads: many(threadTags),
}));

export const threadTagsRelations = relations(threadTags, ({ one }) => ({
  thread: one(threads, {
    fields: [threadTags.threadId],
    references: [threads.id],
  }),
  tag: one(tags, {
    fields: [threadTags.tagId],
    references: [tags.id],
  }),
}));

export const votesRelations = relations(votes, ({ one }) => ({
  user: one(users, {
    fields: [votes.userId],
    references: [users.id],
  }),
  thread: one(threads, {
    fields: [votes.threadId],
    references: [threads.id],
  }),
  post: one(threadPosts, {
    fields: [votes.postId],
    references: [threadPosts.id],
  }),
}));

export const userReputationsRelations = relations(userReputations, ({ one }) => ({
  user: one(users, {
    fields: [userReputations.userId],
    references: [users.id],
  }),
}));

export const badgesRelations = relations(badges, ({ many }) => ({
  users: many(userBadges),
}));

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, {
    fields: [userBadges.userId],
    references: [users.id],
  }),
  badge: one(badges, {
    fields: [userBadges.badgeId],
    references: [badges.id],
  }),
}));

export const threadSubscriptionsRelations = relations(threadSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [threadSubscriptions.userId],
    references: [users.id],
  }),
  thread: one(threads, {
    fields: [threadSubscriptions.threadId],
    references: [threads.id],
  }),
}));

export const threadFilesRelations = relations(threadFiles, ({ one }) => ({
  thread: one(threads, {
    fields: [threadFiles.threadId],
    references: [threads.id],
  }),
}));

export const threadMetadataRelations = relations(threadMetadata, ({ one }) => ({
  thread: one(threads, {
    fields: [threadMetadata.threadId],
    references: [threads.id],
  }),
  verifiedBy: one(users, {
    fields: [threadMetadata.verifiedByUserId],
    references: [users.id],
  }),
}));

export const postImagesRelations = relations(postImages, ({ one }) => ({
  post: one(threadPosts, {
    fields: [postImages.postId],
    references: [threadPosts.id],
  }),
}));

export const cncToolsRelations = relations(cncTools, ({ one }) => ({
  user: one(users, {
    fields: [cncTools.userId],
    references: [users.id],
  }),
}));

export const userGalleryRelations = relations(userGallery, ({ one }) => ({
  user: one(users, {
    fields: [userGallery.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [userGallery.projectId],
    references: [projects.id],
  }),
  thread: one(threads, {
    fields: [userGallery.threadId],
    references: [threads.id],
  }),
}));

export const materialsRelations = relations(materials, ({ one }) => ({
  contributor: one(users, {
    fields: [materials.contributedBy],
    references: [users.id],
  }),
}));

export const challengesRelations = relations(challenges, ({ one, many }) => ({
  creator: one(users, {
    fields: [challenges.createdBy],
    references: [users.id],
  }),
  winner: one(users, {
    fields: [challenges.winnerId],
    references: [users.id],
  }),
  submissions: many(challengeSubmissions),
}));

export const challengeSubmissionsRelations = relations(challengeSubmissions, ({ one }) => ({
  challenge: one(challenges, {
    fields: [challengeSubmissions.challengeId],
    references: [challenges.id],
  }),
  user: one(users, {
    fields: [challengeSubmissions.userId],
    references: [users.id],
  }),
}));

export const servicesRelations = relations(services, ({ one }) => ({
  user: one(users, {
    fields: [services.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  downloadCount: true,
  likeCount: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCncBrandSchema = createInsertSchema(cncBrands).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectImageSchema = createInsertSchema(projectImages).omit({
  id: true,
  createdAt: true,
});

export const insertProjectVideoSchema = createInsertSchema(projectVideos).omit({
  id: true,
  createdAt: true,
});

export const createProjectWithMediaSchema = insertProjectSchema.extend({
  images: z.array(z.object({
    imageUrl: z.string(),
    caption: z.string().optional(),
    order: z.number().int().min(0),
  })).optional(),
  videos: z.array(z.object({
    videoUrl: z.string(),
    title: z.string().optional(),
    description: z.string().optional(),
    order: z.number().int().min(0),
  })).optional(),
});

export const insertFaqSchema = createInsertSchema(faqs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
});

export const insertFaqAnswerSchema = createInsertSchema(faqAnswers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateUserSchema = createInsertSchema(users).partial().omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateProjectSchema = createInsertSchema(projects).partial().omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  downloadCount: true,
  likeCount: true,
  authorId: true,
});

export const updateBlogPostSchema = createInsertSchema(blogPosts).partial().omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  authorId: true,
});

export const updateCncBrandSchema = createInsertSchema(cncBrands).partial().omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertThreadSchema = createInsertSchema(threads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
  replyCount: true,
  upvotes: true,
  downvotes: true,
  lastActivityAt: true,
});

export const insertThreadPostSchema = createInsertSchema(threadPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  upvotes: true,
  downvotes: true,
  isAccepted: true,
  isEdited: true,
});

export const insertTagSchema = createInsertSchema(tags).omit({
  id: true,
  createdAt: true,
  usageCount: true,
});

export const insertVoteSchema = createInsertSchema(votes).omit({
  id: true,
  createdAt: true,
});

export const insertBadgeSchema = createInsertSchema(badges).omit({
  id: true,
  createdAt: true,
});

export const insertThreadFileSchema = createInsertSchema(threadFiles).omit({
  id: true,
  createdAt: true,
  downloadCount: true,
  rating: true,
});

export const insertThreadMetadataSchema = createInsertSchema(threadMetadata).omit({
  id: true,
  createdAt: true,
  isVerifiedContent: true,
  verifiedByUserId: true,
  verifiedAt: true,
});

export const insertPostImageSchema = createInsertSchema(postImages).omit({
  id: true,
  createdAt: true,
});

export const insertCncToolSchema = createInsertSchema(cncTools).omit({
  id: true,
  createdAt: true,
  usageCount: true,
});

export const insertUserGallerySchema = createInsertSchema(userGallery).omit({
  id: true,
  createdAt: true,
});

export const insertMaterialSchema = createInsertSchema(materials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  upvotes: true,
  downvotes: true,
  isVerified: true,
});

export const insertChallengeSchema = createInsertSchema(challenges).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  winnerId: true,
});

export const insertChallengeSubmissionSchema = createInsertSchema(challengeSubmissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  votes: true,
  isWinner: true,
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  views: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Like = typeof likes.$inferSelect;
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type CncBrand = typeof cncBrands.$inferSelect;
export type InsertCncBrand = z.infer<typeof insertCncBrandSchema>;
export type Faq = typeof faqs.$inferSelect;
export type InsertFaq = z.infer<typeof insertFaqSchema>;
export type FaqAnswer = typeof faqAnswers.$inferSelect;
export type InsertFaqAnswer = z.infer<typeof insertFaqAnswerSchema>;
export type Thread = typeof threads.$inferSelect;
export type InsertThread = z.infer<typeof insertThreadSchema>;
export type ThreadPost = typeof threadPosts.$inferSelect;
export type InsertThreadPost = z.infer<typeof insertThreadPostSchema>;
export type Tag = typeof tags.$inferSelect;
export type InsertTag = z.infer<typeof insertTagSchema>;
export type Vote = typeof votes.$inferSelect;
export type InsertVote = z.infer<typeof insertVoteSchema>;
export type UserReputation = typeof userReputations.$inferSelect;
export type Badge = typeof badges.$inferSelect;
export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type UserBadge = typeof userBadges.$inferSelect;
export type ThreadFile = typeof threadFiles.$inferSelect;
export type InsertThreadFile = z.infer<typeof insertThreadFileSchema>;
export type ThreadMetadata = typeof threadMetadata.$inferSelect;
export type InsertThreadMetadata = z.infer<typeof insertThreadMetadataSchema>;
export type PostImage = typeof postImages.$inferSelect;
export type InsertPostImage = z.infer<typeof insertPostImageSchema>;
export type ProjectImage = typeof projectImages.$inferSelect;
export type InsertProjectImage = z.infer<typeof insertProjectImageSchema>;
export type ProjectVideo = typeof projectVideos.$inferSelect;
export type InsertProjectVideo = z.infer<typeof insertProjectVideoSchema>;
export type CncTool = typeof cncTools.$inferSelect;
export type InsertCncTool = z.infer<typeof insertCncToolSchema>;
export type UserGalleryItem = typeof userGallery.$inferSelect;
export type InsertUserGalleryItem = z.infer<typeof insertUserGallerySchema>;
export type Material = typeof materials.$inferSelect;
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
export type Challenge = typeof challenges.$inferSelect;
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;
export type ChallengeSubmission = typeof challengeSubmissions.$inferSelect;
export type InsertChallengeSubmission = z.infer<typeof insertChallengeSubmissionSchema>;
export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;

// Extended types with relations
export type ProjectWithAuthor = Project & {
  author: User;
  category?: Category | null;
  comments?: (Comment & { author: User })[];
  likes?: Like[];
};

export type CommentWithAuthor = Comment & {
  author: User;
};

export type BlogPostWithAuthor = BlogPost & {
  author: User;
};

export type FaqWithAuthor = Faq & {
  author: User;
  answers?: FaqAnswerWithAuthor[];
};

export type FaqAnswerWithAuthor = FaqAnswer & {
  author: User;
};

export type ThreadWithDetails = Thread & {
  author: User & { 
    reputation?: UserReputation; 
    badges?: UserBadge[];
    gallery?: UserGalleryItem[];
  };
  category?: Category | null;
  posts?: ThreadPost[];
  tags?: Tag[];
  files?: ThreadFile[];
  metadata?: ThreadMetadata | null;
  _count?: {
    posts: number;
    votes: number;
    files: number;
  };
};

export type ThreadPostWithAuthor = ThreadPost & {
  author: User & { 
    reputation?: UserReputation; 
    badges?: UserBadge[];
  };
  images?: PostImage[];
  _count?: {
    votes: number;
  };
};

export type UserWithProfile = User & {
  reputation?: UserReputation;
  badges?: UserBadge[];
  gallery?: UserGalleryItem[];
  cncTools?: CncTool[];
  _count?: {
    projects: number;
    threads: number;
    posts: number;
  };
};

export type MaterialWithContributor = Material & {
  contributor?: User;
};

export type ChallengeWithDetails = Challenge & {
  creator: User;
  winner?: User | null;
  submissions?: ChallengeSubmissionWithUser[];
  _count?: {
    submissions: number;
  };
};

export type ChallengeSubmissionWithUser = ChallengeSubmission & {
  user: User & {
    reputation?: UserReputation;
    badges?: UserBadge[];
  };
  challenge?: Challenge;
};

export type ServiceWithUser = Service & {
  user: User & {
    reputation?: UserReputation;
    badges?: UserBadge[];
  };
};
