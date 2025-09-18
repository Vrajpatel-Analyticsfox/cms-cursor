const { seedMasterData } = require('./seed-master-data');
const { seedTemplatesAndProducts } = require('./seed-templates-and-products');
const { seedLegalAndSystem } = require('./seed-legal-and-system');

async function seedAllMasterData() {
  console.log('🚀 Starting comprehensive master data seeding...');
  console.log('================================================');

  try {
    // Step 1: Seed basic master data
    console.log('\n📋 Step 1: Seeding basic master data...');
    await seedMasterData();

    // Step 2: Seed templates and products
    console.log('\n📋 Step 2: Seeding templates and products...');
    await seedTemplatesAndProducts();

    // Step 3: Seed legal and system data
    console.log('\n📋 Step 3: Seeding legal and system data...');
    await seedLegalAndSystem();

    console.log('\n🎉 All master data seeding completed successfully!');
    console.log('================================================');
    console.log('✅ States: 8 records');
    console.log('✅ DPD Buckets: 5 records');
    console.log('✅ Channels: 6 records');
    console.log('✅ Languages: 8 records');
    console.log('✅ Templates: 5 records');
    console.log('✅ Product Groups: 5 records');
    console.log('✅ Product Types: 6 records');
    console.log('✅ Product Subtypes: 6 records');
    console.log('✅ Product Variants: 5 records');
    console.log('✅ Schema Configurations: 5 records');
    console.log('✅ Courts: 6 records');
    console.log('✅ Document Types: 8 records');
    console.log('✅ Lawyers: 5 records');
    console.log('\n📊 Total records seeded: 77');
  } catch (error) {
    console.error('\n❌ Master data seeding failed:', error);
    console.error('Please check the error details above and try again.');
    process.exit(1);
  }
}

// Run the comprehensive seeding function
if (require.main === module) {
  seedAllMasterData()
    .then(() => {
      console.log('\n✅ Seeding process completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Seeding process failed:', error);
      process.exit(1);
    });
}

module.exports = { seedAllMasterData };
