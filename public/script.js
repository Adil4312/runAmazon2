// Global variables
let currentUser = null;
let cart = [];

// DOM ready event
document.addEventListener('DOMContentLoaded', function() {
  // Set up event listeners
  const toggleButton = document.getElementById('toggle-content');
  if (toggleButton) {
    toggleButton.addEventListener('click', toggleContent);
  }
  
  // Load cities for dropdowns
  loadCities();
  
  // Try to load user from localStorage
  const savedUser = localStorage.getItem('currentUser');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    updateUI();
  }
  
  // Load products
  loadProducts();
});

// Toggle content sections
function toggleContent() {
  const sections = document.querySelectorAll('.content-section');
  sections.forEach(section => {
    if (section.style.display === 'block') {
      section.style.display = 'none';
    } else {
      section.style.display = 'block';
    }
  });
}

// Load cities for dropdowns
function loadCities() {
  const cities = ['Jalalabad', 'Kabul', 'Kandahar', 'Herat', 'Balkh'];
  const productLocation = document.getElementById('product-location');
  const pickupLocation = document.getElementById('pickup-location');
  
  if (productLocation) {
    productLocation.innerHTML = cities.map(city => 
      `<option value="${city}">${city}</option>`
    ).join('');
  }
  
  if (pickupLocation) {
    pickupLocation.innerHTML = cities.map(city => 
      `<option value="${city}">${city}</option>`
    ).join('');
  }
}

// User registration
function register() {
  const username = document.getElementById('reg-username').value;
  const password = document.getElementById('reg-password').value;
  const role = document.getElementById('reg-role').value;
  
  if (!username || !password) {
    alert('Please enter both username and password');
    return;
  }
  
  // Save user to localStorage
  const user = { username, password, role };
  localStorage.setItem('user_' + username, JSON.stringify(user));
  
  alert('Registration successful! Please login.');
  
  // Clear form
  document.getElementById('reg-username').value = '';
  document.getElementById('reg-password').value = '';
}

// User login
function login() {
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;
  
  if (!username || !password) {
    alert('Please enter both username and password');
    return;
  }
  
  // Check user in localStorage
  const userData = localStorage.getItem('user_' + username);
  if (!userData) {
    alert('User not found');
    return;
  }
  
  const user = JSON.parse(userData);
  if (user.password !== password) {
    alert('Incorrect password');
    return;
  }
  
  currentUser = user;
  localStorage.setItem('currentUser', JSON.stringify(user));
  
  alert('Login successful!');
  updateUI();
  
  // Clear form
  document.getElementById('login-username').value = '';
  document.getElementById('login-password').value = '';
}

// Update UI based on user role
function updateUI() {
  const authSection = document.getElementById('auth');
  const sellerPanel = document.getElementById('seller-panel');
  const cartSection = document.getElementById('cart');
  
  if (authSection) authSection.style.display = 'none';
  
  if (currentUser) {
    if (currentUser.role === 'seller' && sellerPanel) {
      sellerPanel.style.display = 'block';
    }
    
    if (cartSection) {
      cartSection.style.display = 'block';
    }
  }
}

// Load products from API
function loadProducts() {
  // Try to fetch from API first
  fetch('/api/products')
    .then(response => {
      if (!response.ok) {
        throw new Error('API not available');
      }
      return response.json();
    })
    .then(products => {
      displayProducts(products);
    })
    .catch(error => {
      console.error('Error loading products from API:', error);
      // Fallback to mock data if API fails
      displayProducts(getMockProducts());
    });
}

// Display products in the UI
function displayProducts(products) {
  const productList = document.getElementById('product-list');
  if (!productList) return;
  
  productList.innerHTML = products.map(product => `
    <li>
      <div>
        <strong>${product.name}</strong> - $${product.price}
        <div>Category: ${product.category || 'N/A'}, Location: ${product.location || 'N/A'}</div>
      </div>
      <button onclick="addToCart(${product.id}, '${product.name}', ${product.price})">Add to Cart</button>
    </li>
  `).join('');
}

// Get mock products for demo purposes
function getMockProducts() {
  return [
    { id: 1, name: 'Afghan Rug', price: 49.99, category: 'Home', location: 'Kabul' },
    { id: 2, name: 'Green Tea', price: 5.99, category: 'Grocery', location: 'Jalalabad' },
    { id: 3, name: 'Traditional Hat', price: 12.99, category: 'Wearing Stuff', location: 'Kandahar' },
    { id: 4, name: 'Handcrafted Jewelry', price: 24.99, category: 'Accessories', location: 'Herat' },
    { id: 5, name: 'Dried Fruits', price: 8.99, category: 'Grocery', location: 'Balkh' }
  ];
}

// Add product to cart
function addToCart(id, name, price) {
  cart.push({ id, name, price });
  updateCart();
  alert(`Added ${name} to cart!`);
}

// Update cart UI
function updateCart() {
  const cartList = document.getElementById('cart-list');
  if (!cartList) return;
  
  cartList.innerHTML = cart.map(item => `
    <li>${item.name} - $${item.price}</li>
  `).join('');
}

// Filter products by category
function filterProducts(category) {
  // Try to fetch from API first
  fetch('/api/products')
    .then(response => {
      if (!response.ok) {
        throw new Error('API not available');
      }
      return response.json();
    })
    .then(products => {
      const filtered = products.filter(product => product.category === category);
      displayProducts(filtered);
    })
    .catch(error => {
      console.error('Error filtering products from API:', error);
      // Fallback to mock filtering
      const mockProducts = getMockProducts();
      const filtered = mockProducts.filter(product => product.category === category);
      displayProducts(filtered);
    });
}

// Show products by city
function showCityProducts(city) {
  // Try to fetch from API first
  fetch('/api/products')
    .then(response => {
      if (!response.ok) {
        throw new Error('API not available');
      }
      return response.json();
    })
    .then(products => {
      const filtered = products.filter(product => product.location === city);
      displayProducts(filtered);
    })
    .catch(error => {
      console.error('Error filtering by city from API:', error);
      // Fallback to mock filtering
      const mockProducts = getMockProducts();
      const filtered = mockProducts.filter(product => product.location === city);
      displayProducts(filtered);
    });
}

// Add product (for sellers)
function addProduct() {
  const name = document.getElementById('product-name').value;
  const price = parseFloat(document.getElementById('product-price').value);
  const location = document.getElementById('product-location').value;
  const category = 'General'; // Default category
  
  if (!name || isNaN(price) || !location) {
    alert('Please fill all fields with valid values');
    return;
  }
  
  // Send to API
  fetch('/api/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, price, category, location })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('API not available');
    }
    return response.json();
  })
  .then(product => {
    alert(`Product "${product.name}" added successfully!`);
    // Clear form
    document.getElementById('product-name').value = '';
    document.getElementById('product-price').value = '';
    // Reload products
    loadProducts();
  })
  .catch(error => {
    console.error('Error adding product:', error);
    alert('Error adding product. Using mock data for demo.');
    // Add to mock data for demo purposes
    const newProduct = { 
      id: Math.floor(Math.random() * 1000), 
      name, 
      price, 
      category, 
      location 
    };
    const mockProducts = getMockProducts();
    mockProducts.push(newProduct);
    displayProducts(mockProducts);
  });
}

// Checkout (mock implementation)
function checkout() {
  if (cart.length === 0) {
    alert('Your cart is empty!');
    return;
  }
  
  const location = document.getElementById('pickup-location').value;
  alert(`Thank you for your order! Your items will be available for pickup at ${location}. This is a mock checkout.`);
  
  // Clear cart
  cart = [];
  updateCart();
}

// Logout function
function logout() {
  currentUser = null;
  localStorage.removeItem('currentUser');
  alert('Logged out successfully');
  
  // Reset UI
  const authSection = document.getElementById('auth');
  const sellerPanel = document.getElementById('seller-panel');
  const cartSection = document.getElementById('cart');
  
  if (authSection) authSection.style.display = 'block';
  if (sellerPanel) sellerPanel.style.display = 'none';
  if (cartSection) cartSection.style.display = 'none';
}