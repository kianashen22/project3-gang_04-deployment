


document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM loaded, attaching event listeners"); // test

    const buttons = document.querySelectorAll(".drinkButton");
    console.log("Found buttons:", buttons.length); // test

    buttons.forEach(button => {
        button.addEventListener("click", function() {
            const drinkId = this.dataset.drinkId;
            const drinkName = this.dataset.drinkName;
            console.log("DrinkID:", drinkId, "Drink Name:", drinkName);
        });
    });
});
