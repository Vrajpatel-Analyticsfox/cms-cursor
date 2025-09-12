const { Client } = require('pg');
require('dotenv').config();

async function setupDatabase() {
  // Connect to default postgres database first
  const defaultClient = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: 'postgres',
  });

  try {
    console.log('🔌 Connecting to PostgreSQL...');
    await defaultClient.connect();
    console.log('✅ Connected to PostgreSQL');

    // Check if CMS database exists
    const dbExistsQuery = `
      SELECT 1 FROM pg_database WHERE datname = 'cms_frontend_development'
    `;
    const dbExists = await defaultClient.query(dbExistsQuery);

    if (dbExists.rows.length === 0) {
      console.log('📊 Creating cms_frontend_development database...');

      // Create CMS database
      await defaultClient.query('CREATE DATABASE "cms_frontend_development"');
      console.log('✅ cms_frontend_development database created successfully');

      // Create root user if it doesn't exist
      const userExistsQuery = `
        SELECT 1 FROM pg_roles WHERE rolname = 'frontend_root'
      `;
      const userExists = await defaultClient.query(userExistsQuery);

      if (userExists.rows.length === 0) {
        console.log('👤 Creating frontend_root user...');
        await defaultClient.query(`
          CREATE ROLE frontend_root WITH LOGIN PASSWORD '123456'
        `);
        console.log('✅ Frontend_root user created successfully');
      } else {
        console.log('👤 Frontend_root user already exists');
      }

      // Grant privileges to root user
      await defaultClient.query(`
        GRANT ALL PRIVILEGES ON DATABASE "cms_frontend_development" TO frontend_root
      `);
      console.log('✅ Privileges granted to frontend_root user');
    } else {
      console.log('📊 cms_frontend_development database already exists');
    }
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    process.exit(1);
  } finally {
    await defaultClient.end();
  }
}

// Run the setup
setupDatabase()
  .then(() => {
    console.log('🎉 Database setup completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  });
