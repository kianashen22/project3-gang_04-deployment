


// Google Translate API button drop down (nav bar)

document.getElementById("translateButton").addEventListener("click", () => {
    const container = document.getElementById("google_translate_element");
    const selectBox = container.querySelector("select");

    if (!selectBox) {
        console.log("Google Translate is still loading...");
        return;
    }

    // toggle visibility
    container.style.display =
        (container.style.display === "none") ? "block" : "none";
});

// Google Translate API button drop down (home)

document.getElementById("translateButtonHome").addEventListener("click", () => {
    const container = document.getElementById("google_translate_element_home");
    const selectBox = container.querySelector("select");

    if (!selectBox) {
        console.log("Google Translate is still loading...");
        return;
    }

    // toggle visibility
    container.style.display =
        (container.style.display === "none") ? "block" : "none";
});
