import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): object {
    return {
      message: 'CMS Data Ingestion Module',
      version: '1.0.0',
      status: 'running',
      timestamp: new Date().toISOString(),
    };
  }

  getHealth(): object {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    };
  }

  getInfo(): object {
    return {
      name: 'CMS Data Ingestion Module',
      version: '1.0.0',
      description: 'Complete CMS data ingestion and master data management system',
      modules: ['UsersModule', 'TenantModule', 'MasterDataModule'],
      features: [
        'Multi-tenancy',
        'Master Data Management',
        'Event-driven Architecture',
        'Role-based Access Control',
        'Business Rule Validation',
        'Real-time Data Synchronization',
      ],
      timestamp: new Date().toISOString(),
    };
  }
}
