document.addEventListener("DOMContentLoaded", function () {
    let allProducts = [];  // Tableau pour stocker les produits complets
    const category = "chaussure"; // Change selon la page : "chaussure" ou "accessoire"
    // Récupérer les produits depuis l'API
    fetch(`http://localhost:5000/produits/${category}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erreur lors de la récupération des produits : ${text}`);            }
            return response.json();
        })
        .then(data => {
            console.log("Données reçues :", data); // Vérifie que type est bien présent

            allProducts = data.map(product => ({
                nom: product.nom,
                prix: parseFloat(product.prix), // Assurer que prix est un nombre
                type: product.type || "autre", // Si type est manquant, on met "autre"
                image: product.image
            }));

            displayProducts(allProducts); // Afficher les produits au chargement
        })
        .catch(error => console.error("Erreur lors du chargement des produits :", error));

    // Fonction pour filtrer les produits
    const filterPrix = document.getElementById("filter-price");
    const filterType = document.getElementById("filter-category");

    function filterProducts() {
        let filteredProducts = [...allProducts]; // Créer une copie du tableau des produits

        // Filtrer par catégorie (type)
        const selectedType = filterType.value;
        if (selectedType !== "all") {
            filteredProducts = filteredProducts.filter(product => product.type.toLowerCase() === selectedType.toLowerCase());
        }

        // Trier par prix
        const selectedPrixOrder = filterPrix.value;
        if (selectedPrixOrder === "asc") {
            filteredProducts.sort((a, b) => a.prix - b.prix);
        } else if (selectedPrixOrder === "desc") {
            filteredProducts.sort((a, b) => b.prix - a.prix);
        }

        // Afficher les produits filtrés
        displayProducts(filteredProducts);
    }

    // Fonction pour afficher les produits
    function displayProducts(products) {
        const productList = document.getElementById("product-list");
        productList.innerHTML = ""; // Réinitialiser la liste de produits avant d'afficher les filtrés
        var i=0;
        products.forEach(product => {
            if (product.nom && product.prix && product.image) {
                i+=1
                const productCard = document.createElement("div");
                productCard.classList.add("product-item");
                productCard.innerHTML = `
                    <a href="product.html?image=${product.image}&nom=${product.nom}&prix=${product.prix}">
                        <img src="http://localhost:5500${product.image}" alt="${product.nom}_Chez_Koundoul_Shop">
                    </a>
                    <p class="product-name">${product.nom}</p>
                    <p class="product-price">${product.prix} FCFA</p>    
                `;
                productList.appendChild(productCard);
            }
        });
        document.getElementById("nombre-de-produit").innerHTML= "<b>"+i+"<b>" +"/" +"<b>"+i+"<b>"
    }
    
    // Initialiser les filtres
    function initializeFilters() {
        // Appliquer les filtres
        filterPrix.addEventListener("change", filterProducts);
        filterType.addEventListener("change", filterProducts);
        
        // Appeler initialement pour afficher tous les produits sans filtre
        filterProducts();
    }
    initializeFilters();
});
