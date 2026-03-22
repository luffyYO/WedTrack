import fs from 'fs';
fetch('http://localhost:5005/api/weddings/5fd7c490-0eed-4e0c-9406-d056388e46d4/qr')
  .then(async res => {
    const text = await res.text();
    fs.writeFileSync('out.txt', 'STATUS: ' + res.status + ' BODY: ' + text);
  })
  .catch(err => {
    fs.writeFileSync('out.txt', 'ERR: ' + String(err));
  });
