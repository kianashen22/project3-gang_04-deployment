console.log("JS file loaded");

let selectedOptions = [];
let selectedIndices = [];

const optionList = document.getElementById('optionDisplay');
const ingredientSelect = document.getElementById('ingredientSelect');
const selectedIngredients = document.getElementById('selectedIngredients');

const searchBtn = document.getElementById('searchDrinksButton');

function updateHidden() {
    selectedIngredients.value = JSON.stringify(selectedIndices);
}

ingredientSelect.addEventListener('change', (e) => {
    // console.log("selected an option: ", ingredientSelect.value);
    const value = ingredientSelect.value;
    const text = ingredientSelect.options[ingredientSelect.selectedIndex].text;

    if (!value || selectedOptions.some(o => o.id === value)) return;

    selectedOptions.push({ id: value, name: text });
    selectedIndices.push(Number(value));

    updateHidden();
    renderOptions();
});

function removeOption(id) {
    selectedOptions = selectedOptions.filter(opt => opt.id !== id);
    selectedIndices = selectedIndices.filter(index => index !== Number(id));

    updateHidden();
    renderOptions();
}

function renderOptions() {
    optionList.innerHTML = '';

    selectedOptions.forEach((option, index) => {
        const pill = document.createElement('span');
        pill.textContent = option.name + " x";
        pill.style.padding = "5px 10px";
        pill.style.margin = "5px";
        pill.style.background = "#ddd";
        pill.style.borderRadius = "20px";
        pill.style.cursor = "pointer";

        pill.onclick = () => removeOption(option.id);
        optionList.appendChild(pill);
    });
}

// Helper to attach click listeners to drink buttons inside a container
function attachDrinkButtonListeners(container) {
    if (!container) return;
    const buttons = container.querySelectorAll('.drinkButton');
    // If `setDrinkNameIDPrice` is available globally (from customerHandler.js), use it.
    buttons.forEach(btn => {
        // Remove any existing listener to avoid duplicate handlers
        btn.replaceWith(btn.cloneNode(true));
    });
    // Re-query after cloning
    const freshButtons = container.querySelectorAll('.drinkButton');
    freshButtons.forEach(btn => {
        if (typeof window.setDrinkNameIDPrice === 'function') {
            btn.addEventListener('click', window.setDrinkNameIDPrice);
        } else if (typeof setDrinkNameIDPrice === 'function') {
            btn.addEventListener('click', setDrinkNameIDPrice);
        } else {
            // Fallback: delegate action using dataset and window location
            btn.addEventListener('click', function () {
                const drinkId = this.dataset.drinkId;
                const url = "/customer/" + drinkId + "/customize";
                localStorage.setItem('drinkId', this.dataset.drinkId);
                localStorage.setItem('drinkName', this.dataset.drinkName);
                localStorage.setItem('drinkPrice', this.dataset.drinkPrice);
                window.location.href = url;
            });
        }
    });
}

searchBtn.addEventListener('click', async(e) => {
    updateHidden();
    console.log('click');
    console.log("selected indices: ", selectedIndices);

    const res = await fetch('/customer/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                selectedIngredients: selectedIndices
            })
        });
    const data = await res.json();
    document.getElementById('searchResults').innerHTML = data.html;

    // Re-attach click listeners for newly injected drink buttons
    const searchResultsContainer = document.getElementById('searchResults');
    attachDrinkButtonListeners(searchResultsContainer);
});