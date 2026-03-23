import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../shared/auth-middleware.js';
import {
  loginHandler,
  meHandler,
  dashboardHandler,
  listUsersHandler,
  listProfessionalsHandler,
  listBookingsHandler,
  listReviewsHandler,
  listPaymentsHandler,
  listBannersHandler,
  toggleUserActiveHandler,
  toggleProfessionalStatusHandler,
  deleteReviewHandler,
  getProfessionalDetailHandler,
  listPlatformConfigHandler,
  upsertPlatformConfigHandler,
  createBannerHandler,
  updateBannerHandler,
  deleteBannerHandler,
  createCategoryHandler,
  updateCategoryHandler,
  deleteCategoryHandler,
  reorderCategoryHandler,
  listServicesHandler,
  listServiceTemplatesHandler,
  createServiceTemplateHandler,
  updateServiceTemplateHandler,
  deleteServiceTemplateHandler,
  createAdminUserHandler,
  updateAdminUserHandler,
  deleteAdminUserHandler,
} from './admin-auth.controller.js';

export async function adminAuthRoutes(app: FastifyInstance) {
  // Public
  app.post('/login', loginHandler);

  // Protected
  app.get('/me', { preHandler: [authenticate] }, meHandler);
  app.get('/dashboard', { preHandler: [authenticate] }, dashboardHandler);
  app.get('/users', { preHandler: [authenticate] }, listUsersHandler);
  app.get('/professionals', { preHandler: [authenticate] }, listProfessionalsHandler);
  app.get<{ Params: { id: string } }>('/professionals/:id', { preHandler: [authenticate] }, getProfessionalDetailHandler);
  app.get('/bookings', { preHandler: [authenticate] }, listBookingsHandler);
  app.get('/reviews', { preHandler: [authenticate] }, listReviewsHandler);
  app.get('/payments', { preHandler: [authenticate] }, listPaymentsHandler);
  app.get('/banners', { preHandler: [authenticate] }, listBannersHandler);

  // Platform config
  app.get('/config', { preHandler: [authenticate] }, listPlatformConfigHandler);
  app.put('/config', { preHandler: [authenticate] }, upsertPlatformConfigHandler);

  // Actions
  app.patch<{ Params: { id: string } }>('/users/:id/toggle-active', { preHandler: [authenticate] }, toggleUserActiveHandler);
  app.patch<{ Params: { id: string }; Body: { status: string } }>('/professionals/:id/status', { preHandler: [authenticate] }, toggleProfessionalStatusHandler);
  app.delete<{ Params: { id: string } }>('/reviews/:id', { preHandler: [authenticate] }, deleteReviewHandler);

  // Banner CRUD
  app.post('/banners', { preHandler: [authenticate] }, createBannerHandler);
  app.patch<{ Params: { id: string } }>('/banners/:id', { preHandler: [authenticate] }, updateBannerHandler);
  app.delete<{ Params: { id: string } }>('/banners/:id', { preHandler: [authenticate] }, deleteBannerHandler);

  // Category CRUD
  app.post('/categories', { preHandler: [authenticate] }, createCategoryHandler);
  app.patch<{ Params: { id: string } }>('/categories/:id', { preHandler: [authenticate] }, updateCategoryHandler);
  app.delete<{ Params: { id: string } }>('/categories/:id', { preHandler: [authenticate] }, deleteCategoryHandler);
  app.patch<{ Params: { id: string } }>('/categories/:id/reorder', { preHandler: [authenticate] }, reorderCategoryHandler);

  // Services
  app.get('/services', { preHandler: [authenticate] }, listServicesHandler);

  // Service Templates (catalog)
  app.get('/service-templates', { preHandler: [authenticate] }, listServiceTemplatesHandler);
  app.post('/service-templates', { preHandler: [authenticate] }, createServiceTemplateHandler);
  app.patch<{ Params: { id: string } }>('/service-templates/:id', { preHandler: [authenticate] }, updateServiceTemplateHandler);
  app.delete<{ Params: { id: string } }>('/service-templates/:id', { preHandler: [authenticate] }, deleteServiceTemplateHandler);

  // Admin Users CRUD
  app.post('/admin-users', { preHandler: [authenticate] }, createAdminUserHandler);
  app.patch<{ Params: { id: string } }>('/admin-users/:id', { preHandler: [authenticate] }, updateAdminUserHandler);
  app.delete<{ Params: { id: string } }>('/admin-users/:id', { preHandler: [authenticate] }, deleteAdminUserHandler);
}
