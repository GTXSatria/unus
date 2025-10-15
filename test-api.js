const http = require('http');

// Fungsi untuk melakukan request HTTP
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            data: parsedData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: responseData
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Fungsi untuk login guru
async function loginGuru() {
  console.log('=== LOGIN GURU ===');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  const data = {
    email: 'guru@example.com',
    password: 'password123'
  };
  
  try {
    const response = await makeRequest(options, data);
    console.log('Status:', response.statusCode);
    console.log('Response:', response.data);
    
    if (response.statusCode === 200) {
      return response.data.token;
    } else {
      throw new Error(`Login failed: ${response.data.message}`);
    }
  } catch (error) {
    console.error('Login error:', error.message);
    throw error;
  }
}

// Fungsi untuk login siswa
async function loginSiswa() {
  console.log('\n=== LOGIN SISWA ===');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login-siswa',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  const data = {
    kodeUjian: 'KODE_UJIAN_ANDA',
    nisn: 'NISN_ANDA'
  };
  
  try {
    const response = await makeRequest(options, data);
    console.log('Status:', response.statusCode);
    console.log('Response:', response.data);
    
    if (response.statusCode === 200) {
      return response.data.token;
    } else {
      throw new Error(`Login failed: ${response.data.message}`);
    }
  } catch (error) {
    console.error('Login error:', error.message);
    throw error;
  }
}

// Fungsi untuk register guru
async function registerGuru() {
  console.log('\n=== REGISTER GURU ===');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  const data = {
    name: 'Test Guru',
    email: 'test@example.com',
    password: 'password123',
    role: 'guru'
  };
  
  try {
    const response = await makeRequest(options, data);
    console.log('Status:', response.statusCode);
    console.log('Response:', response.data);
    
    if (response.statusCode === 200) {
      return response.data;
    } else {
      throw new Error(`Register failed: ${response.data.message}`);
    }
  } catch (error) {
    console.error('Register error:', error.message);
    throw error;
  }
}

// Fungsi untuk mendapatkan hasil ujian
async function getHasilUjian(token) {
  console.log('\n=== GET HASIL UJIAN ===');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/hasil-ujian',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };
  
  try {
    const response = await makeRequest(options);
    console.log('Status:', response.statusCode);
    console.log('Response:', response.data);
    
    if (response.statusCode === 200) {
      return response.data;
    } else {
      throw new Error(`Get hasil ujian failed: ${response.data.message}`);
    }
  } catch (error) {
    console.error('Get hasil ujian error:', error.message);
    throw error;
  }
}

// Fungsi untuk submit ujian
async function submitUjian(token) {
  console.log('\n=== SUBMIT UJIAN ===');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/ujian/submit',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };
  
  const data = {
    jawaban: {
      "1": "A",
      "2": "B",
      "3": "C"
    }
  };
  
  try {
    const response = await makeRequest(options, data);
    console.log('Status:', response.statusCode);
    console.log('Response:', response.data);
    
    if (response.statusCode === 200) {
      return response.data;
    } else {
      throw new Error(`Submit ujian failed: ${response.data.message}`);
    }
  } catch (error) {
    console.error('Submit ujian error:', error.message);
    throw error;
  }
}

// Fungsi utama untuk menjalankan semua tes
async function runTests() {
  try {
    console.log('Starting API tests...\n');
    
    // Test register guru
    await registerGuru();
    
    // Test login guru
    const guruToken = await loginGuru();
    
    // Test get hasil ujian
    await getHasilUjian(guruToken);
    
    // Test login siswa
    const siswaToken = await loginSiswa();
    
    // Test submit ujian
    await submitUjian(siswaToken);
    
    // Test get hasil ujian lagi setelah submit
    await getHasilUjian(guruToken);
    
    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('\nTest failed:', error.message);
  }
}

// Jalankan tes
runTests();