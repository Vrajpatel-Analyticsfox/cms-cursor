const { db } = require('../drizzle.config');
const {
  stateMaster,
  dpdBucketMaster,
  channelMaster,
  languageMaster,
  templateMaster,
  productGroupMaster,
  productTypeMaster,
  productSubtypeMaster,
  productVariantMaster,
  schemaConfiguration,
  courts,
  documentTypes,
  lawyers,
} = require('../schema');

async function seedMasterData() {
  console.log('🌱 Starting master data seeding...');

  try {
    // 1. Seed States
    console.log('📍 Seeding states...');
    const states = await db
      .insert(stateMaster)
      .values([
        {
          stateCode: 'MH',
          stateName: 'Maharashtra',
          stateId: 'STATE_MH_001',
          status: 'Active',
          createdBy: 'system',
        },
        {
          stateCode: 'DL',
          stateName: 'Delhi',
          stateId: 'STATE_DL_001',
          status: 'Active',
          createdBy: 'system',
        },
        {
          stateCode: 'KA',
          stateName: 'Karnataka',
          stateId: 'STATE_KA_001',
          status: 'Active',
          createdBy: 'system',
        },
        {
          stateCode: 'TN',
          stateName: 'Tamil Nadu',
          stateId: 'STATE_TN_001',
          status: 'Active',
          createdBy: 'system',
        },
        {
          stateCode: 'GJ',
          stateName: 'Gujarat',
          stateId: 'STATE_GJ_001',
          status: 'Active',
          createdBy: 'system',
        },
        {
          stateCode: 'UP',
          stateName: 'Uttar Pradesh',
          stateId: 'STATE_UP_001',
          status: 'Active',
          createdBy: 'system',
        },
        {
          stateCode: 'WB',
          stateName: 'West Bengal',
          stateId: 'STATE_WB_001',
          status: 'Active',
          createdBy: 'system',
        },
        {
          stateCode: 'RJ',
          stateName: 'Rajasthan',
          stateId: 'STATE_RJ_001',
          status: 'Active',
          createdBy: 'system',
        },
      ])
      .returning();

    console.log(`✅ Seeded ${states.length} states`);

    // 2. Seed DPD Buckets
    console.log('📊 Seeding DPD buckets...');
    const dpdBuckets = await db
      .insert(dpdBucketMaster)
      .values([
        {
          bucketId: 'BUCKET_001',
          bucketName: 'Early Delinquency',
          rangeStart: -3,
          rangeEnd: 0,
          minDays: 0,
          maxDays: 30,
          module: 'Digital',
          status: 'Active',
          description: 'Early stage delinquency for digital collections',
          createdBy: 'system',
        },
        {
          bucketId: 'BUCKET_002',
          bucketName: 'Mild Delinquency',
          rangeStart: 1,
          rangeEnd: 30,
          minDays: 31,
          maxDays: 60,
          module: 'Call Centre',
          status: 'Active',
          description: 'Mild delinquency for call centre collections',
          createdBy: 'system',
        },
        {
          bucketId: 'BUCKET_003',
          bucketName: 'Moderate Delinquency',
          rangeStart: 31,
          rangeEnd: 60,
          minDays: 61,
          maxDays: 90,
          module: 'Call Centre',
          status: 'Active',
          description: 'Moderate delinquency for intensive collections',
          createdBy: 'system',
        },
        {
          bucketId: 'BUCKET_004',
          bucketName: 'Severe Delinquency',
          rangeStart: 61,
          rangeEnd: 90,
          minDays: 91,
          maxDays: 120,
          module: 'Field Recovery',
          status: 'Active',
          description: 'Severe delinquency for field recovery',
          createdBy: 'system',
        },
        {
          bucketId: 'BUCKET_005',
          bucketName: 'Critical Delinquency',
          rangeStart: 91,
          rangeEnd: 120,
          minDays: 121,
          maxDays: 180,
          module: 'Legal',
          status: 'Active',
          description: 'Critical delinquency for legal action',
          createdBy: 'system',
        },
      ])
      .returning();

    console.log(`✅ Seeded ${dpdBuckets.length} DPD buckets`);

    // 3. Seed Channels
    console.log('📱 Seeding channels...');
    const channels = await db
      .insert(channelMaster)
      .values([
        {
          channelId: 'CHANNEL_001',
          channelName: 'SMS',
          channelType: 'Text',
          status: 'Active',
          description: 'Short Message Service for notifications',
          createdBy: 'system',
        },
        {
          channelId: 'CHANNEL_002',
          channelName: 'WhatsApp',
          channelType: 'Messaging',
          status: 'Active',
          description: 'WhatsApp Business API for customer communication',
          createdBy: 'system',
        },
        {
          channelId: 'CHANNEL_003',
          channelName: 'Email',
          channelType: 'Email',
          status: 'Active',
          description: 'Email notifications and documents',
          createdBy: 'system',
        },
        {
          channelId: 'CHANNEL_004',
          channelName: 'IVR',
          channelType: 'Voice',
          status: 'Active',
          description: 'Interactive Voice Response system',
          createdBy: 'system',
        },
        {
          channelId: 'CHANNEL_005',
          channelName: 'Courier',
          channelType: 'Physical',
          status: 'Active',
          description: 'Physical document delivery via courier',
          createdBy: 'system',
        },
        {
          channelId: 'CHANNEL_006',
          channelName: 'Post',
          channelType: 'Physical',
          status: 'Active',
          description: 'Physical document delivery via postal service',
          createdBy: 'system',
        },
      ])
      .returning();

    console.log(`✅ Seeded ${channels.length} channels`);

    // 4. Seed Languages
    console.log('🌐 Seeding languages...');
    const languages = await db
      .insert(languageMaster)
      .values([
        {
          languageCode: 'EN',
          languageName: 'English',
          scriptSupport: 'Latin',
          status: 'Active',
          description: 'English language support',
          createdBy: 'system',
        },
        {
          languageCode: 'HI',
          languageName: 'Hindi',
          scriptSupport: 'Devanagari',
          status: 'Active',
          description: 'Hindi language support',
          createdBy: 'system',
        },
        {
          languageCode: 'MR',
          languageName: 'Marathi',
          scriptSupport: 'Devanagari',
          status: 'Active',
          description: 'Marathi language support',
          createdBy: 'system',
        },
        {
          languageCode: 'GU',
          languageName: 'Gujarati',
          scriptSupport: 'Gujarati',
          status: 'Active',
          description: 'Gujarati language support',
          createdBy: 'system',
        },
        {
          languageCode: 'KN',
          languageName: 'Kannada',
          scriptSupport: 'Kannada',
          status: 'Active',
          description: 'Kannada language support',
          createdBy: 'system',
        },
        {
          languageCode: 'TA',
          languageName: 'Tamil',
          scriptSupport: 'Tamil',
          status: 'Active',
          description: 'Tamil language support',
          createdBy: 'system',
        },
        {
          languageCode: 'TE',
          languageName: 'Telugu',
          scriptSupport: 'Telugu',
          status: 'Active',
          description: 'Telugu language support',
          createdBy: 'system',
        },
        {
          languageCode: 'BN',
          languageName: 'Bengali',
          scriptSupport: 'Bengali',
          status: 'Active',
          description: 'Bengali language support',
          createdBy: 'system',
        },
      ])
      .returning();

    console.log(`✅ Seeded ${languages.length} languages`);

    console.log('🎉 Master data seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding master data:', error);
    throw error;
  }
}

// Run the seeding function
if (require.main === module) {
  seedMasterData()
    .then(() => {
      console.log('✅ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedMasterData };
