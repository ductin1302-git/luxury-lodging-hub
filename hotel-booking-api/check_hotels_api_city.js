fetch("http://localhost:3000/api/hotels?city=Kiên Giang")
  .then(r => r.json())
  .then(d => {
    console.log("Results for city='Kiên Giang':", JSON.stringify(d.map(h => h.name), null, 2));
  })
  .catch(console.error);
