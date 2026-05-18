const fs = require('fs');

try {
    let html = fs.readFileSync('index.html', 'utf8');

    // Extract the CSS
    const styleRegex = /<style>([\s\S]*?)<\/style>/;
    const styleMatch = html.match(styleRegex);
    if (styleMatch) {
        fs.writeFileSync('style.css', styleMatch[1].trim());
        html = html.replace(styleRegex, '<link rel="stylesheet" href="style.css" />');
        console.log('Extracted CSS to style.css');
    }

    // Extract the JS (excluding schema scripts which have type="application/ld+json")
    const scriptRegex = /<script>([\s\S]*?)<\/script>/;
    const scriptMatch = html.match(scriptRegex);
    if (scriptMatch) {
        fs.writeFileSync('index.js', scriptMatch[1].trim());
        html = html.replace(scriptRegex, '<script src="index.js"></script>');
        console.log('Extracted JS to index.js');
    }

    fs.writeFileSync('index.html', html);
    console.log('Updated index.html');
} catch (e) {
    console.error('Error:', e);
}
