import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('CMS Data Ingestion Module API')
  .setDescription(
    `
    Comprehensive API for CMS Data Ingestion Module with Master Data Management.
    
    ## 🏗️ **Core Modules**
    - **Core**: Application health, info, and system endpoints
    - **Tenant Management**: Multi-tenant organization setup
    - **User Management**: User authentication and administration
    - **Master Data**: Reference data configuration for 10 entities
    
    ## 📊 **Master Data Entities**
    - **State Management**: Geographic state configurations
    - **DPD Buckets**: Days Past Due bucket management
    - **Communication Channels**: SMS, WhatsApp, IVR channels
    - **Language Support**: Multi-language configurations
    - **Message Templates**: Channel and language-specific templates
    - **Product Hierarchy**: 4-level product categorization
    - **Schema Configuration**: Data ingestion schema management
    
    ## 🔐 **Authentication**
    - JWT Bearer token authentication
    - Role-based access control (Admin/Supervisor)
    
    ## 📚 **API Features**
    - RESTful endpoints with proper HTTP methods
    - Comprehensive validation and error handling
    - Event-driven architecture for real-time updates
    - UUID-based primary keys for scalability
  `,
  )
  .setVersion('1.0.0')
  //.setContact('CMS Development Team', 'https://cms-company.com', 'dev@cms-company.com')
  //.setLicense('MIT', 'https://opensource.org/licenses/MIT')
  .addServer('http://localhost:3001', 'Local Development')
  //.addServer('https://dev-api.cms-company.com', 'Development Environment')
  //.addServer('https://staging-api.cms-company.com', 'Staging Environment')
  //.addServer('https://api.cms-company.com', 'Production Environment')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT',
      description: 'Enter JWT token',
      in: 'header',
    },
    'JWT-auth',
  )
  .addTag('Core', 'Application core endpoints and system information')
  .addTag('Tenant Management', 'Multi-tenant organization management')
  .addTag('User Management', 'User authentication and administration')
  .addTag('Master Data - State', 'Geographic state and location management')
  .addTag('Master Data - DPD Bucket', 'Days Past Due bucket configuration')
  .addTag('Master Data - Channel', 'Communication channel management')
  .addTag('Master Data - Language', 'Multi-language support configuration')
  .addTag('Master Data - Template', 'Message template management')
  .addTag('Master Data - Product Group', 'Product group categorization')
  .addTag('Master Data - Product Type', 'Product type management')
  .addTag('Master Data - Product Subtype', 'Product subtype management')
  .addTag('Master Data - Product Variant', 'Product variant management')
  .addTag('Master Data - Schema Configuration', 'Data ingestion schema management')
  .build();

export const swaggerCustomOptions = {
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: 'list',
    filter: true,
    showRequestDuration: true,
    tryItOutEnabled: true,
    requestInterceptor: (req: any) => {
      req.headers['Accept'] = 'application/json';
      return req;
    },
  },
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #2c3e50; font-size: 36px; font-weight: 600; }
    .swagger-ui .info .description { font-size: 14px; line-height: 1.6; }
    .swagger-ui .info .description h2 { color: #34495e; margin-top: 20px; }
    .swagger-ui .info .description h3 { color: #7f8c8d; margin-top: 15px; }
    .swagger-ui .info .description ul { margin-left: 20px; }
    .swagger-ui .info .description li { margin-bottom: 5px; }
    .swagger-ui .scheme-container { background: #f8f9fa; padding: 20px; border-radius: 8px; }
    .swagger-ui .opblock-tag { font-weight: 600; color: #2c3e50; }
    .swagger-ui .opblock.opblock-get { border-color: #61affe; background: rgba(97, 175, 254, 0.1); }
    .swagger-ui .opblock.opblock-post { border-color: #49cc90; background: rgba(73, 204, 144, 0.1); }
    .swagger-ui .opblock.opblock-put { border-color: #fca130; background: rgba(252, 161, 48, 0.1); }
    .swagger-ui .opblock.opblock-delete { border-color: #f93e3e; background: rgba(249, 62, 62, 0.1); }
    .swagger-ui .btn.execute { background-color: #4990e2; }
    .swagger-ui .btn.execute:hover { background-color: #357abd; }
  `,
  customSiteTitle: 'CMS Data Ingestion Module API',
  customfavIcon: '/favicon.ico',
};

export function setupSwagger(app: INestApplication) {
  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api-docs', app, document, swaggerCustomOptions);

  console.log('🚀 Swagger documentation available at: http://localhost:3000/api');
  console.log('📚 API specification available at: http://localhost:3000/api-json');
}
