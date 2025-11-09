
// let drinkId;
// let drinkName;



document.addEventListener("DOMContentLoaded", () => {

    if (document.getElementById("drinkNameTitle")) {
        setDrinkModificationPage();
    }

    // Check if we are on the Order Summary page
    if (document.getElementById("cartContainer")) {
        displayCart();
    }

    const drinkButtons = document.querySelectorAll(".drinkButton");
    drinkButtons.forEach(button => {
        button.addEventListener("click",setDrinkNameIDPrice)
    })

});

function setDrinkNameIDPrice(){
    const drinkId = this.dataset.drinkId;
    const drinkName = this.dataset.drinkName;
    const drinkPrice = this.dataset.drinkPrice;

    document.getElementById("drinkName").innerHTML= drinkName;
    document.getElementById("drinkID").innerHTML= drinkId;

    localStorage.setItem("drinkId", drinkId);
    localStorage.setItem("drinkName", drinkName);
    localStorage.setItem("drinkPrice", drinkPrice);

    window.location.href = "/customer/drinkModifications";
}


function setDrinkModificationPage(){
    // set Drink Title
    const drinkName = localStorage.getItem("drinkName");
    document.getElementById("drinkNameTitle").innerHTML = drinkName;

    // set Drink Price
    const drinkPrice = localStorage.getItem("drinkPrice");
    document.getElementById("drinkPrice").innerHTML = "$ "+ drinkPrice;   

    // set Drink Image
    const drinkId = localStorage.getItem("drinkId");
    const imgElement = document.getElementById("drinkImage");
    const index = parseInt(drinkId, 10);
    imgElement.src = img_array[index];
}

let quantity = 1;
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// Quantity Button Functions
document.getElementById("increaseQty").addEventListener("click", () => {
    quantity++;
    updateQuantityDisplay();
});

document.getElementById("decreaseQty").addEventListener("click", () => {
    if (quantity > 1) {
        quantity--;
        updateQuantityDisplay();
    }
});


document.getElementById("addToCartBtn").addEventListener("click", () => {

    const form = document.getElementById("drinkForm");
    const data = new FormData(form);

    const drinkId = localStorage.getItem("drinkId");
    const drinkName = localStorage.getItem("drinkName");
    let drinkPrice = parseFloat(localStorage.getItem("drinkPrice"));

    const toppings = data.get("toppings");
    const action = data.get("action");

    if (action == "Add" && toppings != null){
        drinkPrice += 0.75

    }
    
    // NOTE: toppings, action, equal null if nothing selected
    
   const drink = { 
        drinkId: drinkId,
        drinkName: drinkName,
        quantity: quantity,
        iceLevel: data.get("iceLevel"),
        sweetness: data.get("sweetness"),
        toppings: data.get("toppings"),
        action: data.get("action"),
        price: drinkPrice,
    };
    cart.push(drink);
    localStorage.setItem("cart", JSON.stringify(cart)); // local only stores strings. 
    window.location.href = "/customer/customerHome";
});


function updateQuantityDisplay() {
    document.getElementById("quantityDisplay").innerText = quantity;
}




// Order Summary
function displayCart() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const container = document.getElementById("cartContainer");
    
    // if empty
    if (cart.length === 0) {
        container.innerHTML = "<p>Your cart is empty!</p>";
        return;
    }

    // otherwise render
    cart.forEach((item, index) => {
        const div = document.createElement("div");
        div.innerHTML = `
            <h3>${item.drinkName}</h3>
            <p>Quantity: ${item.quantity}</p>
            <p>Ice level: ${item.iceLevel}</p>
            <p>Sweetness: ${item.sweetness}</p>
            <p>Topping: ${item.toppings ?? "None"}</p>
            <p>Action: ${item.action}</p>
            <button onclick="removeItem(${index})">Remove</button>
            <hr>
        `;
        container.appendChild(div);
    });
}

function removeItem(index) {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart.splice(index, 1);
    localStorage.setItem("cart", JSON.stringify(cart));
    location.reload();
}


// let cart = JSON.parse(localStorage.getItem("cart"));  -> converts string to object
// IDEAD: should price update when toppings is pressed?





           
