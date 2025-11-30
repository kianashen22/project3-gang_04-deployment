
// // let drinkId;
// // let drinkName;


document.addEventListener("DOMContentLoaded", () => {

    // ANIMATIONS
    let numSanta = 1;
    const kiana = "/img/santa-kiana-gif.gif";
    const julian = "/img/santa-julian-gif.gif";
    const santaArray = [kiana, julian];
    const currentSanta = document.getElementById("santaAnimation");

    setInterval(changeSanta,7000);

    function changeSanta(){
        currentSanta.src = santaArray[numSanta]; 
        
        if (numSanta == santaArray.length - 1 ){
            numSanta = 0;
        }
        else{    
            numSanta++;
        }
    } 

    // CUSTOMER MENU 
    const allDropDownMenus = document.querySelectorAll(".dropdown-content");
    allDropDownMenus.forEach(dropdown => {
        dropdown.style.display = "none"; 
    })
        
    // ALL Tab is default open screen drop down
    const allContainer = document.querySelector(".allDropDown");
    const dropdownContent = allContainer.querySelector(".dropdown-content");
    dropdownContent.style.display = "flex";
    const allBtn = document.getElementById("all");
    allBtn.style.backgroundColor = " #FFFEF9";
    allBtn.style.color = "#68A691";

    
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
    // reset
    const allButtons = document.querySelectorAll(".drinkCategoryButton");
    allButtons.forEach(btn => {
        btn.style.backgroundColor = "#CBDFCD";  
        btn.style.color = "black"; 
    });

    const allDropDownMenus = document.querySelectorAll(".dropdown-content");
    allDropDownMenus.forEach(dropdown => {
        dropdown.style.display = "none"; 
    })

    //style
    const allBtn = document.getElementById("all");
    allBtn.style.backgroundColor = " #FFFEF9";
    allBtn.style.color = "#68A691";
    const allContainer = document.querySelector(".allDropDown");
    const dropdownContent = allContainer.querySelector(".dropdown-content");
    dropdownContent.style.display = "flex";
});


// FRESH BREW DROP DOWN MENU
document.getElementById("freshBrew").addEventListener("click", function(){

    //reset
    const allButtons = document.querySelectorAll(".drinkCategoryButton");
    allButtons.forEach(btn => {
        btn.style.backgroundColor = "#CBDFCD";  
        btn.style.color = "black";  
    });

    const allDropDownMenus = document.querySelectorAll(".dropdown-content");
    allDropDownMenus.forEach(dropdown => {
        dropdown.style.display = "none"; 
    })

    //style
    const freshBtn = document.getElementById("freshBrew");
    freshBtn.style.backgroundColor = " #FFFEF9";
    freshBtn.style.color = "#68A691";
    const freshBrewContainer = document.querySelector(".freshBrewDropDown");
    const dropdownContent = freshBrewContainer.querySelector(".dropdown-content");
    dropdownContent.style.display = "flex";
});

// FRUIT TEA DROP DOWN MENU
document.getElementById("fruitTea").addEventListener("click", function(){
    //reset
    const allButtons = document.querySelectorAll(".drinkCategoryButton");
    allButtons.forEach(btn => {
        btn.style.backgroundColor = "#CBDFCD";   
        btn.style.color = "black"; 
    });

    const allDropDownMenus = document.querySelectorAll(".dropdown-content");
    allDropDownMenus.forEach(dropdown => {
        dropdown.style.display = "none"; 
    })

    //style
    const fruitTeaBtn = document.getElementById("fruitTea");
    fruitTeaBtn.style.backgroundColor = " #FFFEF9";
    fruitTeaBtn.style.color = "#68A691";
    const fruitTeaContainer = document.querySelector(".fruitTeaDropDown");
    const dropdownContent = fruitTeaContainer.querySelector(".dropdown-content");
    dropdownContent.style.display = "flex";
});

// ICE BLENDED DROP DOWN MENU
document.getElementById("iceBlended").addEventListener("click", function(){
    //reset
    const allButtons = document.querySelectorAll(".drinkCategoryButton");
    allButtons.forEach(btn => {
        btn.style.backgroundColor = "#CBDFCD";  
        btn.style.color = "black";  
    });

    const allDropDownMenus = document.querySelectorAll(".dropdown-content");
    allDropDownMenus.forEach(dropdown => {
        dropdown.style.display = "none"; 
    })

    //style
    const iceBlendBtn = document.getElementById("iceBlended");
    iceBlendBtn.style.backgroundColor = " #FFFEF9";
    iceBlendBtn.style.color = "#68A691";
    const iceBlendedContainer = document.querySelector(".iceBlendDropDown");
    const dropdownContent = iceBlendedContainer.querySelector(".dropdown-content");
    dropdownContent.style.display = "flex";
});

// MILK TEA DROP DOWN MENU
document.getElementById("milkTea").addEventListener("click", function(){
    // reset 
    const allButtons = document.querySelectorAll(".drinkCategoryButton");
    allButtons.forEach(btn => {
        btn.style.backgroundColor = "#CBDFCD"; 
        btn.style.color = "black";   
    });

    const allDropDownMenus = document.querySelectorAll(".dropdown-content");
    allDropDownMenus.forEach(dropdown => {
        dropdown.style.display = "none"; 
    })

    // style
    const milkTeaBtn = document.getElementById("milkTea");
    milkTeaBtn.style.backgroundColor = " #FFFEF9";
    milkTeaBtn.style.color = "#68A691";
    const milkTeaContainer = document.querySelector(".milkTeaDropDown");
    const dropdownContent = milkTeaContainer.querySelector(".dropdown-content");
    dropdownContent.style.display = "flex";
});

// SEARCH DROP DOWN MENU
document.getElementById("search").addEventListener("click", function(){
    //reset
    const allButtons = document.querySelectorAll(".drinkCategoryButton");
    allButtons.forEach(btn => {
        btn.style.backgroundColor = "#CBDFCD";   
        btn.style.color = "black"; 
    });

    const allDropDownMenus = document.querySelectorAll(".dropdown-content");
    allDropDownMenus.forEach(dropdown => {
        dropdown.style.display = "none"; 
    })

    // style
    const searchBtn = document.getElementById("search");
    searchBtn.style.backgroundColor = " #FFFEF9";
    searchBtn.style.color = "#68A691";
    const searchContainer = document.querySelector(".searchDropDown");
    const dropdownContent = searchContainer.querySelector(".dropdown-content");
    dropdownContent.style.display = "flex";  // CHANGE THIS DEPENDING ON DISPLAY OF SEARCH DROP DOWN!!
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

// ANIMATION FUNCTIONS




//const currentSanta = document.getElementById("santaAnimation");


// function changeSanta(){


//     const kiana = "/img/santa-kiana-gif.gif";
//     const julian = "/img/santa-julian-gif.gif";

//     const santaArray = [kiana, julian];

//     const currentSanta = document.getElementById("santaAnimation");


//     currentSanta.src = santaArray[numSanta]; 

// } 
     

    // if (numSanta == santaArray.length - 1 ){
    //     numSanta = 0;
    // }
    // else{    
    //     numSanta++;
    // }

