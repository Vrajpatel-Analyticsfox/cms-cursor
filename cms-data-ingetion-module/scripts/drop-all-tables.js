const { Client } = require('pg');

// Database connection configuration
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'cms_core_dev',
  user: process.env.DB_USER || 'root',
  password: process.env.POSTGRES_PASSWORD || '123456',
};

async function dropAllTables() {
  const client = new Client(config);

  try {
    console.log('🔌 Connecting to PostgreSQL database...');
    await client.connect();
    console.log('✅ Connected to database successfully');

    console.log('\n🗑️  Dropping all database objects...');

    // Get all table names
    const tablesResult = await client.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename NOT LIKE 'pg_%'
      AND tablename NOT LIKE 'sql_%'
    `);

    const tableNames = tablesResult.rows.map((row) => row.tablename);
    console.log(`📋 Found ${tableNames.length} tables to drop:`, tableNames);

    // Drop all tables with CASCADE
    if (tableNames.length > 0) {
      const dropTablesSQL = `DROP TABLE IF EXISTS ${tableNames.map((name) => `"${name}"`).join(', ')} CASCADE;`;
      await client.query(dropTablesSQL);
      console.log('✅ Dropped all tables');
    }

    // Get all enum names
    const enumsResult = await client.query(`
      SELECT typname FROM pg_type 
      WHERE typtype = 'e' 
      AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    `);

    const enumNames = enumsResult.rows.map((row) => row.typname);
    console.log(`📋 Found ${enumNames.length} enums to drop:`, enumNames);

    // Drop all enums
    for (const enumName of enumNames) {
      try {
        await client.query(`DROP TYPE IF EXISTS "${enumName}" CASCADE;`);
        console.log(`✅ Dropped enum: ${enumName}`);
      } catch (error) {
        console.log(`⚠️  Could not drop enum ${enumName}:`, error.message);
      }
    }

    // Get all sequence names
    const sequencesResult = await client.query(`
      SELECT sequencename FROM pg_sequences 
      WHERE schemaname = 'public'
    `);

    const sequenceNames = sequencesResult.rows.map((row) => row.sequencename);
    console.log(`📋 Found ${sequenceNames.length} sequences to drop:`, sequenceNames);

    // Drop all sequences
    for (const sequenceName of sequenceNames) {
      try {
        await client.query(`DROP SEQUENCE IF EXISTS "${sequenceName}" CASCADE;`);
        console.log(`✅ Dropped sequence: ${sequenceName}`);
      } catch (error) {
        console.log(`⚠️  Could not drop sequence ${sequenceName}:`, error.message);
      }
    }

    // Get all view names
    const viewsResult = await client.query(`
      SELECT viewname FROM pg_views 
      WHERE schemaname = 'public'
    `);

    const viewNames = viewsResult.rows.map((row) => row.viewname);
    console.log(`📋 Found ${viewNames.length} views to drop:`, viewNames);

    // Drop all views
    for (const viewName of viewNames) {
      try {
        await client.query(`DROP VIEW IF EXISTS "${viewName}" CASCADE;`);
        console.log(`✅ Dropped view: ${viewName}`);
      } catch (error) {
        console.log(`⚠️  Could not drop view ${viewName}:`, error.message);
      }
    }

    // Get all function names
    const functionsResult = await client.query(`
      SELECT proname FROM pg_proc 
      WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    `);

    const functionNames = functionsResult.rows.map((row) => row.proname);
    console.log(`📋 Found ${functionNames.length} functions to drop:`, functionNames);

    // Drop all functions
    for (const functionName of functionNames) {
      try {
        await client.query(`DROP FUNCTION IF EXISTS "${functionName}" CASCADE;`);
        console.log(`✅ Dropped function: ${functionName}`);
      } catch (error) {
        console.log(`⚠️  Could not drop function ${functionName}:`, error.message);
      }
    }

    // Verify what's left
    const remainingTables = await client.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename NOT LIKE 'pg_%'
      AND tablename NOT LIKE 'sql_%'
    `);

    const remainingEnums = await client.query(`
      SELECT typname FROM pg_type 
      WHERE typtype = 'e' 
      AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    `);

    console.log('\n📊 Summary:');
    console.log(`   • Tables dropped: ${tableNames.length}`);
    console.log(`   • Enums dropped: ${enumNames.length}`);
    console.log(`   • Sequences dropped: ${sequenceNames.length}`);
    console.log(`   • Views dropped: ${viewNames.length}`);
    console.log(`   • Functions dropped: ${functionNames.length}`);
    console.log(`   • Remaining tables: ${remainingTables.rows.length}`);
    console.log(`   • Remaining enums: ${remainingEnums.rows.length}`);

    if (remainingTables.rows.length === 0 && remainingEnums.rows.length === 0) {
      console.log('\n🎉 Database cms_core_dev is now completely empty!');
    } else {
      console.log('\n⚠️  Some objects could not be dropped. Check the logs above.');
    }
  } catch (error) {
    console.error('❌ Error dropping database objects:', error);
    throw error;
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the cleanup
if (require.main === module) {
  dropAllTables()
    .then(() => {
      console.log('\n✅ Database cleanup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Database cleanup failed:', error);
      process.exit(1);
    });
}

module.exports = { dropAllTables };









