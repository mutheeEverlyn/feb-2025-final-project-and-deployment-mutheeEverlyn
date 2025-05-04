document.addEventListener("DOMContentLoaded", () => {
    const productList = document.getElementById("product-list");
    const categorySelect = document.getElementById("category");
    const searchInput = document.getElementById("search");
    const searchForm = document.querySelector(".search_box");
    let category_nav_list = document.querySelector(".category_nav_list");
    let allProducts = [];
    let favouriteItems = JSON.parse(localStorage.getItem("favourites")) || [];

    // Load products
    fetch('products.json')
        .then(response => {
            if (!response.ok) throw new Error("Failed to fetch products.json");
            return response.json();
        })
        .then(data => {
            allProducts = data;
            localStorage.setItem('products', JSON.stringify(data));
            renderProducts(data); // Initial render
            setupFilterListeners();
            setupSearchListeners();
            updateFavouritesCount();
            updateCart();
        })
        .catch(error => console.error("Error fetching products:", error));

    // Render products function
    function renderProducts(products) {
        productList.innerHTML = "";
        if (products.length === 0) {
            productList.innerHTML = `<div class="no-products">No products found matching your criteria</div>`;
            return;
        }

        products.forEach(product => {
            // Handle inconsistent property names with fallbacks
            const img = product.img || product.image || "img/placeholder.png";
            const category = product.category || product.catetory || "Uncategorized";
    
            productList.innerHTML += `
                <div class="product-card">
                    <img src="${img}" alt="${product.name || 'Product'}" />
                    <h3>${product.name || 'Unnamed Product'}</h3>
                    <p>Category: ${category}</p>
                    <div class="price-container">
                        <span class="price">$${product.price || '0'}</span>
                        ${product.old_price ? `<span class="old_price">$${product.old_price}</span>` : ""}
                    </div>
                    <div class="actions">
                        <button class="btn_add_cart ${isInCart(product.id) ? 'active' : ''}" data-id="${product.id}">
                            <i class="fa-solid fa-cart-shopping"></i> ${isInCart(product.id) ? 'Added' : 'Add to cart'}
                        </button>
                        <button class="btn_favourite ${isInFavorites(product.id) ? 'active' : ''}" data-id="${product.id}">
                            <i class="fa-${isInFavorites(product.id) ? 'solid' : 'regular'} fa-heart"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        // Attach button events after render
        attachProductButtonEvents(products);
    }

    // Attach button events to product cards
    function attachProductButtonEvents(products) {
        document.querySelectorAll(".btn_add_cart").forEach(button => {
            button.addEventListener("click", () => {
                const productId = button.getAttribute('data-id');
                const selectedProduct = products.find(p => p.id == productId);
                if (selectedProduct) {
                    addToCart(selectedProduct);
                }
            });
        });

        document.querySelectorAll(".btn_favourite").forEach(button => {
            button.addEventListener("click", () => {
                const id = button.getAttribute("data-id");
                handleFavouriteClick(id);
            });
        });
    }

    // Setup filter event listeners
    function setupFilterListeners() {
        // For dropdown select box
        if (categorySelect) {
            categorySelect.addEventListener("change", () => {
                const selectedCategory = categorySelect.options[categorySelect.selectedIndex].getAttribute("data-category")?.toLowerCase();
                filterProductsByCategory(selectedCategory);
            });
        }

        // For category sidebar links
        if (category_nav_list) {
            const categoryItems = document.querySelectorAll(".category_nav_list a");
            categoryItems.forEach(item => {
                item.addEventListener("click", (e) => {
                    e.preventDefault();
                    const selectedCategory = item.dataset.category?.toLowerCase();
                    filterProductsByCategory(selectedCategory);
                    // Also update the dropdown to match
                    if (categorySelect) {
                        Array.from(categorySelect.options).forEach(option => {
                            if (option.getAttribute("data-category")?.toLowerCase() === selectedCategory) {
                                categorySelect.selectedIndex = option.index;
                            }
                        });
                    }
                    // Close category list if mobile
                    if (category_nav_list) {
                        category_nav_list.classList.remove("active");
                    }
                });
            });
        }
    }

    // Filter products by category
    function filterProductsByCategory(category) {
        if (!category || category === "") {
            renderProducts(allProducts); // Show all products
        } else {
            const filtered = allProducts.filter(p => 
                (p.category || p.catetory || "").toLowerCase() === category
            );
            renderProducts(filtered);
        }
    }

    // Setup search listeners
    function setupSearchListeners() {
        // For search input
        if (searchInput) {
            searchInput.addEventListener("input", () => {
                const query = searchInput.value.toLowerCase().trim();
                filterProductsBySearch(query);
            });
        }

        // For search form submit
        if (searchForm) {
            searchForm.addEventListener("submit", (e) => {
                e.preventDefault(); // Prevent page reload
                const query = searchInput.value.toLowerCase().trim();
                filterProductsBySearch(query);
            });
        }
    }

    // Filter products by search
    function filterProductsBySearch(query) {
        if (!query) {
            renderProducts(allProducts); // Show all products
        } else {
            const filtered = allProducts.filter(p => 
                (p.name || "").toLowerCase().includes(query) || 
                (p.category || p.catetory || "").toLowerCase().includes(query)
            );
            renderProducts(filtered);
        }
    }

    // Combined search and category filter
    function applyFilters() {
        const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : "";
        const selectedCategory = categorySelect ? 
            categorySelect.options[categorySelect.selectedIndex].getAttribute("data-category")?.toLowerCase() : "";
        
        let filtered = allProducts;
        
        // Apply category filter if selected
        if (selectedCategory && selectedCategory !== "") {
            filtered = filtered.filter(p => 
                (p.category || p.catetory || "").toLowerCase() === selectedCategory
            );
        }
        
        // Apply search filter if entered
        if (searchQuery && searchQuery !== "") {
            filtered = filtered.filter(p => 
                (p.name || "").toLowerCase().includes(searchQuery) || 
                (p.category || p.catetory || "").toLowerCase().includes(searchQuery)
            );
        }
        
        renderProducts(filtered);
    }

    // Helper functions to check if an item is in cart or favorites
    function isInCart(productId) {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        return cart.some(item => item.id == productId);
    }

    function isInFavorites(productId) {
        const favorites = JSON.parse(localStorage.getItem('favourites')) || [];
        return favorites.some(item => item.id == productId);
    }

    // Cart functionality
    function addToCart(product) {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        const existing = cart.find(item => item.id === product.id);
        
        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        updateCart();
        updateCartButtonState(product.id);
    }

    function updateCartButtonState(productId) {
        const cartButtons = document.querySelectorAll(`.btn_add_cart[data-id="${productId}"]`);
        const isProductInCart = isInCart(productId);
        
        cartButtons.forEach(button => {
            if (isProductInCart) {
                button.classList.add('active');
                button.innerHTML = `<i class="fa-solid fa-cart-shopping"></i> Added`;
            } else {
                button.classList.remove('active');
                button.innerHTML = `<i class="fa-solid fa-cart-shopping"></i> Add to cart`;
            }
        });
    }

    function updateCart() {
        const cartItemsContainer = document.getElementById("cart_items");
        if (!cartItemsContainer) return;
        
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        let total_Price = 0;
        let total_count = 0;

        cartItemsContainer.innerHTML = "";
        
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = "<p class='empty-cart'>Your cart is empty</p>";
        } else {
            cart.forEach((item, index) => {
                let total_Price_item = item.price * item.quantity;
                total_Price += total_Price_item;
                total_count += item.quantity;

                cartItemsContainer.innerHTML += `
                    <div class="item_cart">
                        <img src="${item.img || item.image || 'img/placeholder.png'}" alt="">
                        <div class="content">
                            <h4>${item.name}</h4>
                            <p class="price_cart">$${total_Price_item}</p>
                            <div class="quantity_control">
                                <button class="decrease_quantity" data-index=${index}>-</button>
                                <span class="quantity">${item.quantity}</span>
                                <button class="Increase_quantity" data-index=${index}>+</button>
                            </div>
                        </div>
                        <button class="delete_item" data-index="${index}"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                `;
            });
        }

        // Update cart totals
        document.querySelectorAll('.price_cart_total').forEach(el => el.innerHTML = `$ ${total_Price}`);
        document.querySelectorAll('.Count_item_cart').forEach(el => el.innerHTML = total_count);
        document.querySelectorAll('.count_item_header').forEach(el => el.innerHTML = total_count);

        // Attach cart item events
        attachCartItemEvents();
    }

    function attachCartItemEvents() {
        document.querySelectorAll(".Increase_quantity").forEach(button => {
            button.addEventListener("click", () => {
                const itemIndex = button.getAttribute("data-index");
                increaseQuantity(itemIndex);
            });
        });

        document.querySelectorAll(".decrease_quantity").forEach(button => {
            button.addEventListener("click", () => {
                const itemIndex = button.getAttribute("data-index");
                decreaseQuantity(itemIndex);
            });
        });

        document.querySelectorAll('.delete_item').forEach(button => {
            button.addEventListener('click', () => {
                const itemIndex = button.getAttribute('data-index');
                removeFromCart(itemIndex);
            });
        });
    }

    function increaseQuantity(index) {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        cart[index].quantity += 1;
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCart();
    }

    function decreaseQuantity(index) {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        if (cart[index].quantity > 1) {
            cart[index].quantity -= 1;
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCart();
    }

    function removeFromCart(index) {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const removedProduct = cart.splice(index, 1)[0];
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCart();
        
        if (removedProduct) {
            updateCartButtonState(removedProduct.id);
        }
    }

    // Favorites functionality
    function handleFavouriteClick(id) {
        const selectedProduct = allProducts.find(item => item.id == id);
        if (!selectedProduct) return;
        
        const favouriteButtons = document.querySelectorAll(`.btn_favourite[data-id="${id}"]`);
        
        if (!isInFavorites(id)) {
            // Add to favorites
            favouriteItems.push(selectedProduct);
            favouriteButtons.forEach(btn => {
                btn.innerHTML = `<i class="fa-solid fa-heart"></i>`;
                btn.classList.add('active');
            });
        } else {
            // Remove from favorites
            favouriteItems = favouriteItems.filter(item => item.id !== selectedProduct.id);
            favouriteButtons.forEach(btn => {
                btn.innerHTML = `<i class="fa-regular fa-heart"></i>`;
                btn.classList.remove('active');
            });
        }

        localStorage.setItem("favourites", JSON.stringify(favouriteItems));
        updateFavouritesCount();
    }

    function updateFavouritesCount() {
        const count = favouriteItems.length || 0;
        document.querySelectorAll(".count_favourite").forEach(el => el.textContent = count);
    }

    // UI toggle functions
    if (document.querySelector(".open_menu")) {
        document.querySelector(".open_menu").addEventListener("click", open_Menu);
    }
    
    if (document.querySelector(".close_menu")) {
        document.querySelector(".close_menu").addEventListener("click", close_Menu);
    }
    
    function open_Menu() {
        const top_nav = document.querySelector(".top-nav");
        const login_btns = document.querySelector(".login_signup");
        const nav_links = document.querySelector(".nav_links");
        
        if (top_nav) top_nav.classList.add("active");
        if (login_btns) login_btns.classList.add("active");
        if (nav_links) nav_links.classList.add("active");
    }

    function close_Menu() {
        const top_nav = document.querySelector(".top-nav");
        const login_btns = document.querySelector(".login_signup");
        const nav_links = document.querySelector(".nav_links");
        
        if (top_nav) top_nav.classList.remove("active");
        if (login_btns) login_btns.classList.remove("active");
        if (nav_links) nav_links.classList.remove("active");
    }

    // Cart toggle
    const cartToggleElements = document.querySelectorAll("[onclick='open_close_cart()']");
    cartToggleElements.forEach(element => {
        element.addEventListener("click", open_close_cart);
    });

    function open_close_cart() {
        const cart = document.querySelector('.cart');
        if (cart) cart.classList.toggle("active");
    }

    // Category toggle function
    if (document.querySelector("[onclick='Open_Categ_list()']")) {
        document.querySelector("[onclick='Open_Categ_list()']").addEventListener("click", Open_Categ_list);
    }

    function Open_Categ_list() {
        if (category_nav_list) {
            category_nav_list.classList.toggle("active");
        }
    }
});