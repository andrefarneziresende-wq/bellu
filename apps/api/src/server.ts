import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { env } from './config/env.js';
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

  // Health check
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // Start
  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    console.log(`🚀 Server running on http://${env.HOST}:${env.PORT}`);
    console.log(`📚 Docs available at http://${env.HOST}:${env.PORT}/docs`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

bootstrap();
