const axios = require('axios');

async function testApprove() {
  try {
    console.log('Testing approve request...');
    const response = await axios.put(
      'http://localhost:5000/api/admin-custom-gestures/approve/691aa945ee40909c3bd0472b',
      {
        adminId: '691771d176db6c07b5963254'
      },
      {
        headers: {
          'Content-Type': 'application/json',
                    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MTc3MWM0NDgzYTcxYjg0NmIwMWJjNyIsImlhdCI6MTc2MzM1NDUxMCwiZXhwIjoxNzYzMzU4MTEwfQ.jwbZl9_vXdNPEYL0wiQE3872coRv_28QmwNtTej4b6w'
        },
        timeout: 60000 // 60 seconds timeout
      }
    );

    console.log('✅ Approve successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Approve failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.code === 'ECONNREFUSED') {
      console.error('Cannot connect to server. Is backend running?');
    } else {
      console.error('Error:', error.message);
    }
  }
}

testApprove();