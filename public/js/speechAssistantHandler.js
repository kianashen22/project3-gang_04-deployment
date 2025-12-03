

let usingAssistant = false;
// localStorage.setItem("usingAssistant", usingAssistant);


document.addEventListener("DOMContentLoaded", () => {


    // Speech to Text Assistant
    // TODO: use this logic to create the speech to text functionality
    const speechButton = document.getElementById("speechBtn");
    const assistantImg = document.getElementById("assistantImg");
    const speechBox = document.getElementById("welcomeAssistantMessage");
    const speechBoxMsg = speechBox.querySelector("p");

    const emmaMessage = "Howdy! <br> <br> " + 
                            "My name is Emma, your speech assistant! I'm here to help you place an order via your voice only! <br> <br>" +
                            "Whenever you're ready, just press the button below and we can get started! Thanks and Gig'em!";

    const kianaMessage = "Howdy! <br> <br> " + 
                            "My name is Kiana, your speech assistant! I'm here to help you place an order via your voice only! <br> <br>" +
                            "Whenever you're ready, just press the button below and we can get started! Thanks and Gig'em!";

    const caitiMessage = "Hi Friend! <br> <br> " + 
                            "My name is Caiti, your speech assistant! I'm here to help you place an order via your voice only! <br> <br>" +
                            "Whenever you're ready, just press the button below and we can get started! Thanks and Gig'em!";
                        
    const annaMessage = "Howdy! <br> <br> " + 
                            "My name is Anna, your speech assistant! I'm here to help you place an order via your voice only! <br> <br>" +
                            "Whenever you're ready, just press the button below and we can get started! Thanks and Gig'em!";

    const julianMessage = "Howdy! <br> <br> " + 
                            "My name is Julian, your speech assistant! I'm here to help you place an order via your voice only! <br> <br>" +
                            "Whenever you're ready, just press the button below and we can get started! Thanks and Gig'em!";

    const assistantImgArray =[
            ["/img/santa-head-anna.png", annaMessage], 
            ["/img/santa-head-caiti.png", caitiMessage], 
            ["/img/santa-head-emma.png",emmaMessage],
            ["/img/santa-head-julian.png",julianMessage], 
            ["/img/santa-head-kiana.png", kianaMessage]
        ];


    /*
    TODO: Create an if statement to check if page needs to be pre-loaded with the assistant
    Logic -> if red button from home screen is pressed. Create an event for that
                Store current assistant in local storage so that it can be retrieved when the red button redirects page 
                to menu board so user can order
                

    */

    usingAssistant = localStorage.getItem(usingAssistant);
    // runs only when values are NOT NULL
    if (usingAssistant == "false"){

        const randomAsst = Math.floor(Math.random() * 5);
        let currentAsst = assistantImgArray[randomAsst][0];  // TODO: store this in local storage, set a variable to check if the assistnant has already been set

        // store in local storage so assigned assistant can persist
        localStorage.setItem("assignedAssistant", currentAsst);

        let assistant = false;

        assistantImg.src = currentAsst;
        speechBoxMsg.innerHTML = assistantImgArray[randomAsst][1];

        speechButton.addEventListener("click", () =>{
        assistant = !assistant;
            if (assistant == true){
                assistantImg.style.display= "block";
                speechBox.style.display = "block";
            }
            else{
                assistantImg.style.display= "none";
                speechBox.style.display = "none";
            }
        });


        const usingSpeechAsst = document.getElementById("speechAssistantStartBtn");
        usingSpeechAsst.addEventListener("click", function(){
            localStorage.setItem("usingAssistant", "true");
        });
    }
    else{
        assistantImg.src = localStorage.getItem("assignedAssistant")
        assistantImg.style.display= "block";

    }
});