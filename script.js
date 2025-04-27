const dropzone = document.getElementById('dropzone');
const fileinput = document.getElementById('fileinput');
const svgoutput = document.getElementById('svgoutput');
const preview = document.getElementById('preview');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const download = document.getElementById('download');

dropzone.addEventListener('click', () => fileinput.click());
dropzone.addEventListener('dragover', e => {
    e.preventDefault();
    dropzone.classList.add('hover');
});
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('hover'));
dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('hover');
    const file = e.dataTransfer.files[0];
    if (file) processImage(file);
});
fileinput.addEventListener('change', () => {
    const file = fileinput.files[0];
    if (file) processImage(file);
});

function processImage(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
            preview.src = img.src;
            preview.style.display = 'block';

            // Bild vor SVG-Umwandlung auf Canvas runterskalieren
            const MAX_CANVAS_SIZE = 1000;
            let scale = Math.min(MAX_CANVAS_SIZE / img.width, MAX_CANVAS_SIZE / img.height, 1);
            let scaledWidth = Math.round(img.width * scale);
            let scaledHeight = Math.round(img.height * scale);
            canvas.width = scaledWidth;
            canvas.height = scaledHeight;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);

            // ImageTracer erwartet eine Bild-URL, nicht das Canvas-Element selbst
            ImageTracer.imageToSVG(canvas.toDataURL(), function (svgString) {
                // SVG-Größe berechnen (wiederhergestellt!)
                const MAX_SIZE = 200;
                let widthMatch = svgString.match(/width="([0-9.]+)"/);
                let heightMatch = svgString.match(/height="([0-9.]+)"/);
                let width = widthMatch ? widthMatch[1] : canvas.width;
                let height = heightMatch ? heightMatch[1] : canvas.height;
                let widthNum = parseFloat(width);
                let heightNum = parseFloat(height);
                let dispWidth = widthNum;
                let dispHeight = heightNum;
                if (widthNum > heightNum) {
                    dispHeight = Math.round(heightNum * (MAX_SIZE / widthNum));
                    dispWidth = MAX_SIZE;
                } else {
                    dispWidth = Math.round(widthNum * (MAX_SIZE / heightNum));
                    dispHeight = MAX_SIZE;
                }
                svgString = svgString.replace(/(width|height)="[^"]*"/g, '');
                // viewBox und width/height setzen
                svgString = svgString.replace(
                    /<svg([^>]*)/i,
                    `<svg$1 viewBox="0 0 ${width} ${height}" width="${dispWidth}" height="${dispHeight}"`
                );
                svgoutput.innerHTML = svgString;
                // Download-Link nur anzeigen, aber href NICHT mehr setzen
                download.style.display = 'inline-block';
            }, {
                numberofcolors: 10,   // Weniger Farben
                strokewidth: 1,       // Keine Kontur
                blur: 2,              // Glättung
                ltres: 5,             // Linienvereinfachung
                qtres: 5,             // Kurvenvereinfachung
                roundcoords: 2,       // Gerundete Koordinaten
                scale: 1              // Keine Skalierung
                // pal: ['#000000','#ffffff'] // Eigene Palette optional
            });
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Download-Link: Blob erst beim Klick erzeugen
download.addEventListener('click', function (e) {
    const svgElem = svgoutput.querySelector('svg');
    if (!svgElem) {
        e.preventDefault();
        return;
    }
    // Sicherstellen, dass SVG Inhalt hat
    const svgData = '\uFEFF' + svgElem.outerHTML;
    const blob = new Blob([svgData], {type: 'image/svg+xml'});
    const url = URL.createObjectURL(blob);
    download.href = url;
    // Blob-URL erst nach 5 Sekunden freigeben (nicht sofort!)
    setTimeout(() => URL.revokeObjectURL(url), 5000);
});
