
// let drinkId;
// let drinkName;



document.addEventListener("DOMContentLoaded", () => {

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

function setDrinkNameIDPrice(){
    const drinkId = this.dataset.drinkId;
    const drinkName = this.dataset.drinkName;
    const drinkPrice = this.dataset.drinkPrice;

    document.getElementById("drinkName").innerHTML= drinkName;
    document.getElementById("drinkID").innerHTML= drinkId;

    localStorage.setItem("drinkId", drinkId);
    localStorage.setItem("drinkName", drinkName);
    localStorage.setItem("drinkPrice", drinkPrice);
    
    const url = "/customer/" + drinkId + "/customize"
    window.location.href = url;
}








// let cart = JSON.parse(localStorage.getItem("cart"));  -> converts string to object
// IDEAD: should price update when toppings is pressed?





           
