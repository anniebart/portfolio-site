#!/usr/bin/env node

import fs, { readFileSync } from 'fs'
import path from 'path'
import matter from 'gray-matter'
import marked from 'marked'
import mkdirp from 'mkdirp'
import glob from 'glob'
import Jimp from 'jimp'
import YAML from 'yaml'

//links will contain objects with links + titles to all the posts
const links = []
//parse the markdown file, convert to html
const readFile = (filename) =>{
    const rawFile = fs.readFileSync(filename, 'utf8')
    const parsed = matter(rawFile)
    const html = marked(parsed.content)
    
    return {...parsed, html}
}

//dither + resize image using Jimp
const ditherImage = (url) => Jimp.create(url)
  .then(image => {
    let img = image.clone()
    img.dither16()
    const basename = path.basename(url)
    const outPath = path.join(path.resolve(), '/public/assets/images')
    img.writeAsync(outPath + basename)            // ordered dithering of the image and reduce color space to 16-bits (RGB565)
  })
  .catch(err => {
    console.log(err)
  });

const processImages = (img) =>{
    console.log(img)
    
}


 

//change the file extension from .md to .html
const getOutputFilename = (filename, outPath)=>{
    const basename = path.basename(filename)
    const newFilename = basename.substring(0, basename.length - 3) + '.html'
    const outfile = path.join(outPath, newFilename)
    return outfile
}


const saveFile = (filename, contents) =>{
    const dir = path.dirname(filename)
    mkdirp.sync(dir)
    fs.writeFileSync(filename, contents)

}

// use template to create individual html pages for each markdown file
const makePost = (template, {date, title, content}) => 
    template
        .replace(/<!--date-->/g, date)
        .replace(/<!--title-->/g, title)
        .replace(/<!--content-->/g, content)


    
       
const processFile = (filename, template, outPath) =>{
    const file = readFile(filename)
    const outFileName = getOutputFilename(filename, outPath)
    const templated = makePost(template, 
        {date: file.data.date, 
        title: file.data.title, 
        content: file.html})
        saveFile(outFileName, templated)
        const parentDir = path.basename(path.dirname(filename))
        
        
        if (parentDir == 'posts'){
            const link = path.basename(outFileName)
            const cat = file.data.category
            let title = file.data.title
            if (title.length > 20) title = title.slice(0, 20) + '...'
            const date = file.data.date
            links.push({title: title, date: date, link: link, cat: cat })
        }
        
        }
//putting it all together -> reading, parsing, processing + writing html files from markdown files and saving it to a dist folder. 
const main = () => {
    const srcPath = path.join(path.resolve(), 'src')
    const outPath = path.join(path.resolve(), 'dist')
    const template = readFileSync(
        path.join(srcPath, 'template.html'), 
        'utf8'
        )
    const filenames = glob.sync(srcPath + '/pages/**/*.md')

    filenames.forEach((filename) =>{
        processFile(filename, template, outPath)
    })
    
  
   

    
    
}
main();

//make index page template
const makeIndexPage = (template, content) =>
    template
        .replace(/{{content}}/g, content)
        // .replace(/{{title}}/g, matter('config.yaml').data.title)




//create index page with links to all pages
const index = () =>{
    const srcPath = path.join(path.resolve(), 'src')
    const indexTemplate = readFileSync(
        path.join(srcPath, 'homeTemplate.html'), 
        'utf8'
        )
    const outPath = path.join(path.resolve(), 'dist')
    let str = ''
    console.log(links)
    links.sort((a, b)=>{
        if (a.date > b.date) return -1
        else return 1
    })
    console.log(links)
    const list = links.forEach(item=>{
        str +=`<a href="${item.link}"><li class="postSquare"> <p>${item.title} </p> <p>${item.cat}</p> <p>${item.date} </p></li></a>\n`
    })

    const indexPage = makeIndexPage(indexTemplate, str)
    saveFile(outPath + '/index.html', indexPage)
}
index();


export default {main, index}




