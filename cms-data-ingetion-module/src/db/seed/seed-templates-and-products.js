const { db } = require('../drizzle.config');
const {
  templateMaster,
  productGroupMaster,
  productTypeMaster,
  productSubtypeMaster,
  productVariantMaster,
  channelMaster,
  languageMaster,
} = require('../schema');

async function seedTemplatesAndProducts() {
  console.log('🌱 Starting templates and products seeding...');

  try {
    // Get channel and language IDs (assuming they exist from previous seeding)
    const channels = await db.select().from(channelMaster);
    const languages = await db.select().from(languageMaster);

    if (channels.length === 0 || languages.length === 0) {
      throw new Error('Channels and languages must be seeded first');
    }

    const smsChannel = channels.find((c) => c.channelName === 'SMS');
    const emailChannel = channels.find((c) => c.channelName === 'Email');
    const whatsappChannel = channels.find((c) => c.channelName === 'WhatsApp');

    const englishLang = languages.find((l) => l.languageName === 'English');
    const hindiLang = languages.find((l) => l.languageName === 'Hindi');

    // 5. Seed Templates
    console.log('📝 Seeding templates...');
    const templates = await db
      .insert(templateMaster)
      .values([
        {
          templateId: 'TEMP_001',
          templateName: 'Pre-Legal Notice - 60 DPD',
          messageBody:
            'Dear {{borrowerName}}, your loan account {{accountNumber}} is overdue by {{dpdDays}} days. Outstanding amount: ₹{{outstandingAmount}}. Please contact us at {{phoneNumber}} to resolve this matter immediately.',
          templateType: 'Pre-Legal',
          status: 'Active',
          channelId: smsChannel.id,
          languageId: englishLang.id,
          description: 'Standard pre-legal notice for 60+ DPD accounts',
          createdBy: 'system',
        },
        {
          templateId: 'TEMP_002',
          templateName: 'Pre-Legal Notice - 60 DPD (Hindi)',
          messageBody:
            'प्रिय {{borrowerName}}, आपका लोन खाता {{accountNumber}} {{dpdDays}} दिनों से अतिदेय है। बकाया राशि: ₹{{outstandingAmount}}। कृपया इस मामले को तुरंत हल करने के लिए {{phoneNumber}} पर हमसे संपर्क करें।',
          templateType: 'Pre-Legal',
          status: 'Active',
          channelId: smsChannel.id,
          languageId: hindiLang.id,
          description: 'Standard pre-legal notice for 60+ DPD accounts in Hindi',
          createdBy: 'system',
        },
        {
          templateId: 'TEMP_003',
          templateName: 'Legal Notice - 90 DPD',
          messageBody:
            'LEGAL NOTICE: This is to inform you that your loan account {{accountNumber}} is overdue by {{dpdDays}} days with outstanding amount of ₹{{outstandingAmount}}. Legal action will be initiated if payment is not made within 7 days.',
          templateType: 'Legal',
          status: 'Active',
          channelId: emailChannel.id,
          languageId: englishLang.id,
          description: 'Legal notice for 90+ DPD accounts',
          createdBy: 'system',
        },
        {
          templateId: 'TEMP_004',
          templateName: 'Final Warning - 120 DPD',
          messageBody:
            'FINAL WARNING: Your loan account {{accountNumber}} is severely overdue by {{dpdDays}} days. Outstanding amount: ₹{{outstandingAmount}}. This is your final notice before legal proceedings.',
          templateType: 'Final Warning',
          status: 'Active',
          channelId: emailChannel.id,
          languageId: englishLang.id,
          description: 'Final warning notice for 120+ DPD accounts',
          createdBy: 'system',
        },
        {
          templateId: 'TEMP_005',
          templateName: 'WhatsApp Reminder - 30 DPD',
          messageBody:
            'Hi {{borrowerName}}! 👋 Your loan payment of ₹{{emiAmount}} is overdue by {{dpdDays}} days. Please make the payment to avoid additional charges. Pay now: {{paymentLink}}',
          templateType: 'Pre-Legal',
          status: 'Active',
          channelId: whatsappChannel.id,
          languageId: englishLang.id,
          description: 'WhatsApp reminder for 30+ DPD accounts',
          createdBy: 'system',
        },
      ])
      .returning();

    console.log(`✅ Seeded ${templates.length} templates`);

    // 6. Seed Product Groups
    console.log('🏦 Seeding product groups...');
    const productGroups = await db
      .insert(productGroupMaster)
      .values([
        {
          groupId: 'PG_001',
          groupName: 'Personal Loans',
          status: 'Active',
          description: 'Personal loan products',
          createdBy: 'system',
        },
        {
          groupId: 'PG_002',
          groupName: 'Home Loans',
          status: 'Active',
          description: 'Home loan products',
          createdBy: 'system',
        },
        {
          groupId: 'PG_003',
          groupName: 'Vehicle Loans',
          status: 'Active',
          description: 'Vehicle financing products',
          createdBy: 'system',
        },
        {
          groupId: 'PG_004',
          groupName: 'Business Loans',
          status: 'Active',
          description: 'Business financing products',
          createdBy: 'system',
        },
        {
          groupId: 'PG_005',
          groupName: 'Credit Cards',
          status: 'Active',
          description: 'Credit card products',
          createdBy: 'system',
        },
      ])
      .returning();

    console.log(`✅ Seeded ${productGroups.length} product groups`);

    // 7. Seed Product Types
    console.log('📋 Seeding product types...');
    const productTypes = await db
      .insert(productTypeMaster)
      .values([
        {
          typeId: 'PT_001',
          groupId: productGroups.find((pg) => pg.groupName === 'Personal Loans').id,
          typeName: 'Unsecured Personal Loan',
          status: 'Active',
          description: 'Unsecured personal loan without collateral',
          createdBy: 'system',
        },
        {
          typeId: 'PT_002',
          groupId: productGroups.find((pg) => pg.groupName === 'Personal Loans').id,
          typeName: 'Secured Personal Loan',
          status: 'Active',
          description: 'Secured personal loan with collateral',
          createdBy: 'system',
        },
        {
          typeId: 'PT_003',
          groupId: productGroups.find((pg) => pg.groupName === 'Home Loans').id,
          typeName: 'Home Purchase Loan',
          status: 'Active',
          description: 'Loan for purchasing a home',
          createdBy: 'system',
        },
        {
          typeId: 'PT_004',
          groupId: productGroups.find((pg) => pg.groupName === 'Home Loans').id,
          typeName: 'Home Construction Loan',
          status: 'Active',
          description: 'Loan for constructing a home',
          createdBy: 'system',
        },
        {
          typeId: 'PT_005',
          groupId: productGroups.find((pg) => pg.groupName === 'Vehicle Loans').id,
          typeName: 'New Vehicle Loan',
          status: 'Active',
          description: 'Loan for purchasing a new vehicle',
          createdBy: 'system',
        },
        {
          typeId: 'PT_006',
          groupId: productGroups.find((pg) => pg.groupName === 'Vehicle Loans').id,
          typeName: 'Used Vehicle Loan',
          status: 'Active',
          description: 'Loan for purchasing a used vehicle',
          createdBy: 'system',
        },
      ])
      .returning();

    console.log(`✅ Seeded ${productTypes.length} product types`);

    // 8. Seed Product Subtypes
    console.log('📊 Seeding product subtypes...');
    const productSubtypes = await db
      .insert(productSubtypeMaster)
      .values([
        {
          subtypeId: 'PST_001',
          typeId: productTypes.find((pt) => pt.typeName === 'Unsecured Personal Loan').id,
          subtypeName: 'Standard Personal Loan',
          status: 'Active',
          description: 'Standard unsecured personal loan',
          createdBy: 'system',
        },
        {
          subtypeId: 'PST_002',
          typeId: productTypes.find((pt) => pt.typeName === 'Unsecured Personal Loan').id,
          subtypeName: 'Premium Personal Loan',
          status: 'Active',
          description: 'Premium unsecured personal loan with higher limits',
          createdBy: 'system',
        },
        {
          subtypeId: 'PST_003',
          typeId: productTypes.find((pt) => pt.typeName === 'Home Purchase Loan').id,
          subtypeName: 'Residential Home Loan',
          status: 'Active',
          description: 'Residential home purchase loan',
          createdBy: 'system',
        },
        {
          subtypeId: 'PST_004',
          typeId: productTypes.find((pt) => pt.typeName === 'Home Purchase Loan').id,
          subtypeName: 'Plot Purchase Loan',
          status: 'Active',
          description: 'Plot purchase loan',
          createdBy: 'system',
        },
        {
          subtypeId: 'PST_005',
          typeId: productTypes.find((pt) => pt.typeName === 'New Vehicle Loan').id,
          subtypeName: 'Car Loan',
          status: 'Active',
          description: 'New car financing',
          createdBy: 'system',
        },
        {
          subtypeId: 'PST_006',
          typeId: productTypes.find((pt) => pt.typeName === 'New Vehicle Loan').id,
          subtypeName: 'Two-Wheeler Loan',
          status: 'Active',
          description: 'New two-wheeler financing',
          createdBy: 'system',
        },
      ])
      .returning();

    console.log(`✅ Seeded ${productSubtypes.length} product subtypes`);

    // 9. Seed Product Variants
    console.log('🔧 Seeding product variants...');
    const productVariants = await db
      .insert(productVariantMaster)
      .values([
        {
          variantId: 'PV_001',
          subtypeId: productSubtypes.find((pst) => pst.subtypeName === 'Standard Personal Loan').id,
          variantName: 'Standard Personal Loan - 12 Months',
          status: 'Active',
          description: 'Standard personal loan with 12-month tenure',
          createdBy: 'system',
        },
        {
          variantId: 'PV_002',
          subtypeId: productSubtypes.find((pst) => pst.subtypeName === 'Standard Personal Loan').id,
          variantName: 'Standard Personal Loan - 24 Months',
          status: 'Active',
          description: 'Standard personal loan with 24-month tenure',
          createdBy: 'system',
        },
        {
          variantId: 'PV_003',
          subtypeId: productSubtypes.find((pst) => pst.subtypeName === 'Premium Personal Loan').id,
          variantName: 'Premium Personal Loan - 36 Months',
          status: 'Active',
          description: 'Premium personal loan with 36-month tenure',
          createdBy: 'system',
        },
        {
          variantId: 'PV_004',
          subtypeId: productSubtypes.find((pst) => pst.subtypeName === 'Residential Home Loan').id,
          variantName: 'Residential Home Loan - 20 Years',
          status: 'Active',
          description: 'Residential home loan with 20-year tenure',
          createdBy: 'system',
        },
        {
          variantId: 'PV_005',
          subtypeId: productSubtypes.find((pst) => pst.subtypeName === 'Car Loan').id,
          variantName: 'Car Loan - 5 Years',
          status: 'Active',
          description: 'New car loan with 5-year tenure',
          createdBy: 'system',
        },
      ])
      .returning();

    console.log(`✅ Seeded ${productVariants.length} product variants`);

    console.log('🎉 Templates and products seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding templates and products:', error);
    throw error;
  }
}

// Run the seeding function
if (require.main === module) {
  seedTemplatesAndProducts()
    .then(() => {
      console.log('✅ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedTemplatesAndProducts };
