import NodeCache from 'node-cache';

// Cache TTL: 5 minutes, Check Period: 1 minute
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

export default cache;
