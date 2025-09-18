const { db } = require('../drizzle.config');
const { schemaConfiguration, courts, documentTypes, lawyers, stateMaster } = require('../schema');

async function seedLegalAndSystem() {
  console.log('🌱 Starting legal and system data seeding...');

  try {
    // Get state IDs (assuming they exist from previous seeding)
    const states = await db.select().from(stateMaster);

    if (states.length === 0) {
      throw new Error('States must be seeded first');
    }

    const maharashtra = states.find((s) => s.stateName === 'Maharashtra');
    const delhi = states.find((s) => s.stateName === 'Delhi');
    const karnataka = states.find((s) => s.stateName === 'Karnataka');
    const tamilNadu = states.find((s) => s.stateName === 'Tamil Nadu');

    // 10. Seed Schema Configurations
    console.log('⚙️ Seeding schema configurations...');
    const schemas = await db
      .insert(schemaConfiguration)
      .values([
        {
          schemaName: 'borrower_master',
          sourceType: 'LMS',
          status: 'Active',
          description: 'Borrower master data from LMS system',
          createdBy: 'system',
        },
        {
          schemaName: 'loan_accounts',
          sourceType: 'LMS',
          status: 'Active',
          description: 'Loan accounts data from LMS system',
          createdBy: 'system',
        },
        {
          schemaName: 'payment_history',
          sourceType: 'LMS',
          status: 'Active',
          description: 'Payment history from LMS system',
          createdBy: 'system',
        },
        {
          schemaName: 'legal_notices',
          sourceType: 'Manual',
          status: 'Active',
          description: 'Legal notices generated manually',
          createdBy: 'system',
        },
        {
          schemaName: 'court_orders',
          sourceType: 'API',
          status: 'Active',
          description: 'Court orders from external API',
          createdBy: 'system',
        },
      ])
      .returning();

    console.log(`✅ Seeded ${schemas.length} schema configurations`);

    // 11. Seed Courts
    console.log('⚖️ Seeding courts...');
    const courtsData = await db
      .insert(courts)
      .values([
        {
          courtCode: 'BOM_HC',
          courtName: 'Bombay High Court',
          courtType: 'High Court',
          jurisdiction: 'Maharashtra and Goa',
          stateId: maharashtra.id,
          address: 'Fort, Mumbai, Maharashtra 400032',
          contactInfo: 'Phone: 022-2262-1234',
          status: 'Active',
          createdBy: 'system',
        },
        {
          courtCode: 'DEL_HC',
          courtName: 'Delhi High Court',
          courtType: 'High Court',
          jurisdiction: 'Delhi',
          stateId: delhi.id,
          address: 'Sher Shah Road, New Delhi, Delhi 110003',
          contactInfo: 'Phone: 011-2338-1234',
          status: 'Active',
          createdBy: 'system',
        },
        {
          courtCode: 'BAN_HC',
          courtName: 'Karnataka High Court',
          courtType: 'High Court',
          jurisdiction: 'Karnataka',
          stateId: karnataka.id,
          address: 'High Court Buildings, Bangalore, Karnataka 560001',
          contactInfo: 'Phone: 080-2234-1234',
          status: 'Active',
          createdBy: 'system',
        },
        {
          courtCode: 'MAD_HC',
          courtName: 'Madras High Court',
          courtType: 'High Court',
          jurisdiction: 'Tamil Nadu and Puducherry',
          stateId: tamilNadu.id,
          address: 'High Court Buildings, Chennai, Tamil Nadu 600104',
          contactInfo: 'Phone: 044-2534-1234',
          status: 'Active',
          createdBy: 'system',
        },
        {
          courtCode: 'BOM_DC_001',
          courtName: 'Mumbai District Court',
          courtType: 'District Court',
          jurisdiction: 'Mumbai District',
          stateId: maharashtra.id,
          address: 'District Court Complex, Mumbai',
          contactInfo: 'Phone: 022-2345-1234',
          status: 'Active',
          createdBy: 'system',
        },
        {
          courtCode: 'DEL_DC_001',
          courtName: 'Delhi District Court',
          courtType: 'District Court',
          jurisdiction: 'Central Delhi',
          stateId: delhi.id,
          address: 'District Court Complex, Delhi',
          contactInfo: 'Phone: 011-2345-1234',
          status: 'Active',
          createdBy: 'system',
        },
      ])
      .returning();

    console.log(`✅ Seeded ${courtsData.length} courts`);

    // 12. Seed Document Types
    console.log('📄 Seeding document types...');
    const docTypes = await db
      .insert(documentTypes)
      .values([
        {
          docTypeCode: 'DOC_001',
          docTypeName: 'Legal Notice',
          docCategory: 'Legal Notice',
          isConfidential: false,
          maxFileSizeMb: 5,
          allowedFormats: 'PDF,DOC,DOCX',
          description: 'Legal notice documents',
          status: 'Active',
          createdBy: 'system',
        },
        {
          docTypeCode: 'DOC_002',
          docTypeName: 'Court Order',
          docCategory: 'Court Order',
          isConfidential: false,
          maxFileSizeMb: 10,
          allowedFormats: 'PDF',
          description: 'Court order documents',
          status: 'Active',
          createdBy: 'system',
        },
        {
          docTypeCode: 'DOC_003',
          docTypeName: 'Affidavit',
          docCategory: 'Affidavit',
          isConfidential: true,
          maxFileSizeMb: 5,
          allowedFormats: 'PDF,DOC,DOCX',
          description: 'Affidavit documents',
          status: 'Active',
          createdBy: 'system',
        },
        {
          docTypeCode: 'DOC_004',
          docTypeName: 'Case Summary',
          docCategory: 'Case Summary',
          isConfidential: false,
          maxFileSizeMb: 3,
          allowedFormats: 'PDF,DOC,DOCX',
          description: 'Case summary documents',
          status: 'Active',
          createdBy: 'system',
        },
        {
          docTypeCode: 'DOC_005',
          docTypeName: 'Proof of Service',
          docCategory: 'Proof',
          isConfidential: false,
          maxFileSizeMb: 2,
          allowedFormats: 'PDF,JPG,PNG',
          description: 'Proof of service documents',
          status: 'Active',
          createdBy: 'system',
        },
        {
          docTypeCode: 'DOC_006',
          docTypeName: 'Loan Agreement',
          docCategory: 'Contract',
          isConfidential: true,
          maxFileSizeMb: 10,
          allowedFormats: 'PDF',
          description: 'Original loan agreement',
          status: 'Active',
          createdBy: 'system',
        },
        {
          docTypeCode: 'DOC_007',
          docTypeName: 'Identity Proof',
          docCategory: 'Identity Proof',
          isConfidential: true,
          maxFileSizeMb: 2,
          allowedFormats: 'PDF,JPG,PNG',
          description: 'Borrower identity proof',
          status: 'Active',
          createdBy: 'system',
        },
        {
          docTypeCode: 'DOC_008',
          docTypeName: 'Address Proof',
          docCategory: 'Address Proof',
          isConfidential: true,
          maxFileSizeMb: 2,
          allowedFormats: 'PDF,JPG,PNG',
          description: 'Borrower address proof',
          status: 'Active',
          createdBy: 'system',
        },
      ])
      .returning();

    console.log(`✅ Seeded ${docTypes.length} document types`);

    // 13. Seed Lawyers
    console.log('⚖️ Seeding lawyers...');
    const lawyersData = await db
      .insert(lawyers)
      .values([
        {
          lawyerCode: 'LAW-20250115-001',
          firstName: 'Rajesh',
          lastName: 'Kumar',
          fullName: 'Rajesh Kumar',
          email: 'rajesh.kumar@lawfirm.com',
          phone: '+91-9876543210',
          barNumber: 'MH/1234/2010',
          specialization: 'Civil Law',
          experience: 15,
          lawyerType: 'Internal',
          maxCases: 20,
          currentCases: 5,
          isActive: true,
          isAvailable: true,
          officeLocation: 'Mumbai',
          jurisdiction: 'Maharashtra',
          successRate: '85.50',
          averageCaseDuration: 180,
          createdBy: 'system',
        },
        {
          lawyerCode: 'LAW-20250115-002',
          firstName: 'Priya',
          lastName: 'Sharma',
          fullName: 'Priya Sharma',
          email: 'priya.sharma@lawfirm.com',
          phone: '+91-9876543211',
          barNumber: 'DL/5678/2015',
          specialization: 'Criminal Law',
          experience: 10,
          lawyerType: 'External',
          maxCases: 15,
          currentCases: 8,
          isActive: true,
          isAvailable: true,
          officeLocation: 'Delhi',
          jurisdiction: 'Delhi',
          successRate: '92.30',
          averageCaseDuration: 120,
          createdBy: 'system',
        },
        {
          lawyerCode: 'LAW-20250115-003',
          firstName: 'Amit',
          lastName: 'Patel',
          fullName: 'Amit Patel',
          email: 'amit.patel@lawfirm.com',
          phone: '+91-9876543212',
          barNumber: 'GJ/9012/2012',
          specialization: 'Commercial Law',
          experience: 13,
          lawyerType: 'Senior',
          maxCases: 25,
          currentCases: 12,
          isActive: true,
          isAvailable: true,
          officeLocation: 'Ahmedabad',
          jurisdiction: 'Gujarat',
          successRate: '88.75',
          averageCaseDuration: 150,
          createdBy: 'system',
        },
        {
          lawyerCode: 'LAW-20250115-004',
          firstName: 'Sneha',
          lastName: 'Reddy',
          fullName: 'Sneha Reddy',
          email: 'sneha.reddy@lawfirm.com',
          phone: '+91-9876543213',
          barNumber: 'KA/3456/2018',
          specialization: 'Family Law',
          experience: 7,
          lawyerType: 'Junior',
          maxCases: 10,
          currentCases: 3,
          isActive: true,
          isAvailable: true,
          officeLocation: 'Bangalore',
          jurisdiction: 'Karnataka',
          successRate: '78.90',
          averageCaseDuration: 200,
          createdBy: 'system',
        },
        {
          lawyerCode: 'LAW-20250115-005',
          firstName: 'Vikram',
          lastName: 'Singh',
          fullName: 'Vikram Singh',
          email: 'vikram.singh@lawfirm.com',
          phone: '+91-9876543214',
          barNumber: 'TN/7890/2016',
          specialization: 'Property Law',
          experience: 9,
          lawyerType: 'Associate',
          maxCases: 18,
          currentCases: 7,
          isActive: true,
          isAvailable: true,
          officeLocation: 'Chennai',
          jurisdiction: 'Tamil Nadu',
          successRate: '81.25',
          averageCaseDuration: 160,
          createdBy: 'system',
        },
      ])
      .returning();

    console.log(`✅ Seeded ${lawyersData.length} lawyers`);

    console.log('🎉 Legal and system data seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding legal and system data:', error);
    throw error;
  }
}

// Run the seeding function
if (require.main === module) {
  seedLegalAndSystem()
    .then(() => {
      console.log('✅ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedLegalAndSystem };
