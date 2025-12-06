
document.addEventListener("DOMContentLoaded", () => {

    const assistantImg = document.getElementById("assistantImgMenu");

    // Set Assistant Image
    const assignedAssistant = sessionStorage.getItem("assignedAssistant");
    if (assistantImg && assignedAssistant) {
        assistantImg.src = assignedAssistant;
        assistantImg.style.display = "block";
    }

    const startButton = document.getElementById("startButton");
    const stopButton = document.getElementById("endButton");
    const audioElement = document.getElementById('audioPlayback');



    const getStartedMessage = document.getElementById("getStartedMessage");
    const confirmationBox = document.getElementById("orderConfirmationBox");
    const orderDetailsDiv = document.getElementById("parsedOrderDetails");
    const orderSummaryDiv = document.getElementById("orderSummary");
    const confirmButton = document.getElementById("confirmOrderButton");
    const cancelButton = document.getElementById("cancelOrderButton");
    const loadingContainer = document.getElementById("loadingContainer");


    let mediaRecorder;
    let audioChunks = [];
    let audioStream;
    let currentOrderData = null; 

    const tax = 0.0825;
    const toppingsPrice = 0.75;

    let drinkPrice = 0;
    let subtotal = 0;
    let orderTax = 0;
    let totalPrice = 0;

    // Varibale used to keep order recording looping, until user confirms order
    let orderComplete = false;

    confirmationBox.style.display = "none";

    // ------------- Reset Page
    const resetUI = (message) => {
        confirmationBox.style.display = "none";
        getStartedMessage.style.display = "block";
        
        startButton.disabled = false;
        stopButton.disabled = true; // Ensure stop is disabled
        
        orderDetailsDiv.innerHTML = "";
        orderSummaryDiv.innerHTML = "";
        currentOrderData = null;
        alert(message); 
    };


    //START RECORDING 
    startButton.addEventListener("click", async () => {
        handleRecording();

    });

    // STOP RECORDING 
    stopButton.addEventListener("click", () => {
        loadingContainer.style.display = "flex";

        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            audioStream.getTracks().forEach(track => track.stop());
        }
    });


    // CONFIRM BUTTON LISTENER (Sends final, cleaned order back for database save)
    confirmButton.addEventListener("click", async () => {
        confirmButtonSendToDB();
    });

    // CANCEL BUTTON LISTENER
    cancelButton.addEventListener("click", () => {
        resetUI("Order cancelled. Please record again.");
        console.log("order cancelled")
    });



// ----------     FUNCTIONS ---------- 


    // RECORDING FUNCTION
    async function handleRecording(){
        audioChunks = [];
        try {
            audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(audioStream);

            mediaRecorder.ondataavailable = event => {
                audioChunks.push(event.data);
            };
            

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                
                const formData = new FormData();
                formData.append('audio', audioBlob, 'recording.webm');

                // SEND TO BACKEND
                const response = await fetch('/api/upload-audio', {
                    method: 'POST',
                    body: formData
                });

                
                // RESPONSE (display to front end)
                const data = await response.json();
                console.log("Server replied:", data);

                const audioUrl = URL.createObjectURL(audioBlob);
                audioElement.src = audioUrl;
                
                
                // DISPLAY ORDER DETAILS
                if (data.parsedOrder && data.parsedOrder.orders && data.parsedOrder.orders.length > 0) {
                    
                    // Get drink orders from json 
                    currentOrderData = data.parsedOrder;

                    //Turn on confirm button
                    confirmButton.disabled = false;

                    confirmationBox.style.display = "block"; 
                    confirmationBox.scrollIntoView({ behavior: "smooth", block: "center" });

                    

                    // ORDER DETAILS
                    let itemsHtml = `<p><strong>Transcription:</strong> <em>${data.transcription}</em></p><hr>`;
                    itemsHtml += `<table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
                                    <tr>
                                        <th style="text-align: left; padding: 5px 0;">Item</th>
                                        <th style="text-align: right; padding: 5px 0;">Qty</th>
                                        <th style="text-align: right; padding: 5px 0;">Price</th>
                                    </tr>`;

                    // get each drink order
                    currentOrderData = data.parsedOrder; 

                    currentOrderData.orders.forEach(item => {
                        if (item.valid == "false"){
                            itemsHtml += `<p><strong>Could Not Understand <br> Please Press the Cancel Button <br> to Try Again</strong></p>`
                            orderDetailsDiv.innerHTML = itemsHtml;
                            confirmButton.disabled = true;
                        }
                        else{
                       // SET DRINK PRICE
                        drinkPrice = item.drinkPrice;

                        // Get Subtotal
                        subtotal += item.drinkPrice * item.quantity;

                        // check for ADDED TOPPINGS
                        if (item.toppings[0] != "no toppings"){
                            subtotal += toppingsPrice * item.toppings.length;
                            drinkPrice += toppingsPrice * item.toppings.length;
                        }

                        // Join toppings array into string
                        let toppingsStr = null;
                        if (item.toppings[0] !== "no toppings") {
                            toppingsStr = item.toppings
                                .map(topping => `${topping} (+$${toppingsPrice.toFixed(2)})`)
                                .join(', ');
                        }
                        else{
                            toppingsStr = "no toppings";
                        }

                        const modifications = [
                            item.size,
                            item.sweetnessLevel,
                            item.iceLevel,
                            toppingsStr
                        ].filter(val => val && val.trim() !== "" && val !== "null" && val !== "None").join(' | ');

                        itemsHtml += `<tr style="border-top: 1px dashed #ddd;">
                                        <td style="text-align: left; padding-right: 10px; padding-top: 5px;">
                                            <strong>${item.drink}</strong>
                                            <div style="font-size: 0.8em; color: #555;">${modifications || "Standard"}</div>
                                        </td>
                                        <td style="text-align: right; padding-top: 5px;">${item.quantity}</td>
                                        <td style="text-align: right; padding-top: 5px;">$${drinkPrice.toFixed(2)}</td>
                                    </tr>`;
                            
                        }
 
                    });

                    itemsHtml += `</table><hr>`;
                    orderDetailsDiv.innerHTML = itemsHtml;


                    // SUMMARY TABLE
                    orderTax = subtotal * tax;
                    totalPrice = subtotal + orderTax;
                    orderSummaryDiv.innerHTML = `
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
                        <tr><th style="text-align: left; padding: 5px 0;">Subtotal: $${subtotal.toFixed(2)}</th></tr>
                        <tr><th style="text-align: left; padding: 5px 0;">Tax: $${orderTax.toFixed(2)}</th></tr>
                        <tr><th style="text-align: left; padding: 5px 0;">Total: $${totalPrice.toFixed(2)}</th></tr>
                    </table>
                    `;

                } else {
                    // NO VALID DRINKS
                    getStartedMessage.style.display = "none";
                    confirmationBox.style.display = "block";
                    orderDetailsDiv.innerHTML = `<p style="color:red;">${data.message || "Failed to parse a valid order from transcription: " + data.transcription}</p>`;
                    orderSummaryDiv.innerHTML = "";
                    confirmButton.disabled = true;
                }
                loadingContainer.style.display = "none";

            }; 

            mediaRecorder.start();
            startButton.disabled = true;
            stopButton.disabled = false;

        } catch (err) {
            console.error('Error accessing microphone:', err);
        }
    }


    // ORDER CONFIRM FUNCTION (send to db)
    async function confirmButtonSendToDB(){
        if (!currentOrderData || !currentOrderData.orders) return;

            confirmButton.disabled = true; 


            // Map the current display data back into the clean payload structure for saving
            const itemsToSave = currentOrderData.orders.map(item => ({
                drinkID: item.drinkId,
                drinkName: item.drink,
                drinkPrice : item.drinkPrice,
                size: item.size,
                iceLevel: item.iceLevel,
                sweetnessLevel: item.sweetnessLevel,
                topping: item.toppings, 
                quantity: item.quantity,
                totalPrice: totalPrice,
            }));

            console.log(itemsToSave);


            const saveResponse = await fetch('/api/confirm-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ items: itemsToSave })
            });

            const saveResult = await saveResponse.json();
            console.log("Save result:", saveResult);

            if (saveResult.success) {
                window.location.href = `/customer/orderConfirmation?orderId=${saveResult.orderId}` ;
            } else {
                resetUI("Failed to save order: " + (saveResult.message || saveResult.error));
            }
    }

});