fetch("http://localhost:3000/api/hotels?q=kiên giang")
  .then(r => r.json())
  .then(d => {
    console.log("Results for 'kiên giang':", JSON.stringify(d.map(h => h.name), null, 2));
  })
  .catch(console.error);
