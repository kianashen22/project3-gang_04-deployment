console.log("JS file loaded");

let selectedOptions = [];

const optionList = document.getElementById('optionDisplay');
const ingredientSelect = document.getElementById('ingredientSelect');
const searchBtn = document.getElementById('searchDrinksButton');

ingredientSelect.addEventListener('change', (e) => {
    console.log("selected an option: ", ingredientSelect.value);
    const value = ingredientSelect.value;
    const text = ingredientSelect.options[ingredientSelect.selectedIndex].text;

    if (!value || selectedOptions.some(o => o.id === value)) return;

    selectedOptions.push({ id: value, name: text });
    renderOptions();
});

function removeOption(id) {
    selectedOptions = selectedOptions.filter(opt => opt.id !== id);
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

searchBtn.addEventListener('click', async () => {
    const ingredientIds = selectedOptions.map(opt => opt.id);

    const response = await fetch("/searchIngredient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: ingredientIds })
    });

    const data = await response.json();
    console.log(data);
});