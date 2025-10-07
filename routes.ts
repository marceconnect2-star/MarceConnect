import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, canModifyResource, isAdmin } from "./localAuth";
import { insertProjectSchema, insertCommentSchema, insertCategorySchema, insertBlogPostSchema, insertFaqSchema, insertFaqAnswerSchema, insertCncBrandSchema, createProjectWithMediaSchema, updateProjectSchema, updateBlogPostSchema, updateCncBrandSchema, users, cncBrands } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import multer from "multer";
import path from "path";
import sharp from "sharp";
import fs from "fs/promises";

// Configure multer for file uploads with proper filename handling
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: multerStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.dxf', '.stl', '.pdf', '.zip', '.jpg', '.jpeg', '.png', '.svg', '.step', '.nc'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Multer específico para imagens (sem fileFilter restritivo)
const imageUpload = multer({
  storage: multerStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    // Aceitar qualquer arquivo aqui, a validação será feita depois com Sharp
    cb(null, true);
  },
});


  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Falha ao buscar usuário" });
    }
  });

  // Technicians routes
  app.get('/api/technicians', async (req, res) => {
    try {
      const technicians = await storage.getTechnicians();
      res.json(technicians);
    } catch (error) {
      console.error("Error fetching technicians:", error);
      res.status(500).json({ message: "Falha ao buscar técnicos" });
    }
  });

  // Categories routes
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Falha ao buscar categorias" });
    }
  });

  app.post('/api/categories', isAuthenticated, async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Falha ao criar categoria" });
    }
  });

  // Projects routes
  app.get('/api/projects', async (req, res) => {
    try {
      const { limit, categoryId } = req.query;
      const projects = await storage.getProjects(
        limit ? parseInt(limit as string) : undefined,
        categoryId as string
      );
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Falha ao buscar projetos" });
    }
  });

  app.get('/api/projects/:id', async (req, res) => {
    try {
      const project = await storage.getProjectById(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Projeto não encontrado" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Falha ao buscar projeto" });
    }
  });

  app.post('/api/projects', isAuthenticated, upload.any(), async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Find the main file
      const mainFile = req.files?.find((f: any) => f.fieldname === 'file');
      
      // Find additional images (any field starting with 'image_')
      const imageFiles = req.files?.filter((f: any) => f.fieldname.startsWith('image_')) || [];
      
      const projectData = insertProjectSchema.parse({
        ...req.body,
        authorId: userId,
        fileUrl: mainFile?.path,
        fileName: mainFile?.originalname,
        fileType: mainFile?.mimetype,
        fileSize: mainFile?.size,
      });
      
      const project = await storage.createProject(projectData);
      
      // If there are additional images, save them to projectImages table
      if (imageFiles.length > 0) {
        const imagePromises = imageFiles.map(async (file: any, index: number) => {
          return await storage.addProjectImage({
            projectId: project.id,
            imageUrl: file.path,
            caption: null,
            order: index
          });
        });
        await Promise.all(imagePromises);
      }
      
      res.json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Falha ao criar projeto" });
    }
  });

  app.post('/api/projects/create', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      const validatedData = createProjectWithMediaSchema.parse({
        ...req.body,
        authorId: userId,
      });
      
      const { images = [], videos = [], ...projectData } = validatedData;
      
      const project = await storage.createProjectWithMedia(projectData, images, videos);
      
      res.json(project);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        console.error("Validation error creating project:", error);
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      console.error("Error creating project with media:", error);
      res.status(500).json({ message: "Falha ao criar projeto" });
    }
  });

  app.put('/api/projects/:id', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const project = await storage.getProjectById(req.params.id);
      
      if (!project) {
        return res.status(404).json({ message: "Projeto não encontrado" });
      }
      
      const canModify = await canModifyResource(userId, project.authorId);
      if (!canModify) {
        return res.status(403).json({ message: "Não autorizado. Apenas o autor ou administrador pode editar este projeto." });
      }
      
      // Validate update data with Zod
      const updateData: any = { ...req.body };
      if (req.file) {
        updateData.fileUrl = req.file.path;
        updateData.fileName = req.file.originalname;
        updateData.fileType = req.file.mimetype;
        updateData.fileSize = req.file.size;
      }
      
      const validatedData = updateProjectSchema.parse(updateData);
      const updatedProject = await storage.updateProject(req.params.id, validatedData);
      res.json(updatedProject);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        console.error("Validation error updating project:", error);
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Falha ao atualizar projeto" });
    }
  });

  app.delete('/api/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const project = await storage.getProjectById(req.params.id);
      
      if (!project) {
        return res.status(404).json({ message: "Projeto não encontrado" });
      }
      
      const canModify = await canModifyResource(userId, project.authorId);
      if (!canModify) {
        return res.status(403).json({ message: "Não autorizado. Apenas o autor ou administrador pode deletar este projeto." });
      }
      
      await storage.deleteProject(req.params.id);
      res.json({ message: "Projeto deletado com sucesso" });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Falha ao deletar projeto" });
    }
  });

  // Download endpoint - serve the actual file
  app.get('/api/projects/:id/download', async (req, res) => {
    try {
      const project = await storage.getProjectById(req.params.id);
      
      if (!project) {
        return res.status(404).json({ message: "Projeto não encontrado" });
      }
      
      if (!project.fileUrl) {
        return res.status(404).json({ message: "Arquivo não encontrado" });
      }
      
      // Verify file exists before incrementing counter
      const filePath = path.join(process.cwd(), project.fileUrl);
      try {
        await fs.access(filePath);
      } catch {
        return res.status(404).json({ message: "Arquivo não encontrado no servidor" });
      }
      
      // Increment download count only if file exists
      await storage.incrementDownloadCount(req.params.id);
      
      // Set appropriate headers
      const contentType = project.fileType || 'application/octet-stream';
      const fileName = project.fileName || 'download';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      
      // Send the file
      res.sendFile(project.fileUrl, { root: process.cwd() });
    } catch (error) {
      console.error("Error downloading file:", error);
      res.status(500).json({ message: "Falha ao baixar arquivo" });
    }
  });

  // Legacy endpoint to register download
  app.post('/api/projects/:id/download', async (req, res) => {
    try {
      await storage.incrementDownloadCount(req.params.id);
      res.json({ message: "Download registrado" });
    } catch (error) {
      console.error("Error registering download:", error);
      res.status(500).json({ message: "Falha ao registrar download" });
    }
  });

  // Get project images
  app.get('/api/projects/:id/images', async (req, res) => {
    try {
      const images = await storage.getProjectImages(req.params.id);
      res.json(images);
    } catch (error) {
      console.error("Error fetching project images:", error);
      res.status(500).json({ message: "Falha ao buscar imagens" });
    }
  });

  // Comments routes
  app.get('/api/projects/:id/comments', async (req, res) => {
    try {
      const comments = await storage.getCommentsByProject(req.params.id);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Falha ao buscar comentários" });
    }
  });

  app.post('/api/projects/:id/comments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const commentData = insertCommentSchema.parse({
        ...req.body,
        projectId: req.params.id,
        authorId: userId,
      });
      
      const comment = await storage.createComment(commentData);
      res.json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Falha ao criar comentário" });
    }
  });

  // Likes routes
  app.post('/api/projects/:id/like', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const result = await storage.toggleLike(req.params.id, userId);
      res.json(result);
    } catch (error) {
      console.error("Error toggling like:", error);
      res.status(500).json({ message: "Falha ao curtir projeto" });
    }
  });

  // Blog routes
  app.get('/api/blog', async (req, res) => {
    try {
      const { limit } = req.query;
      const posts = await storage.getBlogPosts(
        limit ? parseInt(limit as string) : undefined
      );
      res.json(posts);
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      res.status(500).json({ message: "Falha ao buscar artigos" });
    }
  });

  app.get('/api/blog/:slug', async (req, res) => {
    try {
      const post = await storage.getBlogPostBySlug(req.params.slug);
      if (!post) {
        return res.status(404).json({ message: "Artigo não encontrado" });
      }
      res.json(post);
    } catch (error) {
      console.error("Error fetching blog post:", error);
      res.status(500).json({ message: "Falha ao buscar artigo" });
    }
  });

  app.post('/api/blog', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const postData = insertBlogPostSchema.parse({
        ...req.body,
        authorId: userId,
      });
      
      const post = await storage.createBlogPost(postData);
      res.json(post);
    } catch (error) {
      console.error("Error creating blog post:", error);
      res.status(500).json({ message: "Falha ao criar artigo" });
    }
  });

  app.put('/api/blog/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const post = await storage.getBlogPostBySlug(req.params.id);
      
      if (!post) {
        return res.status(404).json({ message: "Artigo não encontrado" });
      }
      
      const canModify = await canModifyResource(userId, post.authorId);
      if (!canModify) {
        return res.status(403).json({ message: "Não autorizado. Apenas o autor ou administrador pode editar este artigo." });
      }
      
      // Validate update data with Zod
      const validatedData = updateBlogPostSchema.parse(req.body);
      const updatedPost = await storage.updateBlogPost(post.id, validatedData);
      res.json(updatedPost);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        console.error("Validation error updating blog post:", error);
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      console.error("Error updating blog post:", error);
      res.status(500).json({ message: "Falha ao atualizar artigo" });
    }
  });

  app.delete('/api/blog/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const post = await storage.getBlogPostBySlug(req.params.id);
      
      if (!post) {
        return res.status(404).json({ message: "Artigo não encontrado" });
      }
      
      const canModify = await canModifyResource(userId, post.authorId);
      if (!canModify) {
        return res.status(403).json({ message: "Não autorizado. Apenas o autor ou administrador pode deletar este artigo." });
      }
      
      await storage.deleteBlogPost(post.id);
      res.json({ message: "Artigo deletado com sucesso" });
    } catch (error) {
      console.error("Error deleting blog post:", error);
      res.status(500).json({ message: "Falha ao deletar artigo" });
    }
  });

  // FAQ routes
  app.get('/api/faqs', async (req, res) => {
    try {
      const { limit, category } = req.query;
      const faqs = await storage.getFaqs(
        limit ? parseInt(limit as string) : undefined,
        category as string | undefined
      );
      res.json(faqs);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      res.status(500).json({ message: "Falha ao buscar perguntas frequentes" });
    }
  });

  app.get('/api/faqs/:id', async (req, res) => {
    try {
      const faq = await storage.getFaqById(req.params.id);
      if (!faq) {
        return res.status(404).json({ message: "Pergunta não encontrada" });
      }
      
      await storage.incrementFaqViewCount(req.params.id);
      
      const updatedFaq = await storage.getFaqById(req.params.id);
      res.json(updatedFaq);
    } catch (error) {
      console.error("Error fetching FAQ:", error);
      res.status(500).json({ message: "Falha ao buscar pergunta" });
    }
  });

  app.post('/api/faqs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const faqData = insertFaqSchema.parse({
        ...req.body,
        authorId: userId,
      });
      
      const faq = await storage.createFaq(faqData);
      res.json(faq);
    } catch (error) {
      console.error("Error creating FAQ:", error);
      res.status(500).json({ message: "Falha ao criar pergunta" });
    }
  });

  app.put('/api/faqs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const faq = await storage.getFaqById(req.params.id);
      
      if (!faq) {
        return res.status(404).json({ message: "Pergunta não encontrada" });
      }
      
      const canModify = await canModifyResource(userId, faq.authorId);
      if (!canModify) {
        return res.status(403).json({ message: "Não autorizado. Apenas o autor ou administrador pode editar esta pergunta." });
      }
      
      const faqData = insertFaqSchema.partial().parse(req.body);
      const updatedFaq = await storage.updateFaq(req.params.id, faqData);
      res.json(updatedFaq);
    } catch (error) {
      console.error("Error updating FAQ:", error);
      res.status(500).json({ message: "Falha ao atualizar pergunta" });
    }
  });

  app.delete('/api/faqs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const faq = await storage.getFaqById(req.params.id);
      
      if (!faq) {
        return res.status(404).json({ message: "Pergunta não encontrada" });
      }
      
      const canModify = await canModifyResource(userId, faq.authorId);
      if (!canModify) {
        return res.status(403).json({ message: "Não autorizado. Apenas o autor ou administrador pode deletar esta pergunta." });
      }
      
      await storage.deleteFaq(req.params.id);
      res.json({ message: "Pergunta deletada com sucesso" });
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      res.status(500).json({ message: "Falha ao deletar pergunta" });
    }
  });

  // FAQ Answer routes
  app.get('/api/faqs/:faqId/answers', async (req, res) => {
    try {
      const answers = await storage.getFaqAnswers(req.params.faqId);
      res.json(answers);
    } catch (error) {
      console.error("Error fetching FAQ answers:", error);
      res.status(500).json({ message: "Falha ao buscar respostas" });
    }
  });

  app.post('/api/faqs/:faqId/answers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const answerData = insertFaqAnswerSchema.parse({
        ...req.body,
        faqId: req.params.faqId,
        authorId: userId,
      });
      
      const answer = await storage.createFaqAnswer(answerData);
      res.json(answer);
    } catch (error) {
      console.error("Error creating FAQ answer:", error);
      res.status(500).json({ message: "Falha ao criar resposta" });
    }
  });

  app.put('/api/faqs/:faqId/answers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const answers = await storage.getFaqAnswers(req.params.faqId);
      const answer = answers.find(a => a.id === req.params.id);
      
      if (!answer) {
        return res.status(404).json({ message: "Resposta não encontrada" });
      }
      
      const canModify = await canModifyResource(userId, answer.authorId);
      if (!canModify) {
        return res.status(403).json({ message: "Não autorizado. Apenas o autor ou administrador pode editar esta resposta." });
      }
      
      const answerData = insertFaqAnswerSchema.partial().parse(req.body);
      const updatedAnswer = await storage.updateFaqAnswer(req.params.id, answerData);
      res.json(updatedAnswer);
    } catch (error) {
      console.error("Error updating FAQ answer:", error);
      res.status(500).json({ message: "Falha ao atualizar resposta" });
    }
  });

  app.delete('/api/faqs/:faqId/answers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const answers = await storage.getFaqAnswers(req.params.faqId);
      const answer = answers.find(a => a.id === req.params.id);
      
      if (!answer) {
        return res.status(404).json({ message: "Resposta não encontrada" });
      }
      
      const canModify = await canModifyResource(userId, answer.authorId);
      if (!canModify) {
        return res.status(403).json({ message: "Não autorizado. Apenas o autor ou administrador pode deletar esta resposta." });
      }
      
      await storage.deleteFaqAnswer(req.params.id);
      res.json({ message: "Resposta deletada com sucesso" });
    } catch (error) {
      console.error("Error deleting FAQ answer:", error);
      res.status(500).json({ message: "Falha ao deletar resposta" });
    }
  });

  app.post('/api/faqs/:faqId/answers/:id/accept', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const faq = await storage.getFaqById(req.params.faqId);
      
      if (!faq) {
        return res.status(404).json({ message: "Pergunta não encontrada" });
      }
      
      if (faq.authorId !== userId) {
        const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (!user[0] || !user[0].isAdmin) {
          return res.status(403).json({ message: "Apenas o autor da pergunta pode marcar uma resposta como aceita" });
        }
      }
      
      await storage.markAnswerAsAccepted(req.params.faqId, req.params.id);
      res.json({ message: "Resposta marcada como aceita" });
    } catch (error) {
      console.error("Error accepting FAQ answer:", error);
      res.status(500).json({ message: "Falha ao marcar resposta como aceita" });
    }
  });

  // User profile routes
  app.put('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { 
        bio, 
        accountType, 
        companyName, 
        jobTitle, 
        companyWebsite,
        cncMachine,
        camSoftware,
        yearsExperience,
        profileImageUrl,
        city,
        state,
        serviceArea,
        cncBrandId,
        isIndependent,
        machinesMaintenance,
        phoneNumber,
        whatsappNumber,
        specialties
      } = req.body;
      
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (bio !== undefined) updateData.bio = bio;
      if (accountType !== undefined) updateData.accountType = accountType;
      if (companyName !== undefined) updateData.companyName = companyName;
      if (jobTitle !== undefined) updateData.jobTitle = jobTitle;
      if (companyWebsite !== undefined) updateData.companyWebsite = companyWebsite;
      if (cncMachine !== undefined) updateData.cncMachine = cncMachine;
      if (camSoftware !== undefined) updateData.camSoftware = camSoftware;
      if (yearsExperience !== undefined) updateData.yearsExperience = yearsExperience;
      if (profileImageUrl !== undefined) updateData.profileImageUrl = profileImageUrl;
      if (city !== undefined) updateData.city = city;
      if (state !== undefined) updateData.state = state;
      if (serviceArea !== undefined) updateData.serviceArea = serviceArea;
      if (cncBrandId !== undefined) updateData.cncBrandId = cncBrandId;
      if (isIndependent !== undefined) updateData.isIndependent = isIndependent;
      if (machinesMaintenance !== undefined) updateData.machinesMaintenance = machinesMaintenance;
      if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
      if (whatsappNumber !== undefined) updateData.whatsappNumber = whatsappNumber;
      if (specialties !== undefined) updateData.specialties = specialties;
      
      // Use direct update instead of upsert to avoid ID conflict
      const [updatedUser] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning();
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Falha ao atualizar perfil" });
    }
  });

  // Admin creation endpoint (only works if no admin exists)
  app.post('/api/bootstrap-admin', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Check if any admin exists using SQL query
      const result = await db.select().from(users).where(eq(users.isAdmin, true)).limit(1);
      
      if (result.length > 0) {
        return res.status(403).json({ message: "Já existe um administrador no sistema" });
      }
      
      // Make current user admin using direct update
      const [updatedUser] = await db
        .update(users)
        .set({ isAdmin: true, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();
      
      res.json({ message: "Você agora é administrador!", user: updatedUser });
    } catch (error) {
      console.error("Error bootstrapping admin:", error);
      res.status(500).json({ message: "Erro ao criar administrador" });
    }
  });

  // Admin endpoint to promote users to admin (only accessible by existing admins)
  app.post('/api/admin/promote-user', isAdmin, async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "userId é obrigatório" });
      }
      
      const [updatedUser] = await db
        .update(users)
        .set({ isAdmin: true, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();
      
      res.json({ message: "Usuário promovido a administrador", user: updatedUser });
    } catch (error) {
      console.error("Error promoting user:", error);
      res.status(500).json({ message: "Erro ao promover usuário" });
    }
  });

  // Admin endpoint to list all users
  app.get('/api/admin/users', isAdmin, async (req, res) => {
    try {
      const allUsers = await db.select().from(users).orderBy(users.createdAt);
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Erro ao buscar usuários" });
    }
  });

  // Admin endpoint to reset user password
  app.post('/api/admin/reset-password', isAdmin, async (req, res) => {
    try {
      const { userId, newPassword } = req.body;
      
      if (!userId || !newPassword) {
        return res.status(400).json({ message: "userId e newPassword são obrigatórios" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "A senha deve ter pelo menos 6 caracteres" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      const [updatedUser] = await db
        .update(users)
        .set({ passwordHash: hashedPassword, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      res.json({ message: "Senha redefinida com sucesso", user: updatedUser });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Erro ao redefinir senha" });
    }
  });

  // Admin endpoint to ban user
  app.post('/api/admin/ban-user', isAdmin, async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "userId é obrigatório" });
      }
      
      const [updatedUser] = await db
        .update(users)
        .set({ isBanned: true, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      res.json({ message: "Usuário banido com sucesso", user: updatedUser });
    } catch (error) {
      console.error("Error banning user:", error);
      res.status(500).json({ message: "Erro ao banir usuário" });
    }
  });

  // Admin endpoint to unban user
  app.post('/api/admin/unban-user', isAdmin, async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "userId é obrigatório" });
      }
      
      const [updatedUser] = await db
        .update(users)
        .set({ isBanned: false, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      res.json({ message: "Usuário desbanido com sucesso", user: updatedUser });
    } catch (error) {
      console.error("Error unbanning user:", error);
      res.status(500).json({ message: "Erro ao desbanir usuário" });
    }
  });

  // Statistics routes (public - used on landing page)
  app.get('/api/statistics', async (req, res) => {
    try {
      const stats = await storage.getStatistics();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching statistics:", error);
      res.status(500).json({ message: "Falha ao buscar estatísticas" });
    }
  });

  // CNC Brands routes
  app.get('/api/cnc-brands', async (req, res) => {
    try {
      const brands = await db.select().from(cncBrands).orderBy(cncBrands.name);
      res.json(brands);
    } catch (error) {
      console.error("Error fetching CNC brands:", error);
      res.status(500).json({ message: "Falha ao buscar marcas" });
    }
  });

  app.post('/api/cnc-brands', isAdmin, async (req, res) => {
    try {
      const validatedData = insertCncBrandSchema.parse(req.body);
      const [brand] = await db.insert(cncBrands).values(validatedData).returning();
      res.json(brand);
    } catch (error) {
      console.error("Error creating CNC brand:", error);
      res.status(500).json({ message: "Falha ao criar marca" });
    }
  });

  app.put('/api/cnc-brands/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Validate update data with Zod
      const validatedData = updateCncBrandSchema.parse(req.body);
      
      const updateData: any = { ...validatedData, updatedAt: new Date() };
      
      const [brand] = await db
        .update(cncBrands)
        .set(updateData)
        .where(eq(cncBrands.id, id))
        .returning();
      
      if (!brand) {
        return res.status(404).json({ message: "Marca não encontrada" });
      }
      
      res.json(brand);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        console.error("Validation error updating CNC brand:", error);
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      console.error("Error updating CNC brand:", error);
      res.status(500).json({ message: "Falha ao atualizar marca" });
    }
  });

  // File upload endpoint (used by create project form)
app.post('/api/upload', isAuthenticated, upload.single('file'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Nenhum arquivo enviado" });
    }

    // Return the file URL
    res.json({
      url: req.file.path,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ message: "Falha ao fazer upload do arquivo" });
  }
});


  app.delete('/api/cnc-brands/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(cncBrands).where(eq(cncBrands.id, id));
      res.json({ message: "Marca deletada com sucesso" });
    } catch (error) {
      console.error("Error deleting CNC brand:", error);
      res.status(500).json({ message: "Falha ao deletar marca" });
    }
  });

  // File upload route for blog and FAQ attachments
  app.post('/api/upload-file', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Nenhum arquivo enviado" });
      }

      // Return the file URL
      res.json({
        url: req.file.path,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Falha ao fazer upload do arquivo" });
    }
  });

  // Image processing routes
 app.post('/api/images/upload', isAuthenticated, imageUpload.single('image'), async (req: any, res) => {
    const inputPath = req.file?.path;
    let outputPath: string | undefined;
    
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Nenhuma imagem foi enviada" });
      }

      // Validate file is actually an image by checking MIME type and trying to process with Sharp
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        await fs.unlink(inputPath);
        return res.status(400).json({ message: "Apenas imagens são permitidas (JPEG, PNG, GIF, WebP)" });
      }

      const { compress, maxWidth, maxHeight } = req.body;
      outputPath = `uploads/processed-${Date.now()}-${req.file.originalname}`;

      let image = sharp(inputPath);

      // Validate image can be processed (this will fail if file is not a real image)
      let metadata;
      try {
        metadata = await image.metadata();
      } catch (metadataError) {
        await fs.unlink(inputPath);
        return res.status(400).json({ message: "Arquivo não é uma imagem válida" });
      }

      // Compressão automática
      if (compress !== 'false') {
        const maxWidthNum = maxWidth ? parseInt(maxWidth) : 1920;
        const maxHeightNum = maxHeight ? parseInt(maxHeight) : 1920;
        
        image = image.resize(maxWidthNum, maxHeightNum, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      // Determinar formato de saída baseado no tipo de arquivo original
      // Preservar PNG para transparência, converter outros para JPEG otimizado
      const originalExt = path.extname(req.file.originalname).toLowerCase();
      const outputExt = originalExt === '.png' ? '.png' : '.jpg';
      const outputFilename = path.basename(req.file.originalname, originalExt) + outputExt;
      outputPath = `uploads/processed-${Date.now()}-${outputFilename}`;

      // Salvar imagem processada no formato apropriado
      if (outputExt === '.png') {
        // Preservar PNG para manter transparência
        await image
          .png({ quality: 90, compressionLevel: 9 })
          .toFile(outputPath);
      } else {
        // Converter para JPEG otimizado
        await image
          .jpeg({ quality: 85, mozjpeg: true })
          .toFile(outputPath);
      }

      // Remover arquivo original
      await fs.unlink(inputPath);

      res.json({
        url: `/${outputPath}`,
        filename: path.basename(outputPath),
      });
    } catch (error: any) {
      console.error("Erro ao processar imagem:", error);
      console.error("Detalhes do arquivo:", {
        originalname: req.file?.originalname,
        mimetype: req.file?.mimetype,
        size: req.file?.size,
        inputPath,
        outputPath
      });
      
      // Clean up uploaded file if processing failed
      if (inputPath) {
        try {
          await fs.unlink(inputPath);
          console.log("Arquivo temporário removido:", inputPath);
        } catch (unlinkError) {
          console.error("Erro ao remover arquivo temporário:", unlinkError);
        }
      }
      
      // Clean up partially processed file if it exists
      if (outputPath) {
        try {
          await fs.unlink(outputPath);
          console.log("Arquivo parcialmente processado removido:", outputPath);
        } catch (unlinkError) {
          // File might not exist, ignore error
        }
      }
      
      // Provide more specific error message based on error type
      let message = "Falha ao processar imagem";
      
      if (error.message?.includes('corrupt') || error.message?.includes('invalid')) {
        message = "Arquivo de imagem inválido ou corrompido";
      } else if (error.message?.includes('ENOENT')) {
        message = "Arquivo não encontrado. Por favor, tente novamente";
      } else if (error.message?.includes('EACCES')) {
        message = "Permissão negada para processar o arquivo";
      } else if (error.message?.includes('file size')) {
        message = "Arquivo muito grande. Tamanho máximo: 50MB";
      } else if (error.message) {
        message = `Erro ao processar imagem: ${error.message}`;
      }
      
      res.status(500).json({ message, error: error.message });
    }
  });

  app.post('/api/images/process', isAuthenticated, async (req, res) => {
    try {
      const { imageUrl, crop, rotation, watermark } = req.body;

      if (!imageUrl) {
        return res.status(400).json({ message: "URL da imagem é obrigatória" });
      }

      const imagePath = imageUrl.replace('/', '');
      const outputPath = `uploads/edited-${Date.now()}.jpg`;

      let image = sharp(imagePath);

      // Aplicar rotação
      if (rotation && rotation !== 0) {
        image = image.rotate(rotation);
      }

      // Aplicar crop
      if (crop) {
        const metadata = await sharp(imagePath).metadata();
        const scaleX = (metadata.width || 1) / 100;
        const scaleY = (metadata.height || 1) / 100;

        image = image.extract({
          left: Math.round(crop.x * scaleX),
          top: Math.round(crop.y * scaleY),
          width: Math.round(crop.width * scaleX),
          height: Math.round(crop.height * scaleY),
        });
      }

      // Aplicar marca d'água
      if (watermark && watermark.trim()) {
        const textSvg = `
          <svg width="500" height="100">
            <text x="250" y="50" text-anchor="middle" font-size="24" fill="white" fill-opacity="0.5" font-family="Arial">
              ${watermark}
            </text>
          </svg>
        `;
        
        const textBuffer = Buffer.from(textSvg);
        image = image.composite([
          {
            input: textBuffer,
            gravity: 'southeast',
          },
        ]);
      }

      // Salvar imagem processada
      await image.jpeg({ quality: 90 }).toFile(outputPath);

      res.json({
        url: `/${outputPath}`,
        filename: path.basename(outputPath),
      });
    } catch (error) {
      console.error("Error editing image:", error);
      res.status(500).json({ message: "Falha ao editar imagem" });
    }
  });

  // SPA fallback - serve index.html for all non-API routes
  // This prevents 404 errors when refreshing client-side routes
  app.get('*', (req, res, next) => {
    // Only handle non-API, non-upload routes
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    // Let Vite handle the SPA routing in development
    next();
  });

  const httpServer = createServer(app);
  return httpServer;
}
