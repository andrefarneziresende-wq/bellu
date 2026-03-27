import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../shared/auth-middleware.js';
import { requireAdmin } from '../../shared/admin-middleware.js';
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
  listAdminUsersHandler,
  createAdminUserHandler,
  updateAdminUserHandler,
  deleteAdminUserHandler,
} from './admin-auth.controller.js';
import * as adminRoleCtrl from '../admin-role/admin-role.controller.js';

export async function adminAuthRoutes(app: FastifyInstance) {
  // Public
  app.post('/login', loginHandler);

  // Protected
  app.get('/me', { preHandler: [authenticate, requireAdmin] }, meHandler);
  app.get('/dashboard', { preHandler: [authenticate, requireAdmin] }, dashboardHandler);
  app.get('/users', { preHandler: [authenticate, requireAdmin] }, listUsersHandler);
  app.get('/professionals', { preHandler: [authenticate, requireAdmin] }, listProfessionalsHandler);
  app.get<{ Params: { id: string } }>('/professionals/:id', { preHandler: [authenticate, requireAdmin] }, getProfessionalDetailHandler);
  app.get('/bookings', { preHandler: [authenticate, requireAdmin] }, listBookingsHandler);
  app.get('/reviews', { preHandler: [authenticate, requireAdmin] }, listReviewsHandler);
  app.get('/payments', { preHandler: [authenticate, requireAdmin] }, listPaymentsHandler);
  app.get('/banners', { preHandler: [authenticate, requireAdmin] }, listBannersHandler);

  // Platform config
  app.get('/config', { preHandler: [authenticate, requireAdmin] }, listPlatformConfigHandler);
  app.put('/config', { preHandler: [authenticate, requireAdmin] }, upsertPlatformConfigHandler);

  // Actions
  app.patch<{ Params: { id: string } }>('/users/:id/toggle-active', { preHandler: [authenticate, requireAdmin] }, toggleUserActiveHandler);
  app.patch<{ Params: { id: string }; Body: { status: string } }>('/professionals/:id/status', { preHandler: [authenticate, requireAdmin] }, toggleProfessionalStatusHandler);
  app.delete<{ Params: { id: string } }>('/reviews/:id', { preHandler: [authenticate, requireAdmin] }, deleteReviewHandler);

  // Banner CRUD
  app.post('/banners', { preHandler: [authenticate, requireAdmin] }, createBannerHandler);
  app.patch<{ Params: { id: string } }>('/banners/:id', { preHandler: [authenticate, requireAdmin] }, updateBannerHandler);
  app.delete<{ Params: { id: string } }>('/banners/:id', { preHandler: [authenticate, requireAdmin] }, deleteBannerHandler);

  // Category CRUD
  app.post('/categories', { preHandler: [authenticate, requireAdmin] }, createCategoryHandler);
  app.patch<{ Params: { id: string } }>('/categories/:id', { preHandler: [authenticate, requireAdmin] }, updateCategoryHandler);
  app.delete<{ Params: { id: string } }>('/categories/:id', { preHandler: [authenticate, requireAdmin] }, deleteCategoryHandler);
  app.patch<{ Params: { id: string } }>('/categories/:id/reorder', { preHandler: [authenticate, requireAdmin] }, reorderCategoryHandler);

  // Services
  app.get('/services', { preHandler: [authenticate, requireAdmin] }, listServicesHandler);

  // Service Templates (catalog)
  app.get('/service-templates', { preHandler: [authenticate, requireAdmin] }, listServiceTemplatesHandler);
  app.post('/service-templates', { preHandler: [authenticate, requireAdmin] }, createServiceTemplateHandler);
  app.patch<{ Params: { id: string } }>('/service-templates/:id', { preHandler: [authenticate, requireAdmin] }, updateServiceTemplateHandler);
  app.delete<{ Params: { id: string } }>('/service-templates/:id', { preHandler: [authenticate, requireAdmin] }, deleteServiceTemplateHandler);

  // Admin Users CRUD
  app.get('/admin-users', { preHandler: [authenticate, requireAdmin] }, listAdminUsersHandler);
  app.post('/admin-users', { preHandler: [authenticate, requireAdmin] }, createAdminUserHandler);
  app.patch<{ Params: { id: string } }>('/admin-users/:id', { preHandler: [authenticate, requireAdmin] }, updateAdminUserHandler);
  app.delete<{ Params: { id: string } }>('/admin-users/:id', { preHandler: [authenticate, requireAdmin] }, deleteAdminUserHandler);

  // Admin Roles CRUD
  app.get('/admin-roles', { preHandler: [authenticate, requireAdmin] }, adminRoleCtrl.listHandler);
  app.get<{ Params: { id: string } }>('/admin-roles/:id', { preHandler: [authenticate, requireAdmin] }, adminRoleCtrl.getByIdHandler);
  app.get('/admin-roles-permissions', { preHandler: [authenticate, requireAdmin] }, adminRoleCtrl.permissionsHandler);
  app.post('/admin-roles', { preHandler: [authenticate, requireAdmin] }, adminRoleCtrl.createHandler);
  app.put<{ Params: { id: string } }>('/admin-roles/:id', { preHandler: [authenticate, requireAdmin] }, adminRoleCtrl.updateHandler);
  app.delete<{ Params: { id: string } }>('/admin-roles/:id', { preHandler: [authenticate, requireAdmin] }, adminRoleCtrl.deleteHandler);
}
