



document.addEventListener("DOMContentLoaded", () => {

    // Speech to Text Assistant

    const emmaWelcomeMessage = "Howdy! <br> <br> " + 
                            "My name is Emma, your speech assistant! I'm here to help you place an order via your voice only! <br> <br>" +
                            "Whenever you're ready, just press the button below and we can get started! Thanks and Gig'em!";

    const kianaWelcomeMessage = "Howdy! <br> <br> " + 
                            "My name is Kiana, your speech assistant! I'm here to help you place an order via your voice only! <br> <br>" +
                            "Whenever you're ready, just press the button below and we can get started! Thanks and Gig'em!";

    const caitiWelcomeMessage = "Hi Friend! <br> <br> " + 
                            "My name is Caiti, your speech assistant! I'm here to help you place an order via your voice only! <br> <br>" +
                            "Whenever you're ready, just press the button below and we can get started! Thanks and Gig'em!";
                        
    const annaWelcomeMessage = "Howdy! <br> <br> " + 
                            "My name is Anna, your speech assistant! I'm here to help you place an order via your voice only! <br> <br>" +
                            "Whenever you're ready, just press the button below and we can get started! Thanks and Gig'em!";

    const julianWelcomeMessage = "Howdy! <br> <br> " + 
                            "My name is Julian, your speech assistant! I'm here to help you place an order via your voice only! <br> <br>" +
                            "Whenever you're ready, just press the button below and we can get started! Thanks and Gig'em!";

    const assistantImgArray =[
            ["/img/santa-head-anna.png", annaWelcomeMessage], 
            ["/img/santa-head-caiti.png", caitiWelcomeMessage], 
            ["/img/santa-head-emma.png",emmaWelcomeMessage],
            ["/img/santa-head-julian.png",julianWelcomeMessage], 
            ["/img/santa-head-kiana.png", kianaWelcomeMessage]
        ];

    const speechButton = document.getElementById("speechBtn");
    const assistantImg = document.getElementById("assistantImg");
    const speechBox = document.getElementsByClassName("speech-box")[0];
    const welcomeAssistantMessage = document.getElementById("welcomeAssistantMessage");


    let assignedAssistant = sessionStorage.getItem("assignedAssistant");
    let assignedAsstIndex = sessionStorage.getItem("assignedAsstIndex");

    if (assignedAssistant == null){
        // assistant image
        assignedAsstIndex = Math.floor(Math.random() * 5);
        sessionStorage.setItem("assignedAsstIndex", assignedAsstIndex);

        // assistant message
        assignedAssistant = assistantImgArray[assignedAsstIndex][0];  
        sessionStorage.setItem("assignedAssistant", assignedAssistant);
    }


    // Set Assistant Image
    assistantImg.src = assignedAssistant;

    // Type of messages
    if (welcomeAssistantMessage){
        const speechBoxMsg = welcomeAssistantMessage.querySelector("p");
        speechBoxMsg.innerHTML = assistantImgArray[assignedAsstIndex][1];   
    }


    
    let assistant = false;
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

});