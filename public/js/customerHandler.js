
// let drinkId;
// let drinkName;






document.addEventListener("DOMContentLoaded", () => {

    const allDropDownMenus = document.querySelectorAll(".dropdown-content");
    allDropDownMenus.forEach(dropdown => {
        dropdown.style.display = "none"; 
    })
    
    // ALL Tab is default open screen drop down
    
    const continueBtn = document.getElementById("continueButton");
    if (continueBtn) {
        continueBtn.addEventListener("click", () => {
            window.location.href = "/customer/signIn";
        });
    }

    const drinkButtons = document.querySelectorAll(".drinkButton");
    drinkButtons.forEach(button => {
        button.addEventListener("click",setDrinkNameIDPrice)
    })

});

// ALL DROP DOWN MENU
document.getElementById("all").addEventListener("click", function(){
    const allDropDownMenus = document.querySelectorAll(".dropdown-content");
    allDropDownMenus.forEach(dropdown => {
        dropdown.style.display = "none"; 
    })

    const allContainer = document.querySelector(".allDropDown");
    const dropdownContent = allContainer.querySelector(".dropdown-content");
    dropdownContent.style.display = "block";
});


// FRESH BREW DROP DOWN MENU
document.getElementById("freshBrew").addEventListener("click", function(){
    const allDropDownMenus = document.querySelectorAll(".dropdown-content");
    allDropDownMenus.forEach(dropdown => {
        dropdown.style.display = "none"; 
    })

    const freshBrewContainer = document.querySelector(".freshBrewDropDown");
    const dropdownContent = freshBrewContainer.querySelector(".dropdown-content");
    dropdownContent.style.display = "block";
});

// FRUIT TEA DROP DOWN MENU
document.getElementById("fruitTea").addEventListener("click", function(){
    const allDropDownMenus = document.querySelectorAll(".dropdown-content");
    allDropDownMenus.forEach(dropdown => {
        dropdown.style.display = "none"; 
    })

    const fruitTeaContainer = document.querySelector(".fruitTeaDropDown");
    const dropdownContent = fruitTeaContainer.querySelector(".dropdown-content");
    dropdownContent.style.display = "block";
});

// ICE BLENDED DROP DOWN MENU
document.getElementById("iceBlended").addEventListener("click", function(){
    const allDropDownMenus = document.querySelectorAll(".dropdown-content");
    allDropDownMenus.forEach(dropdown => {
        dropdown.style.display = "none"; 
    })

    const iceBlendedContainer = document.querySelector(".iceBlendDropDown");
    const dropdownContent = iceBlendedContainer.querySelector(".dropdown-content");
    dropdownContent.style.display = "block";
});

// MILK TEA DROP DOWN MENU
document.getElementById("milkTea").addEventListener("click", function(){
    const allDropDownMenus = document.querySelectorAll(".dropdown-content");
    allDropDownMenus.forEach(dropdown => {
        dropdown.style.display = "none"; 
    })

    const milkTeaContainer = document.querySelector(".milkTeaDropDown");
    const dropdownContent = milkTeaContainer.querySelector(".dropdown-content");
    dropdownContent.style.display = "block";
});

// SEARCH DROP DOWN MENU
document.getElementById("search").addEventListener("click", function(){
    const allDropDownMenus = document.querySelectorAll(".dropdown-content");
    allDropDownMenus.forEach(dropdown => {
        dropdown.style.display = "none"; 
    })

    const searchContainer = document.querySelector(".searchDropDown");
    const dropdownContent = searchContainer.querySelector(".dropdown-content");
    dropdownContent.style.display = "block";
});


function setDrinkNameIDPrice(){
    const drinkId = this.dataset.drinkId;
    const drinkName = this.dataset.drinkName;
    const drinkPrice = this.dataset.drinkPrice;

    // document.getElementById("drinkName").innerHTML= drinkName;
    // document.getElementById("drinkID").innerHTML= drinkId;

    localStorage.setItem("drinkId", drinkId);
    localStorage.setItem("drinkName", drinkName);
    localStorage.setItem("drinkPrice", drinkPrice);
    
    const url = "/customer/" + drinkId + "/customize"
    window.location.href = url;
}




// let cart = JSON.parse(localStorage.getItem("cart"));  -> converts string to object
// IDEAD: should price update when toppings is pressed?





           
