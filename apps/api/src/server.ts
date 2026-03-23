import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { env } from './config/env.js';
import { patchDecimalSerialization } from './config/prisma.js';
import { errorHandler } from './shared/error-handler.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { countryRoutes } from './modules/country/country.routes.js';
import { userRoutes } from './modules/user/user.routes.js';
import { professionalRoutes } from './modules/professional/professional.routes.js';
import { serviceRoutes } from './modules/service/service.routes.js';
import { bookingRoutes } from './modules/booking/booking.routes.js';
import { reviewRoutes } from './modules/review/review.routes.js';
import { categoryRoutes } from './modules/category/category.routes.js';
import { paymentRoutes } from './modules/payment/payment.routes.js';
import { portfolioRoutes } from './modules/portfolio/portfolio.routes.js';
import { favoriteRoutes } from './modules/favorite/favorite.routes.js';
import { workingHoursRoutes } from './modules/working-hours/working-hours.routes.js';
import { bannerRoutes } from './modules/banner/banner.routes.js';
import { chatRoutes } from './modules/chat/chat.routes.js';
import { adminAuthRoutes } from './modules/admin-auth/admin-auth.routes.js';
import { uploadRoutes } from './modules/upload/upload.routes.js';
import { memberRoutes } from './modules/member/member.routes.js';
import { expenseRoutes } from './modules/expense/expense.routes.js';
import { promotionRoutes } from './modules/promotion/promotion.routes.js';
import { servicePackageRoutes } from './modules/service-package/service-package.routes.js';
import { contactRoutes } from './modules/contact/contact.routes.js';
import { platformConfigRoutes } from './modules/platform-config/platform-config.routes.js';
import { roleRoutes } from './modules/role/role.routes.js';
import { notificationRoutes } from './modules/notification/notification.routes.js';
import { startReminderScheduler } from './modules/notification/scheduler.js';
import { geocodingRoutes } from './modules/geocoding/geocoding.routes.js';
import { proAuthRoutes } from './modules/pro-auth/pro-auth.routes.js';
import { clientPackageRoutes } from './modules/client-package/client-package.routes.js';
import { bookingPhotoRoutes } from './modules/booking-photo/booking-photo.routes.js';
import { legalRoutes } from './modules/legal/legal.routes.js';
import multipart from '@fastify/multipart';

async function bootstrap() {
  const app = Fastify({
    logger: env.NODE_ENV !== 'test',
  });

  // Plugins
  await app.register(cors, {
    origin: true,
    credentials: true,
  });
  await app.register(helmet, {
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });
  await app.register(jwt, { secret: env.JWT_SECRET });
  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });
  await app.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } });

  // Swagger
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Beauty Marketplace API',
        description: 'API for the Beauty & Aesthetics Marketplace platform',
        version: '0.1.0',
      },
      servers: [{ url: env.API_PUBLIC_URL ?? `http://localhost:${env.PORT}` }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list', deepLinking: false },
  });

  // Patch Prisma Decimal to serialize as number in JSON
  await patchDecimalSerialization();

  // Error handler
  app.setErrorHandler(errorHandler);

  // Routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(countryRoutes, { prefix: '/api/countries' });
  await app.register(userRoutes, { prefix: '/api/users' });
  await app.register(professionalRoutes, { prefix: '/api/professionals' });
  await app.register(serviceRoutes, { prefix: '/api/services' });
  await app.register(bookingRoutes, { prefix: '/api/bookings' });
  await app.register(reviewRoutes, { prefix: '/api/reviews' });
  await app.register(categoryRoutes, { prefix: '/api/categories' });
  await app.register(paymentRoutes, { prefix: '/api/payments' });
  await app.register(portfolioRoutes, { prefix: '/api/portfolio' });
  await app.register(favoriteRoutes, { prefix: '/api/favorites' });
  await app.register(workingHoursRoutes, { prefix: '/api/working-hours' });
  await app.register(bannerRoutes, { prefix: '/api/banners' });
  await app.register(chatRoutes, { prefix: '/api/chat' });
  await app.register(adminAuthRoutes, { prefix: '/api/admin' });
  await app.register(uploadRoutes, { prefix: '/api/upload' });
  await app.register(memberRoutes, { prefix: '/api/members' });
  await app.register(expenseRoutes, { prefix: '/api/expenses' });
  await app.register(promotionRoutes, { prefix: '/api/promotions' });
  await app.register(servicePackageRoutes, { prefix: '/api/service-packages' });
  await app.register(contactRoutes, { prefix: '/api/contact' });
  await app.register(platformConfigRoutes, { prefix: '/api/platform-config' });
  await app.register(roleRoutes, { prefix: '/api/roles' });
  await app.register(notificationRoutes, { prefix: '/api/notifications' });
  await app.register(geocodingRoutes, { prefix: '/api/geocoding' });
  await app.register(proAuthRoutes, { prefix: '/api/pro' });
  await app.register(clientPackageRoutes, { prefix: '/api/client-packages' });
  await app.register(bookingPhotoRoutes, { prefix: '/api/booking-photos' });
  await app.register(legalRoutes, { prefix: '/api/legal' });

  // Health check
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // Start
  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    console.log(`🚀 Server running on http://${env.HOST}:${env.PORT}`);
    console.log(`📚 Docs available at http://${env.HOST}:${env.PORT}/docs`);

    // Start reminder scheduler in production
    if (env.NODE_ENV === 'production') {
      startReminderScheduler();
    }
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

bootstrap();
