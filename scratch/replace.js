import fs from 'fs';
import path from 'path';

const filePaths = [
    'd:/TAXI PROJECTS/vikas/index.html',
    'd:/TAXI PROJECTS/vikas/index.js'
];

for (const fp of filePaths) {
    if (!fs.existsSync(fp)) continue;
    
    let content = fs.readFileSync(fp, 'utf8');
    
    // Replace text
    content = content.replace(/Liverpool Cabs/g, 'North Sydney Cabs');
    content = content.replace(/liverpoolcabs/g, 'northsydneycabs');
    content = content.replace(/Liverpool, New South Wales/g, 'North Sydney, New South Wales');
    content = content.replace(/Liverpool, NSW/g, 'North Sydney, NSW');
    content = content.replace(/Liverpool NSW/g, 'North Sydney NSW');
    content = content.replace(/Liverpool/g, 'North Sydney');
    
    // Also remove the Announcement bar
    content = content.replace(/<!-- Announcement -->[\s\S]*?<\/div>\s*/g, '');
    
    // Also remove the Popular routes section entirely from HTML
    content = content.replace(/<!-- Popular routes -->[\s\S]*?<\/section>\s*/g, '');
    
    // Remove the Popular routes nav link
    content = content.replace(/<li><a href="#routes">Popular Routes<\/a><\/li>/g, '');
    content = content.replace(/<a href="#routes" onclick="closeMenu\(\)">Popular Routes<\/a>/g, '');
    
    // Remove FAQ section
    content = content.replace(/<!-- FAQ -->[\s\S]*?<\/section>\s*/g, '');
    content = content.replace(/<li><a href="#faq">FAQ<\/a><\/li>/g, '');
    content = content.replace(/<a href="#faq" onclick="closeMenu\(\)">FAQ<\/a>/g, '');

    // Write back
    fs.writeFileSync(fp, content, 'utf8');
    console.log(`Updated ${fp}`);
}
