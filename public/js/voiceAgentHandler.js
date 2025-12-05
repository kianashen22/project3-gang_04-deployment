
document.addEventListener("DOMContentLoaded", () => {

    const assistantImg = document.getElementById("assistantImgMenu");

    // Set Assistant Image
    const assignedAssistant = sessionStorage.getItem("assignedAssistant");
    if (assistantImg && assignedAssistant) {
        assistantImg.src = assignedAssistant;
        assistantImg.style.display = "block";
    }

    // Get Voice Recording and UI elements
    const startButton = document.getElementById("startButton");
    const stopButton = document.getElementById("endButton");
    const playButton = document.getElementById("playButton");
    const audioElement = document.getElementById('audioPlayback');

    // Confirmation UI Elements (from menuAsst.ejs)
    const getStartedMessage = document.getElementById("getStartedMessage");
    const confirmationBox = document.getElementById("orderConfirmationBox");
    const orderDetailsDiv = document.getElementById("parsedOrderDetails");
    const orderSummaryDiv = document.getElementById("orderSummary");
    const confirmButton = document.getElementById("confirmOrderButton");
    const cancelButton = document.getElementById("cancelButton");


    // TEMP VALUES
    const MOCK_TOPPING_PRICE = 0.75;
    const MOCK_TAX_RATE = 0.0825;
    const MOCK_BASE_PRICE = 5.00; // Stand-in for DB lookup

    let mediaRecorder;
    let audioChunks = [];
    let audioStream;
    let currentOrderData = null; 

    confirmationBox.style.display = "none";

    // 1. Function to reset the UI state (UNCOMMENTED AND COMPLETED)
    const resetUI = (message) => {
        // Hide Confirmation, Show Recording Start
        confirmationBox.style.display = "none";
        getStartedMessage.style.display = "block";
        
        startButton.disabled = false;
        stopButton.disabled = true; // Ensure stop is disabled
        playButton.disabled = true; // Ensure play is disabled
        
        orderDetailsDiv.innerHTML = "";
        orderSummaryDiv.innerHTML = "";
        currentOrderData = null;
        alert(message); 
    };

    // Helper to calculate totals on the frontend for rendering (if backend doesn't send totals)
    //CHANGE THIS ONCE DB GETS PRICE AND WHAT NOT
    const calculateAndTransformOrder = (parsedOrders, transcription) => {
        let grandSubtotal = 0;

        const transformedItems = parsedOrders.map(item => {
            // Using mock prices since controller does not access DB
            const basePrice = MOCK_BASE_PRICE; // Mocked single price for all
            
            const hasTopping = item.toppings && item.toppings.length > 0 && item.toppings[0].toLowerCase() !== "no toppings";
            const quantity = item.quantity || 1;
            
            const itemBaseCost = basePrice * quantity;
            const itemToppingCost = (hasTopping ? MOCK_TOPPING_PRICE : 0) * quantity;
            const itemSubtotal = itemBaseCost + itemToppingCost;
            
            grandSubtotal += itemSubtotal;

            return {
                // Fields for Confirmation Display
                drink_name: item.drink,
                quantity: quantity,
                size: item.size,
                sweetness: item.sweetness,
                ice_level: item.ice,
                topping: hasTopping ? item.toppings.join(', ') : 'None',
                
                // Fields for Calculation/Save Payload
                item_subtotal: itemSubtotal.toFixed(2),
                base_price: basePrice, // Used for reference
                topping_fee: (hasTopping ? MOCK_TOPPING_PRICE : 0) // Used for save payload
            };
        });

        const grandTax = grandSubtotal * MOCK_TAX_RATE;
        const grandTotal = grandSubtotal + grandTax;

        return {
            transcription: transcription,
            items: transformedItems,
            grand_subtotal: grandSubtotal.toFixed(2),
            grand_tax: grandTax.toFixed(2),
            grand_total: grandTotal.toFixed(2)
        };
    };



    // START RECORDING 
    startButton.addEventListener("click", async () => {
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
                playButton.disabled = false;
                
                
                // DISPLAY ORDER DETAILS
                if (data.parsedOrder && data.parsedOrder.orders && data.parsedOrder.orders.length > 0) {
                    
                    // Transform raw Zod output into the format needed for calculation and rendering
                    const calculatedOrder = calculateAndTransformOrder(
                        data.parsedOrder.orders, 
                        data.transcription
                    );

                    currentOrderData = calculatedOrder;
                    confirmButton.disabled = false;

                    confirmationBox.style.display = "block"; 
                    confirmationBox.scrollIntoView({ behavior: "smooth", block: "center" });

                    // ORDER DETAILS
                    let itemsHtml = `<p><strong>Transcription:</strong> <em>${calculatedOrder.transcription}</em></p><hr>`;
                    itemsHtml += `<table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
                                    <tr>
                                        <th style="text-align: left; padding: 5px 0;">Item</th>
                                        <th style="text-align: right; padding: 5px 0;">Qty</th>
                                        <th style="text-align: right; padding: 5px 0;">Price</th>
                                    </tr>`;

                    currentOrderData.items.forEach(item => {
                        const modifications = [
                            item.size,
                            item.sweetness,
                            item.ice_level,
                            item.topping
                        ].filter(val => val && val.trim() !== "" && val !== "null" && val !== "None").join(' | ');

                        itemsHtml += `<tr style="border-top: 1px dashed #ddd;">
                                        <td style="text-align: left; padding-right: 10px; padding-top: 5px;">
                                            <strong>${item.drink_name}</strong>
                                            <div style="font-size: 0.8em; color: #555;">${modifications || "Standard"}</div>
                                        </td>
                                        <td style="text-align: right; padding-top: 5px;">${item.quantity}</td>
                                        <td style="text-align: right; padding-top: 5px;">$${item.item_subtotal}</td>
                                    </tr>`;
                    });

                    itemsHtml += `</table><hr>`;
                    orderDetailsDiv.innerHTML = itemsHtml;


                    // SUMMARY TABLE
                    orderSummaryDiv.innerHTML = `
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
                        <tr><th style="text-align: left; padding: 5px 0;">Subtotal: </th> </tr>
                        <tr><th style="text-align: left; padding: 5px 0;">Tax: </th></tr>
                        <tr><th style="text-align: left; padding: 5px 0;">Total: </th></tr>
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
            }; 

            mediaRecorder.start();
            startButton.disabled = true;
            stopButton.disabled = false;
            playButton.disabled = true;

        } catch (err) {
            console.error('Error accessing microphone:', err);
        }
    });

    // STOP RECORDING (Existing code)
    stopButton.addEventListener("click", () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            audioStream.getTracks().forEach(track => track.stop());
        }
    });

    // PLAY RECORDING (FOR TESTING!! CAN REMOVE !!!)
    playButton.addEventListener("click", () => {
        if (audioElement.src) {
            audioElement.play();
        }
    });


    // CONFIRM BUTTON LISTENER (Sends final, cleaned order back for database save)
    confirmButton.addEventListener("click", async () => {
        if (!currentOrderData || !currentOrderData.items) return;

        confirmButton.disabled = true; 

        // Map the current display data back into the clean payload structure for saving
        const itemsToSave = currentOrderData.items.map(item => ({
            drink_name: item.drink_name,
            size: item.size,
            ice_level: item.ice_level,
            sweetness: item.sweetness,
            topping: item.topping, 
            quantity: item.quantity
        }));


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
            resetUI(`Order confirmed successfully! Saved ${saveResult.savedItems.length} item(s).`);
        } else {
            resetUI("Failed to save order: " + (saveResult.message || saveResult.error));
        }
    });

    // CANCEL BUTTON LISTENER
    cancelButton.addEventListener("click", () => {
        resetUI("Order cancelled. Please record again.");
    });
});