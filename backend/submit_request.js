const axios = require('axios');

async function submitRequest() {
  try {
    console.log('Submitting custom gesture request...');

    const response = await axios.post(
      'http://localhost:5000/api/admin-custom-gestures/submit',
      {
        adminId: '691771d176db6c07b5963254',
        gestures: ['custom_gesture_test']
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MTc3MWM0NDgzYTcxYjg0NmIwMWJjNyIsImlhdCI6MTc2MzM1NDUxMCwiZXhwIjoxNzYzMzU4MTEwfQ.jwbZl9_vXdNPEYL0wiQE3872coRv_28QmwNtTej4b6w'
        }
      }
    );

    console.log('✅ Request submitted successfully!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Request failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

submitRequest();