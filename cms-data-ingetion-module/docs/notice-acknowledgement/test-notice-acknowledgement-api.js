/**
 * Test script for Notice Acknowledgement API
 * This script demonstrates how to use the API endpoints programmatically
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// Configuration
const config = {
  baseUrl: 'http://localhost:3000',
  authToken: 'your_jwt_token_here',
  noticeId: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  testFilePath: './sample_proof.pdf',
};

// Create axios instance with default config
const api = axios.create({
  baseURL: config.baseUrl,
  headers: {
    Authorization: `Bearer ${config.authToken}`,
    'Content-Type': 'application/json',
  },
});

/**
 * Test 1: Create Acknowledgement (Without Document)
 */
async function testCreateAcknowledgementWithoutDocument() {
  console.log('🧪 Testing: Create Acknowledgement (Without Document)');

  try {
    const response = await api.post('/legal/notice-acknowledgements', {
      noticeId: config.noticeId,
      acknowledgedBy: 'Family Member',
      relationshipToBorrower: 'Spouse',
      acknowledgementDate: '2025-01-21T16:30:00Z',
      acknowledgementMode: 'In Person',
      remarks: 'Notice acknowledged by spouse in presence of security guard',
      capturedBy: 'Field Executive - Mumbai Team',
      geoLocation: '19.0760,72.8777',
    });

    console.log('✅ Success:', response.data);
    return response.data.id;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Test 2: Create Acknowledgement (With Document)
 */
async function testCreateAcknowledgementWithDocument() {
  console.log('🧪 Testing: Create Acknowledgement (With Document)');

  try {
    const formData = new FormData();
    formData.append('noticeId', config.noticeId);
    formData.append('acknowledgedBy', 'Family Member');
    formData.append('relationshipToBorrower', 'Spouse');
    formData.append('acknowledgementDate', '2025-01-21T16:30:00Z');
    formData.append('acknowledgementMode', 'In Person');
    formData.append('remarks', 'Notice acknowledged by spouse with proof document');
    formData.append('capturedBy', 'Field Executive - Mumbai Team');
    formData.append('geoLocation', '19.0760,72.8777');

    // Add file if it exists
    if (fs.existsSync(config.testFilePath)) {
      formData.append('file', fs.createReadStream(config.testFilePath));
    }

    const response = await api.post('/legal/notice-acknowledgements/with-document', formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${config.authToken}`,
      },
    });

    console.log('✅ Success:', response.data);
    return response.data.id;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Test 3: Get All Acknowledgements
 */
async function testGetAllAcknowledgements() {
  console.log('🧪 Testing: Get All Acknowledgements');

  try {
    const response = await api.get('/legal/notice-acknowledgements', {
      params: {
        page: 1,
        limit: 10,
      },
    });

    console.log('✅ Success:', response.data);
    return response.data.data[0]?.id;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Test 4: Get Acknowledgement by ID
 */
async function testGetAcknowledgementById(acknowledgementId) {
  console.log('🧪 Testing: Get Acknowledgement by ID');

  try {
    const response = await api.get(`/legal/notice-acknowledgements/${acknowledgementId}`);
    console.log('✅ Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Test 5: Update Acknowledgement
 */
async function testUpdateAcknowledgement(acknowledgementId) {
  console.log('🧪 Testing: Update Acknowledgement');

  try {
    const response = await api.put(`/legal/notice-acknowledgements/${acknowledgementId}`, {
      acknowledgedBy: 'Borrower',
      relationshipToBorrower: 'Self',
      acknowledgementDate: '2025-01-21T17:00:00Z',
      acknowledgementMode: 'Courier Receipt',
      remarks: 'Updated: Borrower personally acknowledged the notice',
      geoLocation: '19.0760,72.8777',
      acknowledgementStatus: 'Acknowledged',
    });

    console.log('✅ Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Test 6: Upload Proof Document
 */
async function testUploadProofDocument(acknowledgementId) {
  console.log('🧪 Testing: Upload Proof Document');

  try {
    const formData = new FormData();

    if (fs.existsSync(config.testFilePath)) {
      formData.append('file', fs.createReadStream(config.testFilePath));
    } else {
      console.log('⚠️  Test file not found, skipping file upload');
      return null;
    }

    const response = await api.post(
      `/legal/notice-acknowledgements/${acknowledgementId}/upload-proof`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${config.authToken}`,
        },
      },
    );

    console.log('✅ Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Test 7: Get Statistics
 */
async function testGetStatistics() {
  console.log('🧪 Testing: Get Statistics');

  try {
    const response = await api.get('/legal/notice-acknowledgements/statistics');
    console.log('✅ Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Test 8: Get File Statistics
 */
async function testGetFileStatistics() {
  console.log('🧪 Testing: Get File Statistics');

  try {
    const response = await api.get('/legal/notice-acknowledgements/file-upload/statistics', {
      params: {
        documentType: 'acknowledgements',
      },
    });
    console.log('✅ Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Test 9: Delete Acknowledgement
 */
async function testDeleteAcknowledgement(acknowledgementId) {
  console.log('🧪 Testing: Delete Acknowledgement');

  try {
    const response = await api.delete(`/legal/notice-acknowledgements/${acknowledgementId}`);
    console.log('✅ Success: Acknowledgement deleted');
    return response.status === 204;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Starting Notice Acknowledgement API Tests\n');

  let acknowledgementId = null;

  try {
    // Test 1: Create acknowledgement without document
    acknowledgementId = await testCreateAcknowledgementWithoutDocument();
    console.log(`📝 Created acknowledgement ID: ${acknowledgementId}\n`);

    // Test 2: Get all acknowledgements
    await testGetAllAcknowledgements();
    console.log('');

    // Test 3: Get acknowledgement by ID
    await testGetAcknowledgementById(acknowledgementId);
    console.log('');

    // Test 4: Update acknowledgement
    await testUpdateAcknowledgement(acknowledgementId);
    console.log('');

    // Test 5: Upload proof document
    await testUploadProofDocument(acknowledgementId);
    console.log('');

    // Test 6: Get statistics
    await testGetStatistics();
    console.log('');

    // Test 7: Get file statistics
    await testGetFileStatistics();
    console.log('');

    // Test 8: Delete acknowledgement (optional)
    // await testDeleteAcknowledgement(acknowledgementId);
    // console.log('');

    console.log('🎉 All tests completed successfully!');
  } catch (error) {
    console.error('💥 Test suite failed:', error.message);
    process.exit(1);
  }
}

/**
 * Run specific test
 */
async function runSpecificTest(testName) {
  console.log(`🧪 Running specific test: ${testName}\n`);

  try {
    switch (testName) {
      case 'create-without-doc':
        await testCreateAcknowledgementWithoutDocument();
        break;
      case 'create-with-doc':
        await testCreateAcknowledgementWithDocument();
        break;
      case 'get-all':
        await testGetAllAcknowledgements();
        break;
      case 'get-by-id':
        await testGetAcknowledgementById(config.noticeId);
        break;
      case 'update':
        await testUpdateAcknowledgement(config.noticeId);
        break;
      case 'upload-proof':
        await testUploadProofDocument(config.noticeId);
        break;
      case 'statistics':
        await testGetStatistics();
        break;
      case 'file-statistics':
        await testGetFileStatistics();
        break;
      default:
        console.log('❌ Unknown test name. Available tests:');
        console.log('  - create-without-doc');
        console.log('  - create-with-doc');
        console.log('  - get-all');
        console.log('  - get-by-id');
        console.log('  - update');
        console.log('  - upload-proof');
        console.log('  - statistics');
        console.log('  - file-statistics');
        break;
    }
  } catch (error) {
    console.error('💥 Test failed:', error.message);
    process.exit(1);
  }
}

// Main execution
if (require.main === module) {
  const testName = process.argv[2];

  if (testName) {
    runSpecificTest(testName);
  } else {
    runAllTests();
  }
}

module.exports = {
  testCreateAcknowledgementWithoutDocument,
  testCreateAcknowledgementWithDocument,
  testGetAllAcknowledgements,
  testGetAcknowledgementById,
  testUpdateAcknowledgement,
  testUploadProofDocument,
  testGetStatistics,
  testGetFileStatistics,
  testDeleteAcknowledgement,
  runAllTests,
  runSpecificTest,
};
