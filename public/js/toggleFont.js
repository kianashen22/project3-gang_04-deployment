function toggleFont() {
    const menuText = document.getElementById("menuContainer");
    const drinkMenuText = document.getElementById("drinkContainer");
    // select all modification buttons (may be multiple)
    const drinkModButtons = document.querySelectorAll(".drinkMod");

    const cartItems = document.querySelectorAll(".orders");

    if (menuText) menuText.classList.toggle("large-font");
    if (drinkMenuText) drinkMenuText.classList.toggle("large-font");

    if (drinkModButtons && drinkModButtons.length > 0) {
        drinkModButtons.forEach(btn => btn.classList.toggle('large-font'));
    }

    if (cartItems && cartItems.length > 0) {
        cartItems.forEach(btn => btn.classList.toggle('large-font'));
    }
}