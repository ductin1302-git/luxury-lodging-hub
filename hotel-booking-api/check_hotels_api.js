fetch("http://localhost:3000/api/hotels?city=Đà Nẵng")
  .then(r => r.json())
  .then(d => {
    console.log("Results for Đà Nẵng:", JSON.stringify(d.map(h => h.name), null, 2));
  })
  .catch(console.error);
