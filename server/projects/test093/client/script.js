// Sample product data
const products = [
    {
        name: "Organic Granola",
        description: "Crunchy, naturally sweetened granola made with organic oats and nuts.",
        price: 9.99,
        image: "https://images.unsplash.com/photo-1517093702248-583e582eff2f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
        ingredients: "Organic oats, organic almonds, organic honey, organic coconut oil, organic cinnamon",
        nutrition: {
            calories: 140,
            fat: 7,
            carbs: 16,
            protein: 4
        }
    },
    {
        name: "Superfood Smoothie Mix",
        description: "Blend of antioxidant-rich berries and greens for a nutrient-packed smoothie.",
        price: 14.99,
        image: "https://images.unsplash.com/photo-1502741126161-b048400d085d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
        ingredients: "Organic blueberries, organic spinach, organic acai powder, organic chia seeds",
        nutrition: {
            calories: 60,
            fat: 2,
            carbs: 10,
            protein: 2
        }
    },
    {
        name: "Plant-Based Protein Bars",
        description: "Delicious, high-protein snack bars made from all-natural ingredients.",
        price: 24.99,
        image: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
        ingredients: "Organic dates, organic almonds, organic pea protein, organic cocoa powder",
        nutrition: {
            calories: 200,
            fat: 9,
            carbs: 22,
            protein: 12
        }
    }
];

// Function to create product cards
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card bg-white rounded-lg shadow-md overflow-hidden';
    card.innerHTML = `
        <img src="${product.image}" alt="${product.name}" class="w-full h-48 object-cover">
        <div class="p-4">
            <h3 class="font-serif text-xl mb-2">${product.name}</h3>
            <p class="text-gray-600 mb-4">${product.description}</p>
            <p class="font-bold mb-2">$${product.price.toFixed(2)}</p>
            <button class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Add to Cart</button>
            <button class="nutrition-toggle mt-2 text-blue-500 hover:text-blue-700">Nutrition Info</button>
            <div class="nutrition-info mt-2 text-sm">
                <p><strong>Ingredients:</strong> ${product.ingredients}</p>
                <p><strong>Nutrition:</strong> Calories: ${product.nutrition.calories}, Fat: ${product.nutrition.fat}g, Carbs: ${product.nutrition.carbs}g, Protein: ${product.nutrition.protein}g</p>
            </div>
        </div>
    `;
    return card;
}

// Populate featured products
const featuredProducts = document.getElementById('featured-products');
products.forEach(product => {
    featuredProducts.appendChild(createProductCard(product));
});

// Toggle nutrition info
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('nutrition-toggle')) {
        const nutritionInfo = e.target.nextElementSibling;
        nutritionInfo.classList.toggle('show');
    }
});

// Implement search functionality
// This is a placeholder for future implementation
function searchProducts(query) {
    console.log(`Searching for: ${query}`);
    // Implement search logic here
}

// Implement subscription management
// This is a placeholder for future implementation
function manageSubscription(action) {
    console.log(`Subscription action: ${action}`);
    // Implement subscription management logic here
}