window.onload = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const city = urlParams.get('city');
  document.getElementById('city-name').textContent = city;
  document.getElementById('inquiry-email').href = `mailto:afghanamazon@gmail.com?subject=Inquiry for ${encodeURIComponent(city)}`;
  loadCityProducts(city);
};

async function loadCityProducts(city) {
  const response = await fetch('/products');
  const products = await response.json();
  const cityProducts = products.filter(p => p.location_city === city);
  
  const groceryList = document.getElementById('grocery-list');
  const wearingList = document.getElementById('wearing-list');
  const electronicList = document.getElementById('electronic-list');
  const sportsList = document.getElementById('sports-list');
  
  cityProducts.forEach(p => {
    const li = document.createElement('li');
    li.textContent = `${p.name} - $${p.price} (Hub: ${p.location_name})`;
    if (p.category === 'Grocery') groceryList.appendChild(li);
    if (p.category === 'Wearing Stuff') wearingList.appendChild(li);
    if (p.category === 'Electronic') electronicList.appendChild(li);
    if (p.category === 'Sports') sportsList.appendChild(li);
  });
}