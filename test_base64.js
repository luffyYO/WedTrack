const base64String = 'BC5RxkDoZ-DZSV1Y6QxoEHX_BV9Me8FdBPd17rTtTaCI1JYW3Kgt2sFyJaYtBxoHo2LCIuJX0gn98HnSiZF0jy0';
const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
const rawData = atob(base64);
const arr = Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
console.log('Array length:', arr.length);
