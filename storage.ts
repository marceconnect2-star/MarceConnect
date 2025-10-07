import {
  users,
  categories,
  projects,
  comments,
  likes,
  blogPosts,
  faqs,
  faqAnswers,
  cncBrands,
  projectImages,
  projectVideos,
  type User,
  type UpsertUser,
  type Category,
  type InsertCategory,
  type Project,
  type InsertProject,
  type ProjectWithAuthor,
  type Comment,
  type InsertComment,
  type CommentWithAuthor,
  type Like,
  type BlogPost,
  type InsertBlogPost,
  type BlogPostWithAuthor,
  type Faq,
  type InsertFaq,
  type FaqAnswer,
  type InsertFaqAnswer,
  type FaqAnswerWithAuthor,
  type ProjectImage,
  type InsertProjectImage,
  type ProjectVideo,
  type InsertProjectVideo,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, ilike } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(user: Partial<User>): Promise<User>;
  getTechnicians(): Promise<User[]>;
  
  // Category operations
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // CNC Brands operations
  getCncBrands(): Promise<any[]>;
  
  // Project operations
  getProjects(limit?: number, categoryId?: string): Promise<ProjectWithAuthor[]>;
  getProjectById(id: string): Promise<ProjectWithAuthor | undefined>;
  getProjectImages(projectId: string): Promise<any[]>;
  addProjectImage(image: any): Promise<any>;
  createProject(project: InsertProject): Promise<Project>;
  createProjectWithMedia(project: InsertProject, images: any[], videos: any[]): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  incrementDownloadCount(projectId: string): Promise<void>;
  
  // Comment operations
  getCommentsByProject(projectId: string): Promise<CommentWithAuthor[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  
  // Like operations
  toggleLike(projectId: string, userId: string): Promise<{ liked: boolean; count: number }>;
  
  // Blog operations
  getBlogPosts(limit?: number): Promise<BlogPostWithAuthor[]>;
  getBlogPostBySlug(slug: string): Promise<BlogPostWithAuthor | undefined>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: string, post: Partial<InsertBlogPost>): Promise<BlogPost>;
  deleteBlogPost(id: string): Promise<void>;
  
  // FAQ operations
  getFaqs(limit?: number, category?: string): Promise<any[]>;
  getFaqById(id: string): Promise<any | undefined>;
  createFaq(faq: InsertFaq): Promise<Faq>;
  updateFaq(id: string, faq: Partial<InsertFaq>): Promise<Faq>;
  deleteFaq(id: string): Promise<void>;
  incrementFaqViewCount(faqId: string): Promise<void>;
  
  // FAQ Answer operations
  getFaqAnswers(faqId: string): Promise<FaqAnswerWithAuthor[]>;
  createFaqAnswer(answer: InsertFaqAnswer): Promise<FaqAnswer>;
  updateFaqAnswer(id: string, answer: Partial<InsertFaqAnswer>): Promise<FaqAnswer>;
  deleteFaqAnswer(id: string): Promise<void>;
  markAnswerAsAccepted(faqId: string, answerId: string): Promise<void>;
  
  // Statistics operations
  getStatistics(): Promise<{
    totalUsers: number;
    totalProjects: number;
    totalDownloads: number;
    totalLikes: number;
    totalBlogPosts: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData as any)
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.email,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getTechnicians(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(
        and(
          sql`${users.accountType} IN ('TECHNICAL', 'COMPANY')`,
          sql`${users.firstName} IS NOT NULL`
        )
      )
      .orderBy(desc(users.createdAt));
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.name);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async getCncBrands(): Promise<any[]> {
    return await db.select().from(cncBrands).orderBy(cncBrands.name);
  }

  // Project operations
  async getProjects(limit = 50, categoryId?: string): Promise<ProjectWithAuthor[]> {
    const query = db
      .select({
        id: projects.id,
        title: projects.title,
        description: projects.description,
        categoryId: projects.categoryId,
        authorId: projects.authorId,
        imageUrl: projects.imageUrl,
        fileUrl: projects.fileUrl,
        fileName: projects.fileName,
        fileType: projects.fileType,
        fileSize: projects.fileSize,
        downloadCount: projects.downloadCount,
        likeCount: projects.likeCount,
        isPublic: projects.isPublic,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        author: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          bio: users.bio,
          accountType: users.accountType,
          companyName: users.companyName,
          jobTitle: users.jobTitle,
          companyWebsite: users.companyWebsite,
          isVerified: users.isVerified,
          isAdmin: users.isAdmin,
          cncMachine: users.cncMachine,
          camSoftware: users.camSoftware,
          yearsExperience: users.yearsExperience,
          specialties: users.specialties,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
        category: {
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          createdAt: categories.createdAt,
        },
      })
      .from(projects)
      .innerJoin(users, eq(projects.authorId, users.id))
      .leftJoin(categories, eq(projects.categoryId, categories.id))
      .where(and(
        eq(projects.isPublic, true),
        categoryId ? eq(projects.categoryId, categoryId) : undefined
      ))
      .orderBy(desc(projects.createdAt))
      .limit(limit);

    return await query;
  }

  async getProjectById(id: string): Promise<ProjectWithAuthor | undefined> {
    const [project] = await db
      .select({
        id: projects.id,
        title: projects.title,
        description: projects.description,
        categoryId: projects.categoryId,
        authorId: projects.authorId,
        imageUrl: projects.imageUrl,
        fileUrl: projects.fileUrl,
        fileName: projects.fileName,
        fileType: projects.fileType,
        fileSize: projects.fileSize,
        downloadCount: projects.downloadCount,
        likeCount: projects.likeCount,
        isPublic: projects.isPublic,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        author: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          bio: users.bio,
          accountType: users.accountType,
          companyName: users.companyName,
          jobTitle: users.jobTitle,
          companyWebsite: users.companyWebsite,
          isVerified: users.isVerified,
          isAdmin: users.isAdmin,
          cncMachine: users.cncMachine,
          camSoftware: users.camSoftware,
          yearsExperience: users.yearsExperience,
          specialties: users.specialties,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
        category: {
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          createdAt: categories.createdAt,
        },
      })
      .from(projects)
      .innerJoin(users, eq(projects.authorId, users.id))
      .leftJoin(categories, eq(projects.categoryId, categories.id))
      .where(eq(projects.id, id));

    return project;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async createProjectWithMedia(
    project: InsertProject, 
    images: Array<{ imageUrl: string; caption?: string; order: number }>,
    videos: Array<{ videoUrl: string; title?: string; description?: string; order: number }>
  ): Promise<Project> {
    return await db.transaction(async (tx) => {
      const [newProject] = await tx.insert(projects).values(project).returning();
      
      if (images.length > 0) {
        await tx.insert(projectImages).values(
          images.map(img => ({
            projectId: newProject.id,
            imageUrl: img.imageUrl,
            caption: img.caption || null,
            order: img.order,
          }))
        );
      }
      
      if (videos.length > 0) {
        await tx.insert(projectVideos).values(
          videos.map(vid => ({
            projectId: newProject.id,
            videoUrl: vid.videoUrl,
            title: vid.title || null,
            description: vid.description || null,
            order: vid.order,
          }))
        );
      }
      
      return newProject;
    });
  }

  async updateProject(id: string, project: Partial<InsertProject>): Promise<Project> {
    const [updatedProject] = await db
      .update(projects)
      .set({ ...project, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return updatedProject;
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  async incrementDownloadCount(projectId: string): Promise<void> {
    await db
      .update(projects)
      .set({ downloadCount: sql`${projects.downloadCount} + 1` })
      .where(eq(projects.id, projectId));
  }

  async getProjectImages(projectId: string): Promise<any[]> {
    return await db
      .select()
      .from(projectImages)
      .where(eq(projectImages.projectId, projectId))
      .orderBy(projectImages.order);
  }

  async addProjectImage(image: any): Promise<any> {
    const [result] = await db
      .insert(projectImages)
      .values(image)
      .returning();
    return result;
  }

  // Comment operations
  async getCommentsByProject(projectId: string): Promise<CommentWithAuthor[]> {
    return await db
      .select({
        id: comments.id,
        content: comments.content,
        projectId: comments.projectId,
        authorId: comments.authorId,
        createdAt: comments.createdAt,
        author: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          bio: users.bio,
          accountType: users.accountType,
          companyName: users.companyName,
          jobTitle: users.jobTitle,
          companyWebsite: users.companyWebsite,
          isVerified: users.isVerified,
          isAdmin: users.isAdmin,
          cncMachine: users.cncMachine,
          camSoftware: users.camSoftware,
          yearsExperience: users.yearsExperience,
          specialties: users.specialties,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(comments)
      .innerJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.projectId, projectId))
      .orderBy(desc(comments.createdAt));
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    return newComment;
  }

  // Like operations
  async toggleLike(projectId: string, userId: string): Promise<{ liked: boolean; count: number }> {
    const [existingLike] = await db
      .select()
      .from(likes)
      .where(and(eq(likes.projectId, projectId), eq(likes.userId, userId)));

    if (existingLike) {
      // Remove like
      await db
        .delete(likes)
        .where(and(eq(likes.projectId, projectId), eq(likes.userId, userId)));
      
      await db
        .update(projects)
        .set({ likeCount: sql`${projects.likeCount} - 1` })
        .where(eq(projects.id, projectId));
    } else {
      // Add like
      await db.insert(likes).values({ projectId, userId });
      
      await db
        .update(projects)
        .set({ likeCount: sql`${projects.likeCount} + 1` })
        .where(eq(projects.id, projectId));
    }

    const [project] = await db
      .select({ likeCount: projects.likeCount })
      .from(projects)
      .where(eq(projects.id, projectId));

    return {
      liked: !existingLike,
      count: project?.likeCount || 0,
    };
  }

  // Blog operations
  async getBlogPosts(limit = 20): Promise<BlogPostWithAuthor[]> {
    return await db
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        content: blogPosts.content,
        excerpt: blogPosts.excerpt,
        imageUrl: blogPosts.imageUrl,
        authorId: blogPosts.authorId,
        slug: blogPosts.slug,
        category: blogPosts.category,
        isPublished: blogPosts.isPublished,
        createdAt: blogPosts.createdAt,
        updatedAt: blogPosts.updatedAt,
        author: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          bio: users.bio,
          accountType: users.accountType,
          companyName: users.companyName,
          jobTitle: users.jobTitle,
          companyWebsite: users.companyWebsite,
          isVerified: users.isVerified,
          isAdmin: users.isAdmin,
          cncMachine: users.cncMachine,
          camSoftware: users.camSoftware,
          yearsExperience: users.yearsExperience,
          specialties: users.specialties,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(blogPosts)
      .innerJoin(users, eq(blogPosts.authorId, users.id))
      .where(eq(blogPosts.isPublished, true))
      .orderBy(desc(blogPosts.createdAt))
      .limit(limit);
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPostWithAuthor | undefined> {
    const [post] = await db
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        content: blogPosts.content,
        excerpt: blogPosts.excerpt,
        imageUrl: blogPosts.imageUrl,
        authorId: blogPosts.authorId,
        slug: blogPosts.slug,
        category: blogPosts.category,
        isPublished: blogPosts.isPublished,
        createdAt: blogPosts.createdAt,
        updatedAt: blogPosts.updatedAt,
        author: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          bio: users.bio,
          accountType: users.accountType,
          companyName: users.companyName,
          jobTitle: users.jobTitle,
          companyWebsite: users.companyWebsite,
          isVerified: users.isVerified,
          isAdmin: users.isAdmin,
          cncMachine: users.cncMachine,
          camSoftware: users.camSoftware,
          yearsExperience: users.yearsExperience,
          specialties: users.specialties,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(blogPosts)
      .innerJoin(users, eq(blogPosts.authorId, users.id))
      .where(and(eq(blogPosts.slug, slug), eq(blogPosts.isPublished, true)));

    return post;
  }

  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    const [newPost] = await db.insert(blogPosts).values(post).returning();
    return newPost;
  }

  async updateBlogPost(id: string, post: Partial<InsertBlogPost>): Promise<BlogPost> {
    const [updatedPost] = await db
      .update(blogPosts)
      .set({ ...post, updatedAt: new Date() })
      .where(eq(blogPosts.id, id))
      .returning();
    return updatedPost;
  }

  async deleteBlogPost(id: string): Promise<void> {
    await db.delete(blogPosts).where(eq(blogPosts.id, id));
  }

  // FAQ operations
  async getFaqs(limit = 50, category?: string): Promise<any[]> {
    let query = db
      .select({
        faq: faqs,
        author: users,
      })
      .from(faqs)
      .leftJoin(users, eq(faqs.authorId, users.id))
      .where(eq(faqs.isPublished, true))
      .orderBy(desc(faqs.createdAt));

    if (category) {
      query = query.where(and(eq(faqs.isPublished, true), eq(faqs.category, category)));
    }

    const results = await query.limit(limit);
    
    return results.map((row) => ({
      ...row.faq,
      author: row.author,
    }));
  }

  async getFaqById(id: string): Promise<any | undefined> {
    const [result] = await db
      .select({
        faq: faqs,
        author: users,
      })
      .from(faqs)
      .leftJoin(users, eq(faqs.authorId, users.id))
      .where(eq(faqs.id, id));

    if (!result) return undefined;

    return {
      ...result.faq,
      author: result.author,
    };
  }

  async createFaq(faq: InsertFaq): Promise<Faq> {
    const [newFaq] = await db.insert(faqs).values(faq).returning();
    return newFaq;
  }

  async updateFaq(id: string, faq: Partial<InsertFaq>): Promise<Faq> {
    const [updatedFaq] = await db
      .update(faqs)
      .set({ ...faq, updatedAt: new Date() })
      .where(eq(faqs.id, id))
      .returning();
    return updatedFaq;
  }

  async deleteFaq(id: string): Promise<void> {
    await db.delete(faqs).where(eq(faqs.id, id));
  }

  async incrementFaqViewCount(faqId: string): Promise<void> {
    await db
      .update(faqs)
      .set({ viewCount: sql`${faqs.viewCount} + 1` })
      .where(eq(faqs.id, faqId));
  }

  // FAQ Answer operations
  async getFaqAnswers(faqId: string): Promise<FaqAnswerWithAuthor[]> {
    const results = await db
      .select({
        answer: faqAnswers,
        author: users,
      })
      .from(faqAnswers)
      .leftJoin(users, eq(faqAnswers.authorId, users.id))
      .where(eq(faqAnswers.faqId, faqId))
      .orderBy(desc(faqAnswers.isAccepted), desc(faqAnswers.createdAt));

    return results.map((row) => ({
      ...row.answer,
      author: row.author!,
    }));
  }

  async createFaqAnswer(answer: InsertFaqAnswer): Promise<FaqAnswer> {
    const [newAnswer] = await db.insert(faqAnswers).values(answer).returning();
    return newAnswer;
  }

  async updateFaqAnswer(id: string, answer: Partial<InsertFaqAnswer>): Promise<FaqAnswer> {
    const [updatedAnswer] = await db
      .update(faqAnswers)
      .set({ ...answer, updatedAt: new Date() })
      .where(eq(faqAnswers.id, id))
      .returning();
    return updatedAnswer;
  }

  async deleteFaqAnswer(id: string): Promise<void> {
    await db.delete(faqAnswers).where(eq(faqAnswers.id, id));
  }

  async markAnswerAsAccepted(faqId: string, answerId: string): Promise<void> {
    await db
      .update(faqAnswers)
      .set({ isAccepted: false })
      .where(eq(faqAnswers.faqId, faqId));

    await db
      .update(faqAnswers)
      .set({ isAccepted: true })
      .where(eq(faqAnswers.id, answerId));
  }

  // Statistics operations
  async getStatistics() {
    const [userCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);

    const [projectCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(eq(projects.isPublic, true));

    const [downloadSum] = await db
      .select({ total: sql<number>`sum(${projects.downloadCount})` })
      .from(projects);

    const [likeSum] = await db
      .select({ total: sql<number>`sum(${projects.likeCount})` })
      .from(projects);

    const [blogCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(blogPosts)
      .where(eq(blogPosts.isPublished, true));

    return {
      totalUsers: userCount?.count || 0,
      totalProjects: projectCount?.count || 0,
      totalDownloads: downloadSum?.total || 0,
      totalLikes: likeSum?.total || 0,
      totalBlogPosts: blogCount?.count || 0,
    };
  }
}

export const storage = new DatabaseStorage();
