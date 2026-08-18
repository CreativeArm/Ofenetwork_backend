fetch('http://127.0.0.1:4000/api/rates/cmpyt1ca50000107kufm5rbnj', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ depositRate: 'N1,999.00 / $1' })
}).then(res => res.json()).then(console.log).catch(console.error);
