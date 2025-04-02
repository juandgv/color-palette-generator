const baseColorInput = document.getElementById("base-color");
const rgbInput = document.getElementById("rgb-input");
const hslInput = document.getElementById("hsl-input");
const fontFamilySelect = document.getElementById("font-family");
const fontSizeSelect = document.getElementById("font-size");
const fontWeightSelect = document.getElementById("font-weight");
const wcagStandardSelect = document.getElementById("wcag-standard");
const textPreview = document.getElementById("text-preview");
const generateBtn = document.getElementById("generate-btn");
const paletteDiv = document.getElementById("palette");
const themeToggle = document.querySelector(".theme-toggle");

// Event Listeners
generateBtn.addEventListener("click", generatePalette);
baseColorInput.addEventListener("input", updateColorInputs);
rgbInput.addEventListener("input", handleRGBInput);
hslInput.addEventListener("input", handleHSLInput);
fontFamilySelect.addEventListener("change", updateFontFamily);
fontSizeSelect.addEventListener("change", updateFontSize);
fontWeightSelect.addEventListener("change", updateFontWeight);
wcagStandardSelect.addEventListener("change", generatePalette);
themeToggle.addEventListener("click", toggleDarkMode);

function updateColorInputs() {
    const color = tinycolor(baseColorInput.value);
    rgbInput.value = `${color.toRgb().r}, ${color.toRgb().g}, ${color.toRgb().b}`;
    hslInput.value = `${Math.round(color.toHsl().h)}, ${Math.round(color.toHsl().s * 100)}%, ${Math.round(color.toHsl().l * 100)}%`;
    
    // Update text preview background color
    textPreview.style.backgroundColor = color.toHexString();
    
    // Update text color based on contrast
    const contrastWithWhite = tinycolor.readability(color, "#ffffff");
    const contrastWithBlack = tinycolor.readability(color, "#000000");
    textPreview.style.color = contrastWithWhite > contrastWithBlack ? "#ffffff" : "#000000";
    
    generatePalette();
}

function handleRGBInput() {
    const [r, g, b] = rgbInput.value.split(",").map(n => parseInt(n.trim()));
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        const color = tinycolor({ r, g, b });
        baseColorInput.value = color.toHexString();
        hslInput.value = `${Math.round(color.toHsl().h)}, ${Math.round(color.toHsl().s * 100)}%, ${Math.round(color.toHsl().l * 100)}%`;
        generatePalette();
    }
}

function handleHSLInput() {
    const [h, s, l] = hslInput.value.split(",").map(n => parseInt(n.trim().replace("%", "")));
    if (!isNaN(h) && !isNaN(s) && !isNaN(l)) {
        const color = tinycolor({ h, s: s / 100, l: l / 100 });
        baseColorInput.value = color.toHexString();
        rgbInput.value = `${color.toRgb().r}, ${color.toRgb().g}, ${color.toRgb().b}`;
        generatePalette();
    }
}

function updateFontFamily() {
    textPreview.style.fontFamily = fontFamilySelect.value;
}

function updateFontSize() {
    textPreview.style.fontSize = fontSizeSelect.value;
}

function updateFontWeight() {
    textPreview.style.fontWeight = fontWeightSelect.value;
}

function generatePalette() {
    const baseColor = baseColorInput.value;
    const wcagStandard = wcagStandardSelect.value;
    paletteDiv.innerHTML = "";
    paletteDiv.classList.remove("visible");

    // Generate 20 color variations
    const colors = generateColorPalette(baseColor, wcagStandard);

    // Create color boxes with staggered animation
    colors.forEach(({ color, name }, index) => {
        const box = document.createElement("div");
        box.className = "color-box";
        box.style.backgroundColor = color;
        box.setAttribute("role", "listitem");
        
        const contrastWhite = tinycolor.readability(color, "#ffffff");
        const contrastBlack = tinycolor.readability(color, "#000000");
        const bestContrast = contrastWhite > contrastBlack ? "white" : "black";
        
        box.innerHTML = `
            <span class="color-name">${name}</span>
            <span class="hex-value">${color}</span>
            <span class="contrast-indicator">${getContrastIndicator(contrastWhite, contrastBlack, wcagStandard)}</span>
        `;
        
        box.style.color = bestContrast;
        box.style.animationDelay = `${index * 0.1}s`;
        
        // Copy color on click
        box.addEventListener("click", () => {
            navigator.clipboard.writeText(color);
            showToast(`Color ${color} copied to clipboard`);
        });

        paletteDiv.appendChild(box);
    });

    // Show palette with animation
    setTimeout(() => {
        paletteDiv.classList.add("visible");
    }, 100);
}

function generateColorPalette(baseColor, wcagStandard) {
    const color = tinycolor(baseColor);
    const hsl = color.toHsl();
    const palette = [];
    const minContrast = wcagStandard === "AAA" ? 7 : 4.5;
    
    // Generate 20 color variations
    for (let i = 0; i < 20; i++) {
        const variation = i / 19; // 0 to 1
        const lightness = variation;
        const saturation = 0.7 + (Math.sin(variation * Math.PI) * 0.3);
        
        const newColor = tinycolor({
            h: hsl.h,
            s: saturation,
            l: lightness
        });

        // Ensure colorblind-safe contrast
        const contrastWithWhite = tinycolor.readability(newColor, "#ffffff");
        const contrastWithBlack = tinycolor.readability(newColor, "#000000");
        
        if (contrastWithWhite >= minContrast || contrastWithBlack >= minContrast) {
            palette.push({
                color: newColor.toHexString(),
                name: getColorName(variation)
            });
        }
    }

    return palette;
}

function getColorName(variation) {
    if (variation < 0.2) return "Lightest";
    if (variation < 0.4) return "Light";
    if (variation < 0.6) return "Medium";
    if (variation < 0.8) return "Dark";
    return "Darkest";
}

function getContrastIndicator(contrastWhite, contrastBlack, wcagStandard) {
    const minContrast = wcagStandard === "AAA" ? 7 : 4.5;
    const bestContrast = Math.max(contrastWhite, contrastBlack);
    if (bestContrast >= minContrast) return wcagStandard;
    return "❌";
}

function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
}

function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Initialize
generatePalette();
updateFontFamily();
updateFontSize();
updateFontWeight();
