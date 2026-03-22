import fs from 'fs';
const payload = {
    weddingId: '7fd65915-8a17-486e-abfe-136c9c3f04e6',
    firstName: 'kishore',
    lastName: 'kishore',
    fatherFirstName: 'ramchand',
    fatherLastName: 'kishore',
    district: 'nalgonda',
    village: 'Nalgonda',
    amount: 2,
    paymentType: 'Cash',
    giftSide: 'bride',
    wishes: 'hello'
};

fetch('http://localhost:5005/api/guests/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
})
.then(async res => {
    const text = await res.text();
    fs.writeFileSync('submit_out.txt', 'STATUS: ' + res.status + '\nBODY: ' + text);
    console.log("Done");
})
.catch(err => {
    fs.writeFileSync('submit_out.txt', 'ERROR: ' + String(err));
    console.log("Error");
});
