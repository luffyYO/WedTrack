const isValidName = (name) => {
    if (!name) return false; 
    if (name.length < 2 || name.length > 50) return false;
    if (!/^[A-Za-z\s]+$/.test(name)) return false; 
    if (/(.)\1{3,}/i.test(name)) return false; 
    if (/[bcdfghjklmnpqrstvwxyz]{5,}/i.test(name)) return false; 
    return true;
};

console.log("priya:", isValidName("priya"));
console.log("rajesh:", isValidName("rajesh"));
console.log("sex:", isValidName("sex"));
console.log("Kashmir:", isValidName("Kashmir"));
