import fs from 'fs';
fetch('http://localhost:5005/api/weddings/7fd65915-8a17-486e-abfe-136c9c3f04e6/qr')
  .then(async res => {
    const text = await res.text();
    fs.writeFileSync('out3.txt', 'STATUS: ' + res.status + ' BODY_LENGTH: ' + text.length + '\n' + (res.status !== 200 ? text : 'BODY IS OK'));
  })
  .catch(err => {
    fs.writeFileSync('out3.txt', 'ERR: ' + String(err));
  });
