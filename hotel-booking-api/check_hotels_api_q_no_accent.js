fetch("http://localhost:3000/api/hotels?q=kien giang")
  .then(r => r.json())
  .then(d => {
    console.log("Results for 'kien giang':", JSON.stringify(d.map(h => h.name), null, 2));
  })
  .catch(console.error);
