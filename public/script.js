// Global variables
let currentUser = null;
let cart = [];
let currentCity = '';
let currentBranch = '';

// DOM ready event
document.addEventListener('DOMContentLoaded', function() {
  // Set up event listeners
  const toggleButton = document.getElementById('toggle-content');
  if (toggleButton) {
    toggleButton.addEventListener('click', toggleContent);
  }
  
  // Load initial data
  loadCities();
  loadBranches();
  
  // Try to load user from localStorage
  const savedUser = localStorage.getItem('currentUser');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    updateUI();
  }
  
  // Load products
  loadProducts();
});

// Load cities for dropdowns
function loadCities() {
  fetch('/api/cities')
    .then(response => response.json())
    .then(cities => {
      populateCityDropdowns(cities);
    })
    .catch(error => {
      console.error('Error loading cities:', error);
      // Fallback to default cities
      const defaultCities = ['Jalalabad', 'Kabul', 'Kandahar', 'Herat', 'Balkh'];
      populateCityDropdowns(defaultCities);
    });
}

function populateCityDropdowns(cities) {
  const cityDropdowns = document.querySelectorAll('.city-dropdown');
  cityDropdowns.forEach(dropdown => {
    dropdown.innerHTML = cities.map(city => 
      `<option value="${city}">${city}</option>`
    ).join('');
  });
}

// Load branches for selected city
function loadBranches(city = '') {
  let url = '/api/branches';
  if (city) {
    url += `?city=${encodeURIComponent(city)}`;
  }
  
  fetch(url)
    .then(response => response.json())
    .then(branches => {
      populateBranchDropdowns(branches);
    })
    .catch(error => {
      console.error('Error loading branches:', error);
    });
}

function populateBranchDropdowns(branches) {
  const branchDropdowns = document.querySelectorAll('.branch-dropdown');
  branchDropdowns.forEach(dropdown => {
    dropdown.innerHTML = branches.map(branch => 
      `<option value="${branch.id}">${branch.name} - ${branch.address}</option>`
    ).join('');
  });
}

// City selection handler
function selectCity(city) {
  currentCity = city;
  document.getElementById('selected-city').textContent = city;
  loadBranches(city);
  loadProducts(city);
  showBranchesMap(city);
}

// Show branches on map (simulated)
function showBranchesMap(city) {
  const mapSection = document.getElementById('branches-map');
  if (mapSection) {
    mapSection.innerHTML = `
      <h3>${city} Branches Map</h3>
      <div class="map-placeholder">
        <p>📍 Map showing 10 branches across ${city}</p>
        <p>Each branch serves different districts of the city</p>
        <div class="branches-list">
          ${Array.from({length: 10}, (_, i) => `
            <div class="branch-item">
              <strong>${city} Branch ${i+1}</strong>
              <p>Main Street ${i+1}, ${city}</p>
              <p>Hours: 8:00 AM - 10:00 PM</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
}

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
  const customerSection = document.getElementById('customer-form');
  
  if (authSection) authSection.style.display = 'none';
  
  if (currentUser) {
    if (currentUser.role === 'seller' && sellerPanel) {
      sellerPanel.style.display = 'block';
    }
    
    if (cartSection) {
      cartSection.style.display = 'block';
    }
    
    if (customerSection) {
      customerSection.style.display = 'block';
    }
  }
}

// Load products from API
function loadProducts(city = '', branch = '', category = '') {
  let url = '/api/products';
  const params = new URLSearchParams();
  
  if (city) params.append('city', city);
  if (branch) params.append('branch', branch);
  if (category) params.append('category', category);
  
  if (params.toString()) {
    url += '?' + params.toString();
  }
  
  fetch(url)
    .then(response => response.json())
    .then(products => {
      displayProducts(products);
    })
    .catch(error => {
      console.error('Error loading products:', error);
      // Fallback to mock data if API fails
      displayProducts(getMockProducts());
    });
}

// Display products in the UI
function displayProducts(products) {
  const productList = document.getElementById('product-list');
  if (!productList) return;
  
  if (products.length === 0) {
    productList.innerHTML = '<li class="no-products">No products found for your selection.</li>';
    return;
  }
  
  productList.innerHTML = products.map(product => `
    <li class="product-item">
      <div class="product-info">
        <strong>${product.name}</strong> - $${product.price}
        <div class="product-details">
          Category: ${product.category || 'N/A'}, 
          Location: ${product.location || 'N/A'}
          ${product.branch_id ? ', Branch: ' + product.branch_id : ''}
        </div>
      </div>
      <button class="add-to-cart-btn" onclick="addToCart(${product.id}, '${product.name}', ${product.price})">
        Add to Cart
      </button>
    </li>
  `).join('');
}

// Get mock products for demo purposes
function getMockProducts() {
  return [
    { id: 1, name: 'Afghan Rug', price: 49.99, category: 'Home', location: 'Kabul', branch_id: 1 },
    { id: 2, name: 'Green Tea', price: 5.99, category: 'Grocery', location: 'Jalalabad', branch_id: 11 },
    { id: 3, name: 'Traditional Hat', price: 12.99, category: 'Wearing Stuff', location: 'Kandahar', branch_id: 21 },
    { id: 4, name: 'Handcrafted Jewelry', price: 24.99, category: 'Accessories', location: 'Herat', branch_id: 31 },
    { id: 5, name: 'Dried Fruits', price: 8.99, category: 'Grocery', location: 'Balkh', branch_id: 41 }
  ];
}

// Add product to cart
function addToCart(id, name, price) {
  cart.push({ id, name, price });
  updateCart();
  showNotification(`Added ${name} to cart!`);
}

// Update cart UI
function updateCart() {
  const cartList = document.getElementById('cart-list');
  if (!cartList) return;
  
  if (cart.length === 0) {
    cartList.innerHTML = '<li>Your cart is empty</li>';
    return;
  }
  
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  cartList.innerHTML = `
    ${cart.map(item => `
      <li class="cart-item">
        <span>${item.name} - $${item.price}</span>
        <button onclick="removeFromCart(${item.id})" class="remove-btn">Remove</button>
      </li>
    `).join('')}
    <li class="cart-total">
      <strong>Total: $${total.toFixed(2)}</strong>
    </li>
  `;
}

// Remove item from cart
function removeFromCart(id) {
  const index = cart.findIndex(item => item.id === id);
  if (index !== -1) {
    const removedItem = cart.splice(index, 1)[0];
    updateCart();
    showNotification(`Removed ${removedItem.name} from cart`);
  }
}

// Show notification
function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Filter products by category
function filterProducts(category) {
  loadProducts(currentCity, currentBranch, category);
}

// Show products by city
function showCityProducts(city) {
  currentCity = city;
  loadProducts(city);
}

// Add product (for sellers)
function addProduct() {
  const name = document.getElementById('product-name').value;
  const price = parseFloat(document.getElementById('product-price').value);
  const category = document.getElementById('product-category').value;
  const location = document.getElementById('product-location').value;
  const branch_id = parseInt(document.getElementById('product-branch').value);
  
  if (!name || isNaN(price) || !category || !location || isNaN(branch_id)) {
    alert('Please fill all fields with valid values');
    return;
  }
  
  // Send to API
  fetch('/api/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, price, category, location, branch_id })
  })
  .then(response => response.json())
  .then(product => {
    showNotification(`Product "${product.name}" added successfully!`);
    // Clear form
    document.getElementById('product-name').value = '';
    document.getElementById('product-price').value = '';
    // Reload products
    loadProducts();
  })
  .catch(error => {
    console.error('Error adding product:', error);
    showNotification('Error adding product. Please try again.');
  });
}

// Register customer
function registerCustomer() {
  const name = document.getElementById('customer-name').value;
  const email = document.getElementById('customer-email').value;
  const phone = document.getElementById('customer-phone').value;
  const address = document.getElementById('customer-address').value;
  const city = document.getElementById('customer-city').value;
  
  if (!name || !email) {
    alert('Please enter at least name and email');
    return;
  }
  
  fetch('/api/customers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, email, phone, address, city })
  })
  .then(response => response.json())
  .then(customer => {
    showNotification(`Customer ${customer.name} registered successfully!`);
    // Clear form
    document.getElementById('customer-name').value = '';
    document.getElementById('customer-email').value = '';
    document.getElementById('customer-phone').value = '';
    document.getElementById('customer-address').value = '';
    document.getElementById('customer-city').value = '';
  })
  .catch(error => {
    console.error('Error registering customer:', error);
    showNotification('Error registering customer. Please try again.');
  });
}

// Checkout (mock implementation)
function checkout() {
  if (cart.length === 0) {
    alert('Your cart is empty!');
    return;
  }
  
  const branch_id = document.getElementById('pickup-branch').value;
  const customer_email = document.getElementById('customer-email-checkout').value;
  
  if (!customer_email) {
    alert('Please enter your email address');
    return;
  }
  
  // In a real app, you would:
  // 1. Find or create customer
  // 2. Create order
  // 3. Process payment
  // 4. Send confirmation
  
  alert(`Thank you for your order! You will receive confirmation at ${customer_email}. Your items will be available for pickup at the selected branch.`);
  
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
  const customerSection = document.getElementById('customer-form');
  
  if (authSection) authSection.style.display = 'block';
  if (sellerPanel) sellerPanel.style.display = 'none';
  if (cartSection) cartSection.style.display = 'none';
  if (customerSection) customerSection.style.display = 'none';
}