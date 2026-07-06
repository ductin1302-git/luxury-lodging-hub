fetch("http://localhost:3000/api/test-hotels?q=kiên giang")
  .then(r => r.json())
  .then(d => {
    console.log("Results for 'kiên giang' via admin:", JSON.stringify(d, null, 2));
  })
  .catch(console.error);
