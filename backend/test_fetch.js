import http from 'http';

http.get('http://localhost:5005/api/weddings/63256898-0426-4edd-965b-029c07a926f3/qr', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('STATUS:', res.statusCode, 'BODY:', data));
}).on('error', err => console.log('ERROR:', err.message));
